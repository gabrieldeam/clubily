### backend/app/schemas/inventory_item.py ###
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from typing import List

class InventoryItemBase(BaseModel):
    sku: str
    name: str
    price: Decimal
    category_ids: list[UUID] = []

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemRead(InventoryItemBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PaginatedInventoryItems(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[InventoryItemRead]

    model_config = ConfigDict()