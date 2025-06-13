from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from app.models.cashback import Cashback
from app.models.cashback_program import CashbackProgram
from app.models.company import Company
from sqlalchemy import func

def assign_cashback(db: Session, user_id: str, program_id: str, amount_spent: float) -> Cashback:
    program = db.get(CashbackProgram, program_id)
    if not program or not program.is_active:
        raise ValueError("Programa de cashback inválido ou inativo")
    value = (amount_spent * float(program.percent)) / 100.0
    expires = datetime.utcnow() + timedelta(days=program.validity_days)
    cb = Cashback(
        user_id=user_id,
        program_id=program_id,
        amount_spent=amount_spent,
        cashback_value=value,
        assigned_at=datetime.utcnow(),
        expires_at=expires,
        is_active=True,
    )
    db.add(cb)
    db.commit()
    db.refresh(cb)
    return cb


def get_cashbacks_by_user(
    db: Session, user_id: str, skip: int = 0, limit: int = 10
) -> List[Cashback]:
    return (
        db.query(Cashback)
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
) -> List[Cashback]:
    return (
        db.query(Cashback)
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