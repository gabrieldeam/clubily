from uuid import UUID
from pydantic import BaseModel
from enum import Enum
from typing import Any

class BlockType(str, Enum):
    text  = "text"
    image = "image"

class BlockBase(BaseModel):
    position: int
    type: BlockType
    content: Any   # Quill Delta dict or {"url":..., "link":..., "caption":...}

class BlockCreate(BlockBase):
    pass

class BlockRead(BlockBase):
    id: UUID

    class Config:
        orm_mode = True
