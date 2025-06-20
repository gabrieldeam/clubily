from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from typing import List
from app.models.cashback import Cashback
from app.models.cashback_program import CashbackProgram
from app.models.company import Company
from sqlalchemy import func
from decimal import Decimal
from app.services.wallet_service import get_wallet_balance, debit_wallet

def assign_cashback(db: Session, user_id: str, program_id: str, amount_spent: float) -> Cashback:
    program = db.get(CashbackProgram, program_id)
    if not program or not program.is_active:
        raise ValueError("Programa inválido ou inativo")

    # 1) calcula o valor de cashback
    value = (Decimal(amount_spent) * Decimal(program.percent) / Decimal("100.0")).quantize(Decimal("0.01"))

    # 2) limite de contagem
    if program.max_per_user is not None:
        used_count = (
            db.query(Cashback)
              .filter(Cashback.program_id == program_id, Cashback.user_id == user_id)
              .count()
        )
        if used_count >= program.max_per_user:
            raise ValueError(f"Você já atingiu o número máximo de usos ({program.max_per_user}) deste programa")

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

def get_cashback_summary(db: Session, user_id: str) -> dict:
    q = db.query(Cashback).filter(Cashback.user_id == user_id, Cashback.is_active == True)
    total = float(q.with_entities(func.coalesce(func.sum(Cashback.cashback_value), 0)).scalar())
    next_cb = (
        q.order_by(Cashback.expires_at.asc())
         .limit(1)
         .one_or_none()
    )
    next_exp = next_cb.expires_at if next_cb else None
    return {"total_balance": total, "next_expiration": next_exp}

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

