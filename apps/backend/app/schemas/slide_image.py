from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class SlideImageBase(BaseModel):
    title: str
    order: int = 0
    active: bool = True

class SlideImageCreate(SlideImageBase):
    image_url: str  # gerado pelo save_upload

class SlideImageUpdate(SlideImageBase):
    image_url: Optional[str] = None

class SlideImageRead(SlideImageBase):
    id: UUID
    image_url: str
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class PaginatedSlideImage(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[SlideImageRead]

    model_config = ConfigDict(from_attributes=True)
