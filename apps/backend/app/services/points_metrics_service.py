# backend/app/services/points_metrics_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from typing import List

from app.models.user_points_transaction import UserPointsTransaction, UserPointsTxType
from app.models.points_rule import PointsRule
from app.models.purchase_log import PurchaseLog
from app.schemas.points_metrics import (
    PointsByDay,
    PointsRedeemedByDay,
    TxUserStatsByDay,
    AvgPointsPerTxByDay,
    PointsMetricRead,
    RuleMetricRead,
)

def _normalize_range(start_date, end_date):
    today = date.today()
    if start_date is None:
        start_date = date(today.year, today.month, 1)
    if end_date is None:
        end_date = today
    return start_date, end_date

def get_points_overview(
    db: Session,
    company_id: str,
    start_date: date | None = None,
    end_date: date | None = None
) -> PointsMetricRead:
    sd, ed = _normalize_range(start_date, end_date)
    sdt = datetime.combine(sd, datetime.min.time())
    edt = datetime.combine(ed, datetime.max.time())

    award_q = (
        db.query(UserPointsTransaction)
          .filter(
              UserPointsTransaction.company_id==company_id,
              UserPointsTransaction.type==UserPointsTxType.award,
              UserPointsTransaction.created_at>=sdt,
              UserPointsTransaction.created_at<=edt,
          )
    )
    tx_count     = award_q.count()
    total_pts    = award_q.with_entities(func.coalesce(func.sum(UserPointsTransaction.amount), 0)).scalar() or 0
    unique_users = award_q.with_entities(UserPointsTransaction.user_id).distinct().count()
    avg_per_tx   = float(total_pts) / tx_count if tx_count else 0.0

    return PointsMetricRead(
        start_date=sd,
        end_date=ed,
        total_awarded=int(total_pts),
        transaction_count=tx_count,
        unique_users=unique_users,
        average_per_tx=avg_per_tx,
    )

def get_rule_metrics(
    db: Session,
    company_id: str,
    start_date: date | None = None,
    end_date: date | None = None
) -> List[RuleMetricRead]:
    sd, ed = _normalize_range(start_date, end_date)
    sdt = datetime.combine(sd, datetime.min.time())
    edt = datetime.combine(ed, datetime.max.time())

    out: List[RuleMetricRead] = []
    for r in db.query(PointsRule).filter_by(company_id=company_id).all():
        award_q = (
            db.query(UserPointsTransaction)
              .filter(
                  UserPointsTransaction.company_id==company_id,
                  UserPointsTransaction.rule_id==str(r.id),
                  UserPointsTransaction.type==UserPointsTxType.award,
                  UserPointsTransaction.created_at>=sdt,
                  UserPointsTransaction.created_at<=edt,
              )
        )
        tx_count     = award_q.count()
        total_pts    = award_q.with_entities(func.coalesce(func.sum(UserPointsTransaction.amount), 0)).scalar() or 0
        unique_users = award_q.with_entities(UserPointsTransaction.user_id).distinct().count()
        avg_per_tx   = float(total_pts) / tx_count if tx_count else 0.0

        out.append(RuleMetricRead(
            rule_id=r.id,
            start_date=sd,
            end_date=ed,
            total_awarded=int(total_pts),
            transaction_count=tx_count,
            unique_users=unique_users,
            average_per_tx=avg_per_tx,
        ))
    return out

def get_single_rule_metric(
    db: Session,
    company_id: str,
    rule_id: str,
    start_date: date | None = None,
    end_date: date | None = None
) -> RuleMetricRead:
    for m in get_rule_metrics(db, company_id, start_date, end_date):
        if str(m.rule_id) == rule_id:
            return m
    sd, ed = _normalize_range(start_date, end_date)
    return RuleMetricRead(
        rule_id=rule_id,
        start_date=sd,
        end_date=ed,
        total_awarded=0,
        transaction_count=0,
        unique_users=0,
        average_per_tx=0.0
    )

