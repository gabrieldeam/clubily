from __future__ import annotations

from datetime import datetime, date
from typing import List, Optional, Tuple

from sqlalchemy import func, cast
from sqlalchemy.orm import Session
from geoalchemy2 import Geometry

from app.models.coupon import Coupon
from app.models.coupon_redemption import CouponRedemption
from app.schemas.coupon_metrics import (
    TimeGranularity,
    CouponMetricsSummary,
    CouponTimeseriesPoint,
    CouponTimeseriesResponse,
    CouponBubblePoint,
    CouponMapPoint,
)

# opcional: se tiver model User com "name"
try:
    from app.models.user import User
    HAS_USER = True
except Exception:
    User = None  # type: ignore
    HAS_USER = False


def _dt_start_end(date_from: date, date_to: date) -> Tuple[datetime, datetime]:
    """
    Converte (date_from, date_to) para datetimes inclusivos do dia:
    - from: 00:00:00
    - to:   23:59:59.999999
    """
    dt_from = datetime.combine(date_from, datetime.min.time())
    dt_to = datetime.combine(date_to, datetime.max.time())
    return dt_from, dt_to


def _apply_period(q, field, dt_from: datetime, dt_to: datetime):
    return q.filter(field >= dt_from, field <= dt_to)


def metrics_summary(
    db: Session,
    company_id: str,
    *,
    date_from: date,
    date_to: date,
) -> CouponMetricsSummary:
    dt_from, dt_to = _dt_start_end(date_from, date_to)

    q = (
        db.query(
            func.count(CouponRedemption.id),
            func.coalesce(func.sum(CouponRedemption.discount_applied), 0),
            func.count(func.distinct(CouponRedemption.user_id)),
        )
        .filter(CouponRedemption.company_id == company_id)
    )
    q = _apply_period(q, CouponRedemption.created_at, dt_from, dt_to)

    total_redemptions, total_discount, unique_users = q.one()
    total_redemptions = int(total_redemptions or 0)
    total_discount = float(total_discount or 0.0)
    unique_users = int(unique_users or 0)
    avg_per_user = (total_redemptions / unique_users) if unique_users > 0 else 0.0

    return CouponMetricsSummary(
        total_redemptions=total_redemptions,
        total_discount=total_discount,
        unique_users=unique_users,
        avg_uses_per_user=round(avg_per_user, 4),
    )


def metrics_summary_by_coupon(
    db: Session,
    company_id: str,
    coupon_id: str,
    *,
    date_from: date,
    date_to: date,
) -> CouponMetricsSummary:
    dt_from, dt_to = _dt_start_end(date_from, date_to)

    q = (
        db.query(
            func.count(CouponRedemption.id),
            func.coalesce(func.sum(CouponRedemption.discount_applied), 0),
            func.count(func.distinct(CouponRedemption.user_id)),
        )
        .filter(
            CouponRedemption.company_id == company_id,
            CouponRedemption.coupon_id == coupon_id,
        )
    )
    q = _apply_period(q, CouponRedemption.created_at, dt_from, dt_to)

    total_redemptions, total_discount, unique_users = q.one()
    total_redemptions = int(total_redemptions or 0)
    total_discount = float(total_discount or 0.0)
    unique_users = int(unique_users or 0)
    avg_per_user = (total_redemptions / unique_users) if unique_users > 0 else 0.0

    return CouponMetricsSummary(
        total_redemptions=total_redemptions,
        total_discount=total_discount,
        unique_users=unique_users,
        avg_uses_per_user=round(avg_per_user, 4),
    )


