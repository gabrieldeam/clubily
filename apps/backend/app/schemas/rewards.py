# app/schemas/rewards.py
from uuid import UUID
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# ---------- Categorias ----------
class RewardCategoryBase(BaseModel):
    name: str
    slug: str

class RewardCategoryCreate(RewardCategoryBase): ...

class RewardCategoryRead(RewardCategoryBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ---------- Produtos ----------
class RewardProductBase(BaseModel):
    name: str
    sku: str
    short_desc: Optional[str] = None
    long_desc:  Optional[str] = None
    points_cost: int
    category_ids: List[UUID] = []
    active: bool = True

class RewardProductCreate(RewardProductBase): ...

class RewardProductUpdate(RewardProductBase): ...

class RewardProductRead(RewardProductBase):
    id: UUID
    image_url: Optional[str]
    pdf_url:   Optional[str]
    created_at: datetime
    categories: List[RewardCategoryRead]
    active: bool
    model_config = ConfigDict(from_attributes=True)

# ---------- Pedidos ----------
class Address(BaseModel):
    recipient: str
    street: str
    number: str
    neighborhood: str
    city: str
    state: str
    postal_code: str
    complement: Optional[str] = None

class OrderItemPayload(BaseModel):
    product_id: UUID
    quantity: int = 1

class RewardOrderCreate(Address):
    items: List[OrderItemPayload]

class RewardOrderItemRead(BaseModel):
    product: RewardProductRead
    quantity: int
    model_config = ConfigDict(from_attributes=True)

class RewardOrderRead(Address):
    id: UUID
    status: str
    refusal_msg: Optional[str]
    created_at: datetime
    items: List[RewardOrderItemRead]
    model_config = ConfigDict(from_attributes=True)

class PaginatedRewardCategory(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[RewardCategoryRead]
    model_config = ConfigDict(from_attributes=True)

class PaginatedRewardProduct(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[RewardProductRead]
    model_config = ConfigDict(from_attributes=True)

class PaginatedRewardOrder(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[RewardOrderRead]
    model_config = ConfigDict(from_attributes=True)