def get_points_awarded_chart(
    db: Session,
    company_id: str,
    start_date: date | None = None,
    end_date:   date | None = None
) -> List[PointsByDay]:
    sd, ed = _normalize_range(start_date, end_date)
    sdt = datetime.combine(sd, datetime.min.time())
    edt = datetime.combine(ed, datetime.max.time())

    day_trunc = func.date_trunc('day', UserPointsTransaction.created_at)
    rows = (
        db.query(
            day_trunc.label('day'),
            func.coalesce(func.sum(UserPointsTransaction.amount), 0).label('points')
        )
        .filter(
            UserPointsTransaction.company_id==company_id,
            UserPointsTransaction.type==UserPointsTxType.award,
            UserPointsTransaction.created_at>=sdt,
            UserPointsTransaction.created_at<=edt,
        )
        .group_by(day_trunc)
        .order_by(day_trunc)
        .all()
    )
    return [
        PointsByDay(day=r.day.date(), points_awarded=int(r.points))
        for r in rows
    ]

def get_points_redeemed_chart(
    db: Session,
    company_id: str,
    start_date: date | None = None,
    end_date:   date | None = None
) -> List[PointsRedeemedByDay]:
    sd, ed = _normalize_range(start_date, end_date)
    sdt = datetime.combine(sd, datetime.min.time())
    edt = datetime.combine(ed, datetime.max.time())

    day_trunc = func.date_trunc('day', UserPointsTransaction.created_at)
    rows = (
        db.query(
            day_trunc.label('day'),
            func.coalesce(func.sum(UserPointsTransaction.amount), 0).label('redeemed')
        )
        .filter(
            UserPointsTransaction.company_id==company_id,
            UserPointsTransaction.type==UserPointsTxType.redeem,
            UserPointsTransaction.created_at>=sdt,
            UserPointsTransaction.created_at<=edt,
        )
        .group_by(day_trunc)
        .order_by(day_trunc)
        .all()
    )
    return [
        PointsRedeemedByDay(day=r.day.date(), points_redeemed=abs(int(r.redeemed)))
        for r in rows
    ]

def get_tx_vs_users_chart(
    db: Session,
    company_id: str,
    start_date: date | None = None,
    end_date:   date | None = None
) -> List[TxUserStatsByDay]:
    sd, ed = _normalize_range(start_date, end_date)
    sdt = datetime.combine(sd, datetime.min.time())
    edt = datetime.combine(ed, datetime.max.time())

    day_trunc = func.date_trunc('day', UserPointsTransaction.created_at)
    rows = (
        db.query(
            day_trunc.label('day'),
            func.count(UserPointsTransaction.id).label('tx_count'),
            func.count(func.distinct(UserPointsTransaction.user_id)).label('unique_users')
        )
        .filter(
            UserPointsTransaction.company_id==company_id,
            UserPointsTransaction.created_at>=sdt,
            UserPointsTransaction.created_at<=edt,
        )
        .group_by(day_trunc)
        .order_by(day_trunc)
        .all()
    )
    return [
        TxUserStatsByDay(day=r.day.date(), tx_count=r.tx_count, unique_users=r.unique_users)
        for r in rows
    ]

def get_avg_points_per_tx_chart(
    db: Session,
    company_id: str,
    start_date: date | None = None,
    end_date:   date | None = None
) -> List[AvgPointsPerTxByDay]:
    sd, ed = _normalize_range(start_date, end_date)
    sdt = datetime.combine(sd, datetime.min.time())
    edt = datetime.combine(ed, datetime.max.time())

    day_trunc = func.date_trunc('day', UserPointsTransaction.created_at)
    rows = (
        db.query(
            day_trunc.label('day'),
            ( func.coalesce(func.sum(UserPointsTransaction.amount), 0)
              / func.nullif(func.count(UserPointsTransaction.id), 0)
            ).label('avg_pts')
        )
        .filter(
            UserPointsTransaction.company_id==company_id,
            UserPointsTransaction.type==UserPointsTxType.award,
            UserPointsTransaction.created_at>=sdt,
            UserPointsTransaction.created_at<=edt,
        )
        .group_by(day_trunc)
        .order_by(day_trunc)
        .all()
    )
    return [
        AvgPointsPerTxByDay(day=r.day.date(), avg_points=float(r.avg_pts or 0))
        for r in rows
    ]
