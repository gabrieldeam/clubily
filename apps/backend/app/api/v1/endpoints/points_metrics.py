# backend/app/api/v1/endpoints/points_metrics.py
from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from typing import List

from app.api.deps import get_db, get_current_company, require_admin
from app.services.points_metrics_service import (
    get_rule_metrics,
    get_single_rule_metric,
    get_points_overview,
    get_points_awarded_chart,
    get_points_redeemed_chart,
    get_tx_vs_users_chart,
    get_avg_points_per_tx_chart,
    get_transactions_by_rule
)
from app.schemas.points_metrics import (
    RuleMetricRead,
    PointsMetricRead,
    PointsByDay,
    PointsRedeemedByDay,
    TxUserStatsByDay,
    AvgPointsPerTxByDay,
    PaginatedRuleTransactions
)

router = APIRouter(tags=["points_metrics"])

@router.get("/rules", response_model=List[RuleMetricRead], summary="Métricas por regra")
def admin_metrics_rules(
    start_date: date | None = Query(None),
    end_date:   date | None = Query(None),
    db:         Session = Depends(get_db),
    company     = Depends(get_current_company),
):
    return get_rule_metrics(db, str(company.id), start_date, end_date)

@router.get("/rules/{rule_id}", response_model=RuleMetricRead, summary="Métrica única de regra")
def admin_metric_single_rule(
    rule_id: UUID = Path(...),
    start_date: date | None = Query(None),
    end_date:   date | None = Query(None),
    db:         Session = Depends(get_db),
    company     = Depends(get_current_company),
):
    return get_single_rule_metric(db, str(company.id), str(rule_id), start_date, end_date)

@router.get(
    "/rules/{rule_id}/transactions",
    response_model=PaginatedRuleTransactions,
    status_code=status.HTTP_200_OK,
    summary="Admin: listar transações de pontos por regra (paginado)"
)
def admin_rule_transactions(
    rule_id: UUID = Path(..., description="ID da regra"),
    skip: int = Query(0, ge=0, description="Quantos registros pular"),
    limit: int = Query(50, ge=1, le=200, description="Máximo de registros"),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    total, items = get_transactions_by_rule(
        db,
        str(company.id),
        str(rule_id),
        skip,
        limit
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items
    }

@router.get("/points", response_model=PointsMetricRead, summary="Métricas gerais de pontos")
def admin_metrics_points(
    start_date: date | None = Query(None),
    end_date:   date | None = Query(None),
    db:         Session = Depends(get_db),
    company     = Depends(get_current_company),
):
    return get_points_overview(db, str(company.id), start_date, end_date)

@router.get("/points/chart/awarded", response_model=List[PointsByDay], summary="Pontos concedidos diários")
def chart_points_awarded(
    start_date: date | None = Query(None),
    end_date:   date | None = Query(None),
    db:         Session = Depends(get_db),
    company     = Depends(get_current_company),
):
    return get_points_awarded_chart(db, str(company.id), start_date, end_date)

@router.get("/points/chart/redeemed", response_model=List[PointsRedeemedByDay], summary="Pontos resgatados diários")
def chart_points_redeemed(
    start_date: date | None = Query(None),
    end_date:   date | None = Query(None),
    db:         Session = Depends(get_db),
    company     = Depends(get_current_company),
):
    return get_points_redeemed_chart(db, str(company.id), start_date, end_date)

@router.get("/points/chart/tx-users", response_model=List[TxUserStatsByDay], summary="Transações x usuários diários")
def chart_tx_vs_users(
    start_date: date | None = Query(None),
    end_date:   date | None = Query(None),
    db:         Session = Depends(get_db),
    company     = Depends(get_current_company),
):
    return get_tx_vs_users_chart(db, str(company.id), start_date, end_date)

@router.get("/points/chart/avg-per-tx", response_model=List[AvgPointsPerTxByDay], summary="Média de pontos por transação diária")
def chart_avg_points_per_tx(
    start_date: date | None = Query(None),
    end_date:   date | None = Query(None),
    db:         Session = Depends(get_db),
    company     = Depends(get_current_company),
):
    return get_avg_points_per_tx_chart(db, str(company.id), start_date, end_date)
