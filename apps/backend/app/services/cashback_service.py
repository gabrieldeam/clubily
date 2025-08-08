from sqlalchemy.orm import Session, joinedload, selectinload
from datetime import datetime, timedelta, timezone
import logging
from typing import List
from app.models.cashback import Cashback
from app.models.cashback_program import CashbackProgram
from ..schemas.cashback_program import ProgramUsageAssociation
from app.models.fee_setting import SettingTypeEnum
from app.models.company import Company
from sqlalchemy import func
from decimal import Decimal
from app.services.wallet_service import get_wallet_balance, debit_wallet
from app.services.wallet_service import deposit_to_user_wallet, withdraw_user_wallet, get_user_wallet
from app.services.fee_setting_service import get_effective_fee
from app.models.wallet_transaction import WalletTransaction

logger = logging.getLogger(__name__)

def expire_overdue_cashbacks(db: Session) -> int:
    """
    Expira (is_active=False) só o que realmente sobrou de cada cashback vencido,
    seguindo FIFO e registrando "Cashback expirado" no histórico.
    """
    # pega o timestamp atual com timezone UTC
    now = datetime.now(timezone.utc)

    # 1) bloqueia todas as linhas de Cashback ativas, carrega o programa em subquery
    all_active = (
        db.query(Cashback)
          .options(selectinload(Cashback.program))
          .filter(Cashback.is_active == True)
          .order_by(Cashback.assigned_at.asc())
          .with_for_update()
          .all()
    )

    # 2) filtra só os vencidos (agora com comparação compatível)
    expired = [cb for cb in all_active if cb.expires_at < now]
    if not expired:
        return 0

    # 3) agrupa por (user_id, company_id)
    groups: dict[tuple[str, str], list[Cashback]] = {}
    for cb in all_active:
        key = (str(cb.user_id), str(cb.program.company_id))
        groups.setdefault(key, []).append(cb)

    processed = 0
    for (user_id, company_id), cbs in groups.items():
        # 4) busca histórico de débitos em ordem cronológica
        txs = (
            db.query(WalletTransaction)
              .filter_by(user_id=user_id, company_id=company_id, type="debit")
              .order_by(WalletTransaction.created_at.asc())
              .all()
        )

        # 5) calcula quanto resta de cada cashback após os débitos
        remaining: dict[str, Decimal] = {
            str(cb.id): cb.cashback_value for cb in cbs
        }
        for tx in txs:
            used = abs(tx.amount)
            for cb in cbs:
                if used <= 0:
                    break
                rem = remaining[str(cb.id)]
                if rem <= 0:
                    continue
                if rem >= used:
                    remaining[str(cb.id)] = rem - used
                    used = Decimal("0.00")
                else:
                    used -= rem
                    remaining[str(cb.id)] = Decimal("0.00")

        # 6) para cada cashback vencido, debita só o que sobrou e marca is_active=False
        for cb in expired:
            if str(cb.user_id) != user_id or str(cb.program.company_id) != company_id:
                continue
            rem = remaining.get(str(cb.id), Decimal("0.00"))
            if rem > 0:
                cb.is_active = False
                try:
                    withdraw_user_wallet(
                        db,
                        user_id=user_id,
                        company_id=company_id,
                        amount=rem,
                        description="Cashback expirado"
                    )
                except ValueError as e:
                    logger.warning(f"Erro expirando cashback {cb.id}: {e}")
                processed += 1

    # 7) faz um único commit para todas as alterações
    if processed:
        db.commit()

    return processed

