# app/schemas/help_post.py
from __future__ import annotations
from uuid import UUID
from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict

from app.schemas.help_block import HelpBlockCreate, HelpBlockRead

if TYPE_CHECKING:                 # só para o type-checker / IDE
    from app.schemas.help_category import HelpCategoryRead


# ─── Bases ────────────────────────────────────────────────────────────
class HelpPostBase(BaseModel):
    title: str
    slug: str
    category_ids: list[UUID] = []
    blocks: list[HelpBlockCreate] = []


class HelpPostCreate(HelpPostBase):
    pass


class HelpPostUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    category_ids: list[UUID] | None = None
    blocks: list[HelpBlockCreate] | None = None


# ─── Leitura (resposta) ───────────────────────────────────────────────
class HelpPostRead(BaseModel):
    """
    Representação que o backend devolve para o front.
    Agora traz **todas** as categorias ligadas ao artigo
    (campo `categories`) – não mais `category_id`/`category`.
    """
    model_config = ConfigDict(from_attributes=True)

    id:   UUID
    title: str
    slug:  str

    categories: list['HelpCategoryRead'] = []      # many-to-many
    blocks:     list[HelpBlockRead]

    created_at: datetime
    updated_at: datetime


# ─── Resolver referências circulares ─────────────────────────────────
# Import tardio para evitar ciclo e depois reconstruir os modelos
from app.schemas import help_category as _hc  # noqa: E402

HelpPostRead.model_rebuild(
    _types_namespace={
        "HelpCategoryRead": _hc.HelpCategoryRead,
        "HelpBlockRead":    HelpBlockRead,
    }
)
_hc.HelpCategoryRead.model_rebuild(
    _types_namespace={
        "HelpPostRead": HelpPostRead,
        "HelpCategoryRead": _hc.HelpCategoryRead,
    }
)
_hc.HelpCategoryTree.model_rebuild(
    _types_namespace={
        "HelpPostRead":     HelpPostRead,
        "HelpCategoryTree": _hc.HelpCategoryTree,
    }
)
