# backend/app/schemas/points_metrics.py
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date
from typing import List

class SaleByDay(BaseModel):
    day: date
    num_purchases: int
    revenue: float
    model_config = ConfigDict(from_attributes=True)

class PointsByDay(BaseModel):
    day: date
    points_awarded: int
    model_config = ConfigDict(from_attributes=True)

class PointsRedeemedByDay(BaseModel):
    day: date
    points_redeemed: int
    model_config = ConfigDict(from_attributes=True)

class TxUserStatsByDay(BaseModel):
    day: date
    tx_count: int
    unique_users: int
    model_config = ConfigDict(from_attributes=True)

class AvgPointsPerTxByDay(BaseModel):
    day: date
    avg_points: float
    model_config = ConfigDict(from_attributes=True)

class PurchaseMetricRead(BaseModel):
    start_date: date
    end_date: date
    total_purchases: int
    total_sales: float
    avg_ticket: float
    unique_buyers: int
    avg_purchases_per_user: float
    sales_by_day: List[SaleByDay]
    model_config = ConfigDict(from_attributes=True)

class RuleMetricRead(BaseModel):
    rule_id: UUID
    start_date: date
    end_date: date
    total_awarded: int
    transaction_count: int
    unique_users: int
    average_per_tx: float
    model_config = ConfigDict(from_attributes=True)

class PointsMetricRead(BaseModel):
    start_date: date
    end_date: date
    total_awarded: int
    transaction_count: int
    unique_users: int
    average_per_tx: float
    model_config = ConfigDict(from_attributes=True)
