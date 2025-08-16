from typing import Optional, List
from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID

class CategoryBase(BaseModel):
    name: str
    image_url: str | None = None
    commission_percent: Optional[float] = None  # 0..100

    @field_validator("commission_percent")
    @classmethod
    def _check_commission(cls, v):
        if v is None:
            return v
        if v < 0 or v > 100:
            raise ValueError("commission_percent deve estar entre 0 e 100")
        return v

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)


class CategoryPage(BaseModel):
    items: List[CategoryRead]
    total: int
    page: int
    size: int