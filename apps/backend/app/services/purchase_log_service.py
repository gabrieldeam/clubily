### backend/app/services/purchase_log_service.py ###
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from decimal import Decimal
from app.models.purchase_log import PurchaseLog

DEF_WINDOW_CACHE = 30  # days stored when counting frequency

def log_purchase(db: Session, user_id: str, company_id: str, amount: Decimal, item_ids: list[str]):
    log = PurchaseLog(
        user_id=user_id,
        company_id=company_id,
        amount=amount,
        item_ids=item_ids or None
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def count_purchases(db: Session, user_id: str, company_id: str, window_days: int):
    start = datetime.utcnow() - timedelta(days=window_days)
    return db.query(PurchaseLog).filter(
        PurchaseLog.user_id==user_id,
        PurchaseLog.company_id==company_id,
        PurchaseLog.created_at>=start
    ).count()