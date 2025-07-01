# app/services/points_wallet_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from app.models.points_wallet import PointsWallet
from app.models.points_wallet_transaction import PointsWalletTransaction, TransactionType


def get_or_create_points_wallet(db: Session, company_id: str) -> PointsWallet:
    w = db.query(PointsWallet).filter_by(company_id=company_id).first()
    if not w:
        w = PointsWallet(company_id=company_id, balance=0)
        db.add(w); db.commit(); db.refresh(w)
    return w

def credit_points(db: Session, company_id: str, points: int, description: str | None = None):
    w = get_or_create_points_wallet(db, company_id)
    w.balance += points
    # registra transação
    tx = PointsWalletTransaction(
        wallet_id=w.id,
        company_id=company_id,
        type=TransactionType.CREDIT,
        amount=points,
        description=description,
    )
    db.add(tx)
    db.commit()
    db.refresh(w)
    return w

def get_points_balance(db: Session, company_id: str) -> int:
    w = db.query(PointsWallet).filter_by(company_id=company_id).first()
    return int(w.balance) if w else 0

def debit_points(db: Session, company_id: str, points: int, description: str | None = None):
    w = get_or_create_points_wallet(db, company_id)
    if w.balance < points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Saldo de pontos insuficiente"
        )
    w.balance -= points
    tx = PointsWalletTransaction(
        wallet_id=w.id,
        company_id=company_id,
        type=TransactionType.DEBIT,
        amount=points,
        description=description,
    )
    db.add(tx)
    db.commit()
    db.refresh(w)
    return w