def metrics_timeseries(
    db: Session,
    company_id: str,
    *,
    granularity: TimeGranularity,
    date_from: date,
    date_to: date,
    coupon_id: Optional[str] = None,
) -> CouponTimeseriesResponse:
    dt_from, dt_to = _dt_start_end(date_from, date_to)
    trunc = func.date_trunc(granularity.value, CouponRedemption.created_at).label("period")

    q = (
        db.query(
            trunc,
            func.count(CouponRedemption.id).label("cnt"),
            func.coalesce(func.sum(CouponRedemption.discount_applied), 0).label("sum_discount"),
            func.count(func.distinct(CouponRedemption.user_id)).label("uniq_users"),
        )
        .filter(CouponRedemption.company_id == company_id)
    )

    if coupon_id:
        q = q.filter(CouponRedemption.coupon_id == coupon_id)

    q = _apply_period(q, CouponRedemption.created_at, dt_from, dt_to)
    q = q.group_by(trunc).order_by(trunc.asc())

    rows = q.all()
    points = [
        CouponTimeseriesPoint(
            period_start=r.period,
            redemptions=int(r.cnt or 0),
            total_discount=float(r.sum_discount or 0.0),
            unique_users=int(r.uniq_users or 0),
        )
        for r in rows
    ]

    return CouponTimeseriesResponse(granularity=granularity, points=points)


def tracking_bubbles(
    db: Session,
    company_id: str,
    *,
    date_from: date,
    date_to: date,
) -> List[CouponBubblePoint]:
    """
    Bubbles = cupons com APENAS source_location_name (texto) e sem source_location (ponto).
    Retorna usos e total de desconto no período.
    """
    dt_from, dt_to = _dt_start_end(date_from, date_to)

    C = (
        db.query(
            Coupon.id,
            Coupon.code,
            Coupon.name,
            Coupon.source_location_name,
        )
        .filter(
            Coupon.company_id == company_id,
            Coupon.source_location_name.isnot(None),
            Coupon.source_location.is_(None),   # <-- garante que NÃO tem ponto
        )
        .subquery()
    )

    R = (
        db.query(
            CouponRedemption.coupon_id.label("cid"),
            func.count(CouponRedemption.id).label("uses"),
            func.coalesce(func.sum(CouponRedemption.discount_applied), 0).label("sum_discount"),
        )
        .filter(CouponRedemption.company_id == company_id)
    )
    R = _apply_period(R, CouponRedemption.created_at, dt_from, dt_to)
    R = R.group_by(CouponRedemption.coupon_id).subquery()

    q = (
        db.query(
            C.c.id,
            C.c.code,
            C.c.name,
            C.c.source_location_name,
            func.coalesce(R.c.uses, 0).label("uses"),
            func.coalesce(R.c.sum_discount, 0).label("total_discount"),
        )
        .outerjoin(R, R.c.cid == C.c.id)
        .order_by(func.coalesce(R.c.uses, 0).desc(), C.c.name.asc())
    )

    rows = q.all()
    points: List[CouponBubblePoint] = []
    for idx, r in enumerate(rows, start=1):
        points.append(
            CouponBubblePoint(
                coupon_id=r.id,
                code=r.code,
                name=r.name,
                label=r.source_location_name,
                uses=int(r.uses or 0),
                total_discount=float(r.total_discount or 0.0),
                order=idx,
            )
        )
    return points


