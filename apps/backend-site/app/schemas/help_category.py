from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

if TYPE_CHECKING:                       # só p/ type-checker (no runtime)
    from app.schemas.help_post import HelpPostRead


class HelpCategoryBase(BaseModel):
    name: str
    parent_id: UUID | None = None


class HelpCategoryCreate(HelpCategoryBase):
    """Payload de criação/edição."""
    pass


class HelpCategoryRead(BaseModel):
    """
    Categoria “simples” (com filhos e posts).
    A resolução das Forward-Refs é feita no final de help_post.py
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    parent_id: UUID | None = None

    children: List["HelpCategoryRead"] = Field(default_factory=list)
    posts:    List["HelpPostRead"]     = Field(default_factory=list)


class HelpCategoryTree(BaseModel):
    """
    Estrutura recursiva para devolver árvore completa.
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    parent_id: Optional[UUID] = None

    posts:    List["HelpPostRead"]     = Field(default_factory=list)
    children: List["HelpCategoryTree"] = Field(default_factory=list)

# ⬆️  NÃO chame .model_rebuild() aqui – ele será chamado em help_post.py
