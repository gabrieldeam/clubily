from datetime import datetime
from enum import Enum
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DiscountType(str, Enum):
    percent = "percent"
    fixed   = "fixed"


# Para criação: só name e code são obrigatórios
class CouponCreate(BaseModel):
    name: str = Field(..., max_length=120)
    code: str = Field(..., max_length=64)

    description: Optional[str] = None

    is_active: Optional[bool] = True
    is_visible: Optional[bool] = True

    usage_limit_total: Optional[int] = None
    usage_limit_per_user: Optional[int] = None

    min_order_amount: Optional[float] = None

    discount_type: Optional[DiscountType] = None
    discount_value: Optional[float] = None

    category_ids: Optional[List[UUID]] = None
    item_ids: Optional[List[UUID]] = None

    source_location_name: Optional[str] = None
    source_lat: Optional[float] = None
    source_lng: Optional[float] = None


# Para update parcial (PATCH-like via PUT, dependendo do seu padrão)
class CouponUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=120)
    code: Optional[str] = Field(None, max_length=64)

    description: Optional[str] = None

    is_active: Optional[bool] = None
    is_visible: Optional[bool] = None

    usage_limit_total: Optional[int] = None
    usage_limit_per_user: Optional[int] = None

    min_order_amount: Optional[float] = None

    discount_type: Optional[DiscountType] = None
    discount_value: Optional[float] = None

    category_ids: Optional[List[UUID]] = None  # se vier, substitui o set
    item_ids: Optional[List[UUID]] = None      # se vier, substitui o set

    source_location_name: Optional[str] = None
    source_lat: Optional[float] = None
    source_lng: Optional[float] = None


class CouponRead(BaseModel):
    id: UUID
    company_id: UUID

    name: str
    code: str
    description: Optional[str]

    is_active: bool
    is_visible: bool

    usage_limit_total: Optional[int]
    usage_limit_per_user: Optional[int]

    min_order_amount: Optional[float]

    discount_type: Optional[DiscountType]
    discount_value: Optional[float]

    category_ids: List[UUID] = []  # retornaremos como lista de IDs
    item_ids: List[UUID] = []

    source_location_name: Optional[str]
    # Para leitura, manteremos como opcionais (podem vir None se não consultarmos ST_X/ST_Y)
    source_lat: Optional[float] = None
    source_lng: Optional[float] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedCoupons(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[CouponRead]

    model_config = ConfigDict(from_attributes=True)
