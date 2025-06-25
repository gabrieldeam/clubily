# backend/app/api/v1/endpoints/cashback_metrics.py

from fastapi import APIRouter, Depends, Query, HTTPException
from datetime import date, datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_company
from app.schemas.cashback_metrics import MonthlyCharts, ProgramMetrics, CompanyMetrics
from app.services.metrics_service import (
    get_daily_spend_range,
    get_daily_cashback_value_range,
    get_daily_cashback_count_range,
    get_daily_new_users_range,
    get_all_programs_metrics,
    get_company_metrics_range,
)

router = APIRouter(tags=["metrics"])


@router.get(
    "/charts",
    response_model=MonthlyCharts,
    summary="Dados diários para um intervalo (default: mês atual)",
)
def read_charts_range(
    start_date: Optional[date] = Query(None, description="Data de início (YYYY-MM-DD)"),
    end_date:   Optional[date] = Query(None, description="Data final   (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    # define intervalo padrão = mês atual
    today = datetime.utcnow().date()
    first = today.replace(day=1)
    last  = (first + timedelta(days=32)).replace(day=1) - timedelta(days=1)

    sd = start_date or first
    ed = end_date   or last
    if sd > ed:
        raise HTTPException(400, "start_date não pode ser depois de end_date")

    cid = str(current_company.id)

    return MonthlyCharts(
        spend_by_day          = get_daily_spend_range(db, cid, sd, ed),
        cashback_value_by_day = get_daily_cashback_value_range(db, cid, sd, ed),
        cashback_count_by_day = get_daily_cashback_count_range(db, cid, sd, ed),
        new_users_by_day      = get_daily_new_users_range(db, sd, ed),
    )


@router.get(
    "/",
    response_model=List[ProgramMetrics],
    summary="Métricas de TODOS os programas de cashback da empresa logada",
)
def read_all_programs_metrics(
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    return get_all_programs_metrics(db, str(current_company.id))


@router.get(
    "/summary",
    response_model=CompanyMetrics,
    summary="Resumo consolidado de TODOS os cashbacks da empresa (opcionalmente filtrado por intervalo)",
)
def read_company_metrics(
    start_date: Optional[date] = Query(None, description="Data de início (YYYY-MM-DD)"),
    end_date:   Optional[date] = Query(None, description="Data final   (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    today = datetime.utcnow().date()
    first = today.replace(day=1)
    last  = (first + timedelta(days=32)).replace(day=1) - timedelta(days=1)

    sd = start_date or first
    ed = end_date   or last
    if sd > ed:
        raise HTTPException(400, "start_date não pode ser depois de end_date")

    return get_company_metrics_range(db, str(current_company.id), sd, ed)
