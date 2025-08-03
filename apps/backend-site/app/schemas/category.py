from __future__ import annotations
from uuid import UUID
from typing import Any
from pydantic import BaseModel, Field, ConfigDict, field_validator

class CategoryBase(BaseModel):
    name: str
    parent_id: UUID | None = None

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    # sempre lista, padrão []
    children: list[CategoryRead] = Field(default_factory=list)

    @field_validator("children", mode="before")
    @classmethod
    def _ensure_list(cls, v: Any) -> list[Any]:
        # Se vier None, devolve lista vazia
        if v is None:
            return []
        # Se veio um único objeto, embrulha em lista
        if not isinstance(v, list):
            return [v]
        # Já era lista, deixa como está
        return v

# resolve o forward reference
CategoryRead.model_rebuild()
