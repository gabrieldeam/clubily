# ─── Plataforma (admin): stats de cupons ──────────────────────────────────────
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class CouponStatsAdmin(BaseModel):
    coupon_id: UUID
    company_id: UUID
    company_name: str

    name: str
    code: str
    is_active: bool
    is_visible: bool

    usage_limit_total: Optional[int] = None
    usage_limit_per_user: Optional[int] = None
    min_order_amount: Optional[float] = None
    discount_type: Optional[str] = None       # "percent" | "fixed" | None
    discount_value: Optional[float] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    used_count: int                   # total de usos
    unique_users: int                 # usuários distintos
    total_discount_applied: float     # soma dos descontos aplicados
    total_amount: float               # soma dos amounts dos pedidos
    last_redemption_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CouponRedemptionUserAdmin(BaseModel):
    """Lista detalhada de resgates (um por linha)."""
    redemption_id: UUID
    coupon_id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    amount: float
    discount_applied: float

    source_location_name: Optional[str] = None
    redemption_lat: Optional[float] = None
    redemption_lng: Optional[float] = None

    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CouponUserAggregateAdmin(BaseModel):
    """Agregado por usuário: quantas vezes usou e totais."""
    coupon_id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    uses_count: int
    total_discount_applied: float
    total_amount: float
    first_used_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
