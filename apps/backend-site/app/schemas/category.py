from uuid import UUID
from pydantic import BaseModel, Field

class CategoryBase(BaseModel):
    name: str
    parent_id: UUID | None = None

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: UUID
    # aceita None ou list[…], mas converte para [] no output
    children: list["CategoryRead"] | None = Field(default_factory=list)

    class Config:
        orm_mode = True
