# backend/app/schemas/purchase_metrics.py
from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import List

class SaleByDay(BaseModel):
    day: date
    num_purchases: int
    revenue: float
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

class PurchasesPerUser(BaseModel):
    user_id: str
    purchase_count: int
    model_config = ConfigDict(from_attributes=True)

class RevenuePerUser(BaseModel):
    user_id: str
    total_spent: float
    model_config = ConfigDict(from_attributes=True)
