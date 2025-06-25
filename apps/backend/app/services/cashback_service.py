from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from typing import List
from app.models.cashback import Cashback
from app.models.cashback_program import CashbackProgram
from app.models.company import Company
from sqlalchemy import func
from decimal import Decimal
from app.services.wallet_service import get_wallet_balance, debit_wallet
from app.services.wallet_service import deposit_to_user_wallet

def expire_overdue_cashbacks(db: Session) -> int:
    """
    Marca todos os cashbacks que já passaram de expires_at e ainda estão is_active=True
    como is_active=False e debita o valor da carteira correspondente.
    Retorna o número de cashbacks expirados.
    """
    now = datetime.utcnow()
    # 1) busca todos que expiraram mas continuam ativos
    expired_list = (
        db.query(Cashback)
          .filter(Cashback.expires_at < now, Cashback.is_active == True)
          .all()
    )
    count = 0
    for cb in expired_list:
        # inativa o cashback
        cb.is_active = False
        # debita o valor daquela carteira (user_id, company_id)
        company_id = str(cb.program.company_id)
        debit_wallet(db, cb.user_id, company_id, float(cb.cashback_value))
        count += 1

    if count:
        db.commit()
    return count

def assign_cashback(db: Session, user_id: str, program_id: str, amount_spent: float) -> Cashback:
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
    fee = Decimal("0.10")
    balance = get_wallet_balance(db, company_id)
    if balance < fee:
        raise ValueError("Saldo insuficiente na carteira da empresa para associação de cashback (custa R$0,10)")
    debit_wallet(db, company_id, fee)

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
    db.commit()
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

