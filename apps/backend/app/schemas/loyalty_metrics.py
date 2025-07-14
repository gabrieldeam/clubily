from datetime import date
from typing import List
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class MetricSummary(BaseModel):
    template_id: UUID | None = None   # se None → todas
    total_cards: int
    unique_users: int
    total_stamps: int
    rewards_redeemed: int
    model_config = ConfigDict(from_attributes=True)


class SeriesPoint(BaseModel):
    day: date
    value: int


class ChartSeries(BaseModel):
    name: str          # “Cards emitted”, “Rewards redeemed”…
    points: List[SeriesPoint]


class MetricsCharts(BaseModel):
    template_id: UUID | None = None
    series: List[ChartSeries]