def tracking_map_points(
    db: Session,
    company_id: str,
    *,
    date_from: date,
    date_to: date,
) -> List[CouponMapPoint]:
    """
    Mapa = todos os cupons com source_location (ponto).
    Retorna lat/lng do cupom, label (se houver), usos e total de desconto no período.
    """
    dt_from, dt_to = _dt_start_end(date_from, date_to)

    C = (
        db.query(
            Coupon.id,
            Coupon.code,
            Coupon.name,
            Coupon.source_location_name,
            func.ST_Y(cast(Coupon.source_location, Geometry)).label("lat"),
            func.ST_X(cast(Coupon.source_location, Geometry)).label("lng"),
        )
        .filter(
            Coupon.company_id == company_id,
            Coupon.source_location.isnot(None),   # <-- garante que TEM ponto
        )
        .subquery()
    )

    R = (
        db.query(
            CouponRedemption.coupon_id.label("cid"),
            func.count(CouponRedemption.id).label("uses"),
            func.coalesce(func.sum(CouponRedemption.discount_applied), 0).label("sum_discount"),
        )
        .filter(CouponRedemption.company_id == company_id)
    )
    R = _apply_period(R, CouponRedemption.created_at, dt_from, dt_to)
    R = R.group_by(CouponRedemption.coupon_id).subquery()

    q = (
        db.query(
            C.c.id,
            C.c.code,
            C.c.name,
            C.c.source_location_name,
            C.c.lat,
            C.c.lng,
            func.coalesce(R.c.uses, 0).label("uses"),
            func.coalesce(R.c.sum_discount, 0).label("total_discount"),
        )
        .outerjoin(R, R.c.cid == C.c.id)
    )

    rows = q.all()
    points: List[CouponMapPoint] = []
    for r in rows:
        lat = float(r.lat) if r.lat is not None else None
        lng = float(r.lng) if r.lng is not None else None
        points.append(
            CouponMapPoint(
                coupon_id=r.id,
                code=r.code,
                name=r.name,
                label=r.source_location_name,
                uses=int(r.uses or 0),
                total_discount=float(r.total_discount or 0.0),
                lat=lat,
                lng=lng,
            )
        )
    return points


def list_coupon_usage(
    db: Session,
    company_id: str,
    coupon_id: str,
    *,
    date_from: date,
    date_to: date,
    skip: int,
    limit: int,
) -> Tuple[int, List[dict]]:
    dt_from, dt_to = _dt_start_end(date_from, date_to)

    # contagem total no período
    total_q = (
        db.query(func.count(CouponRedemption.id))
        .filter(
            CouponRedemption.company_id == company_id,
            CouponRedemption.coupon_id == coupon_id,
            CouponRedemption.created_at >= dt_from,
            CouponRedemption.created_at <= dt_to,
        )
    )
    total = int(total_q.scalar() or 0)

    # query principal com lat/lng e (opcional) nome do usuário
    base_cols = [
        CouponRedemption.id.label("id"),
        CouponRedemption.coupon_id.label("coupon_id"),
        CouponRedemption.user_id.label("user_id"),
        CouponRedemption.amount.label("amount"),
        CouponRedemption.discount_applied.label("discount_applied"),
        CouponRedemption.source_location_name.label("source_location_name"),
        func.ST_Y(cast(CouponRedemption.redemption_location, Geometry)).label("lat"),
        func.ST_X(cast(CouponRedemption.redemption_location, Geometry)).label("lng"),
        CouponRedemption.created_at.label("created_at"),
    ]

    q = (
        db.query(*base_cols)
        .filter(
            CouponRedemption.company_id == company_id,
            CouponRedemption.coupon_id == coupon_id,
            CouponRedemption.created_at >= dt_from,
            CouponRedemption.created_at <= dt_to,
        )
        .order_by(CouponRedemption.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    rows = q.all()
    items: List[dict] = []
    if HAS_USER and rows:
        user_ids = list({r.user_id for r in rows})
        names = {
            u.id: u.name
            for u in db.query(User.id, User.name).filter(User.id.in_(user_ids)).all()  # type: ignore
        }
        for r in rows:
            items.append({
                "id": r.id,
                "coupon_id": r.coupon_id,
                "user_id": r.user_id,
                "user_name": names.get(r.user_id),
                "amount": float(r.amount),
                "discount_applied": float(r.discount_applied),
                "source_location_name": r.source_location_name,
                "lat": float(r.lat) if r.lat is not None else None,
                "lng": float(r.lng) if r.lng is not None else None,
                "created_at": r.created_at,
            })
    else:
        for r in rows:
            items.append({
                "id": r.id,
                "coupon_id": r.coupon_id,
                "user_id": r.user_id,
                "user_name": None,
                "amount": float(r.amount),
                "discount_applied": float(r.discount_applied),
                "source_location_name": r.source_location_name,
                "lat": float(r.lat) if r.lat is not None else None,
                "lng": float(r.lng) if r.lng is not None else None,
                "created_at": r.created_at,
            })

    return total, items
