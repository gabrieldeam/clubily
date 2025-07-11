from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from app.models.selection_item import SelectionType

class SelectionItemBase(BaseModel):
    type: SelectionType
    item_id: UUID

class SelectionItemCreate(SelectionItemBase):
    pass

class SelectionItemRead(SelectionItemBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CategorySelectionRead(BaseModel):
    item_id: UUID
    model_config = ConfigDict(from_attributes=True)

class ProductSelectionRead(BaseModel):
    item_id: UUID
    model_config = ConfigDict(from_attributes=True)
