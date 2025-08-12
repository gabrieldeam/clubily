from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TimeGranularity(str, Enum):
    day = "day"
    week = "week"
    month = "month"


class CouponMetricsSummary(BaseModel):
    total_redemptions: int = 0
    total_discount: float = 0.0
    unique_users: int = 0
    avg_uses_per_user: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class CouponTimeseriesPoint(BaseModel):
    period_start: datetime
    redemptions: int
    total_discount: float
    unique_users: int

    model_config = ConfigDict(from_attributes=True)


class CouponTimeseriesResponse(BaseModel):
    granularity: TimeGranularity
    points: List[CouponTimeseriesPoint]


class CouponBubblePoint(BaseModel):
    coupon_id: UUID
    code: str
    name: str
    label: Optional[str] = None
    uses: int
    order: int


class CouponMapPoint(BaseModel):
    coupon_id: UUID
    code: str
    name: str
    label: Optional[str] = None
    uses: int
    lat: Optional[float] = None
    lng: Optional[float] = None


class CouponUsageItem(BaseModel):
    id: UUID
    coupon_id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    amount: float
    discount_applied: float
    source_location_name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedCouponUsage(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[CouponUsageItem]

    model_config = ConfigDict(from_attributes=True)
