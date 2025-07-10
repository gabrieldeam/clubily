# backend/app/api/v1/endpoints/purchase_metrics.py
from fastapi import APIRouter, Depends, Query
from datetime import date
from typing import List
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_company
from app.services.purchase_metrics_service import (
    get_purchase_chart,
    get_purchases_per_user,
    get_revenue_per_user,
    get_purchase_metrics
)
from app.schemas.purchase_metrics import (
    SaleByDay,
    PurchasesPerUser,
    RevenuePerUser,
    PurchaseMetricRead
)

router = APIRouter(tags=["purchase_metrics"])

@router.get(
    "/purchases",
    response_model=PurchaseMetricRead,
    summary="Admin: Métricas de compras"
)
def admin_metrics_purchases(
    start_date: date | None = Query(None, description="YYYY-MM-DD"),
    end_date:   date | None = Query(None, description="YYYY-MM-DD"),
    db:         Session = Depends(get_db),
    company     = Depends(get_current_company),
):
    return get_purchase_metrics(db, str(company.id), start_date, end_date)


@router.get(
    "/purchases/chart/daily",
    response_model=List[SaleByDay],
    summary="Série diária de compras (nº e receita)"
)
def chart_purchases_daily(
    start_date: date | None = Query(None),
    end_date:   date | None = Query(None),
    db:         Session = Depends(get_db),
    company     = Depends(get_current_company),
):
    return get_purchase_chart(db, str(company.id), start_date, end_date)

@router.get(
    "/purchases/chart/by-user/count",
    response_model=List[PurchasesPerUser],
    summary="Total de compras por usuário"
)
def chart_purchases_per_user(
    start_date: date | None = Query(None),
    end_date:   date | None = Query(None),
    db:         Session = Depends(get_db),
    company     = Depends(get_current_company),
):
    return get_purchases_per_user(db, str(company.id), start_date, end_date)

@router.get(
    "/purchases/chart/by-user/revenue",
    response_model=List[RevenuePerUser],
    summary="Receita por usuário"
)
def chart_revenue_per_user(
    start_date: date | None = Query(None),
    end_date:   date | None = Query(None),
    db:         Session = Depends(get_db),
    company     = Depends(get_current_company),
):
    return get_revenue_per_user(db, str(company.id), start_date, end_date)
