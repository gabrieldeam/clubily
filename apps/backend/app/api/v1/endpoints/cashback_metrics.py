from fastapi import APIRouter, Depends
from datetime import datetime
from typing import List
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_company
from app.schemas.cashback_metrics import MonthlyCharts, ProgramMetrics, CompanyMetrics
from app.services.metrics_service import (
    get_daily_spend,
    get_daily_cashback_value,
    get_daily_cashback_count,
    get_daily_new_users,
    get_all_programs_metrics,
    get_company_metrics
)

router = APIRouter(tags=["metrics"])

@router.get("/monthly-charts", response_model=MonthlyCharts, summary="Dados para 4 gráficos diários do mês atual")
def read_monthly_charts(
    db: Session = Depends(get_db),
    current_company = Depends(get_current_company),
):
    today = datetime.utcnow()
    year, month = today.year, today.month
    cid = str(current_company.id)

    return MonthlyCharts(
        spend_by_day         = get_daily_spend(db, cid, year, month),
        cashback_value_by_day= get_daily_cashback_value(db, cid, year, month),
        cashback_count_by_day= get_daily_cashback_count(db, cid, year, month),
        new_users_by_day     = get_daily_new_users(db, year, month),
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
    """
    Retorna um array com as métricas (total, contagem, médias, ROI, etc.)
    de TODOS os programas de cashback ativos e visíveis da empresa.
    """
    return get_all_programs_metrics(db, str(current_company.id))

@router.get(
    "/summary",
    response_model=CompanyMetrics,
    summary="Resumo consolidado de TODOS os cashbacks da empresa",
)
def read_company_metrics(
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    """
    Retorna um objeto com os totais (cashback, gastos, contagens e médias)
    de todas as associações de cashback dos programas da empresa logada.
    """
    return get_company_metrics(db, str(current_company.id))
