from datetime import datetime
from pydantic import BaseModel, ConfigDict
from uuid import UUID

class CategoryBase(BaseModel):
    name: str
    image_url: str | None = None

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)
