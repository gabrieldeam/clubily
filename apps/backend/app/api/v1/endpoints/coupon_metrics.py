from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_company
from app.schemas.coupon_metrics import (
    TimeGranularity,
    CouponMetricsSummary,
    CouponTimeseriesResponse,
    CouponBubblePoint,
    CouponMapPoint,
    PaginatedCouponUsage,
    CouponUsageItem,
)
from app.services.coupon_metrics_service import (
    metrics_summary,
    metrics_summary_by_coupon,
    metrics_timeseries,
    tracking_bubbles,
    tracking_map_points,
    list_coupon_usage,
)

router = APIRouter(tags=["coupons:metrics"])


def _assert_valid_range(date_from: date, date_to: date) -> None:
    if date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="date_from não pode ser maior que date_to.",
        )


@router.get("/summary", response_model=CouponMetricsSummary, summary="Resumo geral de métricas de cupons no período")
def coupons_summary(
    date_from: date = Query(..., description="YYYY-MM-DD"),
    date_to: date = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    _assert_valid_range(date_from, date_to)
    return metrics_summary(db, str(current_company.id), date_from=date_from, date_to=date_to)


@router.get("/timeseries", response_model=CouponTimeseriesResponse, summary="Séries temporais de resgates/valores no período")
def coupons_timeseries(
    date_from: date = Query(..., description="YYYY-MM-DD"),
    date_to: date = Query(..., description="YYYY-MM-DD"),
    granularity: TimeGranularity = Query(TimeGranularity.day),
    coupon_id: Optional[UUID] = Query(None, description="Se informado, filtra por cupom específico"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    _assert_valid_range(date_from, date_to)
    return metrics_timeseries(
        db,
        str(current_company.id),
        granularity=granularity,
        date_from=date_from,
        date_to=date_to,
        coupon_id=str(coupon_id) if coupon_id else None,
    )


@router.get("/{coupon_id}/summary", response_model=CouponMetricsSummary, summary="Resumo por cupom no período")
def coupon_summary(
    coupon_id: UUID = Path(..., description="UUID do cupom"),
    date_from: date = Query(..., description="YYYY-MM-DD"),
    date_to: date = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    _assert_valid_range(date_from, date_to)
    return metrics_summary_by_coupon(
        db, str(current_company.id), str(coupon_id),
        date_from=date_from, date_to=date_to
    )


@router.get("/tracking/bubbles", response_model=list[CouponBubblePoint], summary="Bubble chart (rastreamento) no período")
def coupons_tracking_bubbles(
    date_from: date = Query(..., description="YYYY-MM-DD"),
    date_to: date = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    _assert_valid_range(date_from, date_to)
    return tracking_bubbles(db, str(current_company.id), date_from=date_from, date_to=date_to)


@router.get("/tracking/map", response_model=list[CouponMapPoint], summary="Pontos de mapa (rastreamento) no período")
def coupons_tracking_map(
    date_from: date = Query(..., description="YYYY-MM-DD"),
    date_to: date = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    _assert_valid_range(date_from, date_to)
    return tracking_map_points(db, str(current_company.id), date_from=date_from, date_to=date_to)


@router.get("/{coupon_id}/usage", response_model=PaginatedCouponUsage, summary="Lista de usos (redemptions) do cupom no período")
def coupon_usage(
    coupon_id: UUID = Path(..., description="UUID do cupom"),
    date_from: date = Query(..., description="YYYY-MM-DD"),
    date_to: date = Query(..., description="YYYY-MM-DD"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    _assert_valid_range(date_from, date_to)
    total, rows = list_coupon_usage(
        db,
        str(current_company.id),
        str(coupon_id),
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )
    return PaginatedCouponUsage(
        total=total,
        skip=skip,
        limit=limit,
        items=[CouponUsageItem(**r) for r in rows],
    )
