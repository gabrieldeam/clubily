from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session
from datetime import date
from app.api.deps import get_db, get_current_company
from app.schemas.loyalty_metrics import MetricSummary, MetricsCharts, ChartSeries, SeriesPoint
from app.services.loyalty_metrics_service import summary_for_company, daily_counts

router = APIRouter(tags=["loyalty-metrics"])


# ─── resumo numérico ───────────────────────────────────────────
@router.get(
    "/admin/metrics/summary",
    response_model=MetricSummary,
    summary="Empresa: resumo de métricas (range opcional)"
)
def metrics_summary(
    tpl_id: Optional[UUID] = Query(None),
    date_from: Optional[date] = Query(None, description="aaaa-mm-dd"),
    date_to: Optional[date] = Query(None, description="aaaa-mm-dd"),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    data = summary_for_company(db, str(company.id), tpl_id, date_from, date_to)
    return MetricSummary(template_id=tpl_id, **data)


@router.get(
    "/admin/metrics/charts",
    response_model=MetricsCharts,
    summary="Empresa: séries diárias para gráficos (range obrigatório)"
)
def metrics_charts(
    tpl_id: Optional[UUID] = Query(None),
    date_from: date = Query(..., description="Data inicial (aaaa-mm-dd)"),
    date_to: date = Query(..., description="Data final (aaaa-mm-dd)"),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    counts = daily_counts(db, str(company.id), tpl_id, date_from, date_to)

    series = [
        ChartSeries(
            name="Cards emitted",
            points=[SeriesPoint(day=d, value=v) for d, v in counts["cards"].items()],
        ),
        ChartSeries(
            name="Rewards redeemed",
            points=[SeriesPoint(day=d, value=v) for d, v in counts["redeems"].items()],
        ),
    ]
    return MetricsCharts(template_id=tpl_id, series=series)