from sqlalchemy.orm import Session
from datetime import datetime
from app.models.cashback import Cashback
from app.models.cashback_program import CashbackProgram

def assign_cashback(db: Session, user_id: str, program_id: str, amount_spent: float) -> Cashback:
    program = db.get(CashbackProgram, program_id)
    if not program or not program.is_active:
        raise ValueError("Programa de cashback inválido ou inativo")
    value = (amount_spent * float(program.percent)) / 100.0
    cb = Cashback(
        user_id=user_id,
        program_id=program_id,
        amount_spent=amount_spent,
        cashback_value=value,
        assigned_at=datetime.utcnow(),
        expires_at=program.valid_until,
        is_active=True,
    )
    db.add(cb)
    db.commit()
    db.refresh(cb)
    return cb


def get_cashbacks_by_user(db: Session, user_id: str):
    return db.query(Cashback).filter(Cashback.user_id == user_id).all()