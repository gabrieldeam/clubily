from datetime import datetime
from pydantic import BaseModel, HttpUrl, ConfigDict

class CategoryBase(BaseModel):
    name: str
    image_url: HttpUrl | None = None

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: str

    model_config = ConfigDict(from_attributes=True)
