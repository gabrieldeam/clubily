### backend/app/schemas/product_category.py ###
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ProductCategoryBase(BaseModel):
    name: str
    slug: str

class ProductCategoryCreate(ProductCategoryBase):
    pass

class ProductCategoryRead(ProductCategoryBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)