### backend/app/schemas/purchase_log.py ###
from uuid import UUID
from typing import List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

class PurchaseLogCreate(BaseModel):
    user_id: UUID
    amount: Decimal
    item_ids: List[UUID] = []

class PurchaseLogRead(PurchaseLogCreate):
    id: UUID
    company_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)