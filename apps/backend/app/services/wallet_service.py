# backend/app/services/wallet_service.py
from sqlalchemy.orm import Session
from app.models.wallet import Wallet
from decimal import Decimal

def get_or_create_wallet(db: Session, company_id: str) -> Wallet:
    w = db.query(Wallet).filter_by(company_id=company_id).first()
    if not w:
        w = Wallet(company_id=company_id, balance=Decimal(0))
        db.add(w)
        db.commit()
        db.refresh(w)
    return w

def credit_wallet(db: Session, company_id: str, amount: Decimal) -> Wallet:
    w = get_or_create_wallet(db, company_id)
    w.balance += amount
    db.commit()
    db.refresh(w)
    return w

def get_wallet_balance(db: Session, user_id: str) -> Decimal:
    w = db.query(Wallet).filter_by(user_id=user_id).first()
    return w.balance if w else Decimal("0.00")

def debit_wallet(db: Session, user_id: str, amount: Decimal) -> None:
    w = db.query(Wallet).filter_by(user_id=user_id).with_for_update().first()
    if not w or w.balance < amount:
        raise ValueError("Saldo insuficiente")
    w.balance -= amount
    db.commit()