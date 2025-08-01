from __future__ import annotations
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from app.schemas.author import AuthorRead
from app.schemas.category import CategoryRead
from app.schemas.block import BlockCreate, BlockRead   # <–– importe BlockCreate

class PostBase(BaseModel):
    title: str
    slug: str
    author_id: UUID
    category_ids: list[UUID] = []
    thumbnail_url: str | None = None 

class PostCreate(PostBase):
    # use BlockCreate aqui: não precisa de `id`
    blocks: list[BlockCreate]

class PostUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    author_id: UUID | None = None
    category_ids: list[UUID] | None = None
    thumbnail_url: str | None = None
    # idem para update: blocos novos sempre sem `id`
    blocks: list[BlockCreate] | None = None

class PostRead(BaseModel):
    id: UUID
    title: str
    slug: str
    author: AuthorRead
    categories: list[CategoryRead]
    blocks: list[BlockRead]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
