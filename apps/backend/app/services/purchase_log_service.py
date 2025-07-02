### backend/app/services/purchase_log_service.py ###
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from decimal import Decimal
from app.models.purchase_log import PurchaseLog

DEF_WINDOW_CACHE = 30  # days stored when counting frequency

def log_purchase(db: Session, user_id: str, company_id: str, amount: Decimal):
    p = PurchaseLog(user_id=user_id, company_id=company_id, amount=amount)
    db.add(p); db.commit(); db.refresh(p)
    return p

def count_purchases(db: Session, user_id: str, company_id: str, window_days: int):
    start = datetime.utcnow() - timedelta(days=window_days)
    return db.query(PurchaseLog).filter(
        PurchaseLog.user_id==user_id,
        PurchaseLog.company_id==company_id,
        PurchaseLog.created_at>=start
    ).count()