def assign_cashback(db: Session, user_id: str, program_id: str, amount_spent: float,  *, autocommit: bool = True) -> Cashback:
    expire_overdue_cashbacks(db)

    program = db.get(CashbackProgram, program_id)
    if not program or not program.is_active:
        raise ValueError("Programa inválido ou inativo")

    # 1) calcula o valor de cashback
    value = (Decimal(amount_spent) * Decimal(program.percent) / Decimal("100.0")).quantize(Decimal("0.01"))

    # 2) limite de contagem
    if program.max_per_user is not None:
        now = datetime.utcnow()
        used_count = (
            db.query(Cashback)
            .filter(
                Cashback.program_id == program_id,
                Cashback.user_id    == user_id,
                Cashback.is_active  == True,
                Cashback.expires_at >= now,
            )
            .count()
        )
        if used_count >= program.max_per_user:
            raise ValueError(
                f"Você já atingiu o número máximo de usos ({program.max_per_user}) deste programa"
            )

    # 3) limite de valor mínimo
    if program.min_cashback_per_user is not None:
        total_so_far = db.query(func.coalesce(func.sum(Cashback.cashback_value), 0)) \
                         .filter(Cashback.program_id == program_id, Cashback.user_id == user_id) \
                         .scalar()
        if (Decimal(total_so_far) + value) < Decimal(program.min_cashback_per_user):
            raise ValueError(
                f"Este uso adicionaria {value:.2f} de cashback, mas o mínimo total exigido é {program.min_cashback_per_user:.2f}"
            )

    # —————— todas as validações passaram ——————

    # 4) agora sim cobra R$ 0,10 da carteira da empresa dona do programa
    company_id = str(program.company_id)
    fee = Decimal(str(get_effective_fee(db, company_id, SettingTypeEnum.cashback)))
    balance = get_wallet_balance(db, company_id)
    if balance < fee:
        raise ValueError("Saldo insuficiente na carteira da empresa para associação de cashback (custa R${fee:.2f})")
    debit_wallet(db, company_id, fee, description="retirada de créditos para taxa de cashback")

    # 5) cria o cashback
    expires = datetime.utcnow() + timedelta(days=program.validity_days)
    cb = Cashback(
        user_id        = user_id,
        program_id     = program_id,
        amount_spent   = Decimal(amount_spent).quantize(Decimal("0.01")),
        cashback_value = value,
        assigned_at    = datetime.utcnow(),
        expires_at     = expires,
        is_active      = True,
    )
    db.add(cb)
    if autocommit:
        db.commit()
        db.refresh(cb)
    else:
        db.flush()        # << necessário para tornar o objeto persistent
        db.refresh(cb) 
    deposit_to_user_wallet(
        db,
        user_id,
        str(program.company_id),
        float(cb.cashback_value),
    )
    return cb


def get_cashbacks_by_user(
    db: Session, user_id: str, skip: int = 0, limit: int = 10
) -> list[Cashback]:
    """
    Retorna o slice de cashbacks do usuário, já carregando
    program -> company para que o Pydantic possa ler os @properties.
    """
    return (
        db.query(Cashback)
          .options(
              # carrega Cashback.program e CashbackProgram.company
              joinedload(Cashback.program)
                .joinedload(CashbackProgram.company)
          )
          .filter(Cashback.user_id == user_id)
          .order_by(Cashback.assigned_at.desc())
          .offset(skip)
          .limit(limit)
          .all()
    )

def get_companies_with_cashback(
    db: Session, user_id: str, skip: int = 0, limit: int = 10
) -> List[Company]:
    # retorna distinct companies para as quais o user tem cashbacks
    return (
        db.query(Company)
          .join(Company.cashback_programs)
          .join(Cashback, Cashback.program_id == CashbackProgram.id)
          .filter(Cashback.user_id == user_id)
          .distinct()
          .offset(skip)
          .limit(limit)
          .all()
    )

def get_cashbacks_by_user_and_company(
    db: Session, user_id: str, company_id: str, skip: int = 0, limit: int = 10
) -> list[Cashback]:
    return (
        db.query(Cashback)
          .options(
              joinedload(Cashback.program)
                .joinedload(CashbackProgram.company)
          )
          .join(CashbackProgram, Cashback.program_id == CashbackProgram.id)
          .filter(
              Cashback.user_id == user_id,
              CashbackProgram.company_id == company_id
          )
          .order_by(Cashback.assigned_at.desc())
          .offset(skip)
          .limit(limit)
          .all()
    )

def list_programs_simple(db: Session, skip: int, limit: int):
    q = (
        db.query(CashbackProgram)
          .options(
              # carrega só a relação company, sem tocar em cashbacks
              joinedload(CashbackProgram.company)
          )
          .order_by(CashbackProgram.created_at.desc())
    )
    total = q.count()
    items = q.offset(skip).limit(limit).all()
    return total, items

def get_program_associations_paginated(
    db: Session, program_id: str, skip: int, limit: int
) -> tuple[int, list[ProgramUsageAssociation]]:
    base_q = (
        db.query(Cashback)
          .options(joinedload(Cashback.user).lazyload("*"))
          .filter(Cashback.program_id == program_id)
          .order_by(Cashback.assigned_at.desc())
    )
    total = base_q.count()
    rows = base_q.offset(skip).limit(limit).all()
    items = [
        ProgramUsageAssociation(
            id=cb.id,
            user_id=cb.user_id,
            user_name=cb.user.name,
            user_email=cb.user.email,
            amount_spent=float(cb.amount_spent),
            cashback_value=float(cb.cashback_value),
            assigned_at=cb.assigned_at,
            expires_at=cb.expires_at,
            is_active=cb.is_active,
            created_at=cb.created_at,
        )
        for cb in rows
    ]
    return total, items