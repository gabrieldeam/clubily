# app/services/points_wallet_service.py
from sqlalchemy.orm import Session
from decimal import Decimal
from app.models.points_wallet import PointsWallet

def get_or_create_points_wallet(db: Session, company_id: str) -> PointsWallet:
    w = db.query(PointsWallet).filter_by(company_id=company_id).first()
    if not w:
        w = PointsWallet(company_id=company_id, balance=0)
        db.add(w); db.commit(); db.refresh(w)
    return w

def credit_points(db: Session, company_id: str, points: int):
    w = get_or_create_points_wallet(db, company_id)
    w.balance += points
    db.commit(); db.refresh(w)
    return w

def get_points_balance(db: Session, company_id: str) -> int:
    w = db.query(PointsWallet).filter_by(company_id=company_id).first()
    return int(w.balance) if w else 0
