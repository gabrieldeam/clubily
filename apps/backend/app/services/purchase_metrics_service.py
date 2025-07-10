# backend/app/services/purchase_metrics_service.py
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List

from app.models.purchase_log import PurchaseLog
from app.schemas.purchase_metrics import (
    SaleByDay,
    PurchaseMetricRead,
    PurchasesPerUser,
    RevenuePerUser,
)

def _normalize_range(start_date, end_date):
    today = date.today()
    if start_date is None:
        start_date = date(today.year, today.month, 1)
    if end_date is None:
        end_date = today
    return start_date, end_date

def get_purchase_metrics(
    db: Session,
    company_id: str,
    start_date: date | None = None,
    end_date:   date | None = None
) -> PurchaseMetricRead:
    # normaliza período
    sd, ed = _normalize_range(start_date, end_date)
    sdt = datetime.combine(sd, datetime.min.time())
    edt = datetime.combine(ed, datetime.max.time())

    # totais
    total_purchases = (
        db.query(func.count(PurchaseLog.id))
          .filter(
              PurchaseLog.company_id == company_id,
              PurchaseLog.created_at >= sdt,
              PurchaseLog.created_at <= edt
          )
          .scalar()
        or 0
    )
    total_sales = float(
        db.query(func.coalesce(func.sum(PurchaseLog.amount), 0))
          .filter(
              PurchaseLog.company_id == company_id,
              PurchaseLog.created_at >= sdt,
              PurchaseLog.created_at <= edt
          )
          .scalar()
    )
    unique_buyers = (
        db.query(PurchaseLog.user_id)
          .filter(
              PurchaseLog.company_id == company_id,
              PurchaseLog.created_at >= sdt,
              PurchaseLog.created_at <= edt
          )
          .distinct()
          .count()
    )
    avg_ticket = total_sales / total_purchases if total_purchases else 0.0
    avg_purchases_per_user = total_purchases / unique_buyers if unique_buyers else 0.0

    # série diária
    day_trunc = func.date_trunc('day', PurchaseLog.created_at)
    rows = (
        db.query(
            day_trunc.label('day'),
            func.count(PurchaseLog.id).label('num_purchases'),
            func.coalesce(func.sum(PurchaseLog.amount), 0).label('revenue'),
        )
        .filter(
            PurchaseLog.company_id == company_id,
            PurchaseLog.created_at >= sdt,
            PurchaseLog.created_at <= edt
        )
        .group_by(day_trunc)
        .order_by(day_trunc)
        .all()
    )
    sales_by_day = [
        SaleByDay(day=r.day.date(), num_purchases=r.num_purchases, revenue=float(r.revenue))
        for r in rows
    ]

    return PurchaseMetricRead(
        start_date=sd,
        end_date=ed,
        total_purchases=total_purchases,
        total_sales=total_sales,
        avg_ticket=avg_ticket,
        unique_buyers=unique_buyers,
        avg_purchases_per_user=avg_purchases_per_user,
        sales_by_day=sales_by_day
    )

def get_purchase_chart(
    db: Session,
    company_id: str,
    start_date: date | None = None,
    end_date:   date | None = None
) -> List[SaleByDay]:
    sd, ed = _normalize_range(start_date, end_date)
    sdt = datetime.combine(sd, datetime.min.time())
    edt = datetime.combine(ed, datetime.max.time())

    day_trunc = func.date_trunc('day', PurchaseLog.created_at)
    rows = (
        db.query(
            day_trunc.label('day'),
            func.count(PurchaseLog.id).label('num_purchases'),
            func.coalesce(func.sum(PurchaseLog.amount), 0).label('revenue'),
        )
        .filter(
            PurchaseLog.company_id == company_id,
            PurchaseLog.created_at >= sdt,
            PurchaseLog.created_at <= edt
        )
        .group_by(day_trunc)
        .order_by(day_trunc)
        .all()
    )
    return [
        SaleByDay(day=r.day.date(), num_purchases=r.num_purchases, revenue=float(r.revenue))
        for r in rows
    ]

def get_purchases_per_user(
    db: Session,
    company_id: str,
    start_date: date | None = None,
    end_date:   date | None = None
) -> List[PurchasesPerUser]:
    sd, ed = _normalize_range(start_date, end_date)
    sdt = datetime.combine(sd, datetime.min.time())
    edt = datetime.combine(ed, datetime.max.time())

    rows = (
        db.query(
            PurchaseLog.user_id,
            func.count(PurchaseLog.id).label('purchase_count')
        )
        .filter(
            PurchaseLog.company_id == company_id,
            PurchaseLog.created_at >= sdt,
            PurchaseLog.created_at <= edt
        )
        .group_by(PurchaseLog.user_id)
        .order_by(func.count(PurchaseLog.id).desc())
        .all()
    )
    return [
        PurchasesPerUser(user_id=str(r.user_id), purchase_count=r.purchase_count)
        for r in rows
    ]

def get_revenue_per_user(
    db: Session,
    company_id: str,
    start_date: date | None = None,
    end_date:   date | None = None
) -> List[RevenuePerUser]:
    sd, ed = _normalize_range(start_date, end_date)
    sdt = datetime.combine(sd, datetime.min.time())
    edt = datetime.combine(ed, datetime.max.time())

    rows = (
        db.query(
            PurchaseLog.user_id,
            func.coalesce(func.sum(PurchaseLog.amount), 0).label('revenue')
        )
        .filter(
            PurchaseLog.company_id == company_id,
            PurchaseLog.created_at >= sdt,
            PurchaseLog.created_at <= edt
        )
        .group_by(PurchaseLog.user_id)
        .order_by(func.sum(PurchaseLog.amount).desc())
        .all()
    )
    return [
        RevenuePerUser(user_id=str(r.user_id), total_spent=float(r.revenue))
        for r in rows
    ]
