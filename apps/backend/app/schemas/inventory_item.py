### backend/app/schemas/inventory_item.py ###
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from typing import List
from app.schemas.product_category import ProductCategoryBasic

class InventoryItemBase(BaseModel):
    sku: str
    name: str
    price: Decimal
    category_ids: list[UUID] = Field(default_factory=list)

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemRead(InventoryItemBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    categories: List[ProductCategoryBasic] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)

class PaginatedInventoryItems(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[InventoryItemRead]

    model_config = ConfigDict()

class InventoryItemBasic(BaseModel):
    id: UUID
    name: str
    sku: str
    model_config = ConfigDict(from_attributes=True)