from __future__ import annotations
from uuid import UUID
from enum import Enum
from pydantic import BaseModel

class HelpBlockType(str, Enum):
    text = "text"
    image = "image"

class HelpBlockBase(BaseModel):
    position: int
    type: HelpBlockType
    content: dict    # e.g. Delta do Quill ou {"url":..., "caption":...}

class HelpBlockCreate(HelpBlockBase):
    pass

class HelpBlockRead(HelpBlockBase):
    id: UUID
    class Config:
        orm_mode = True
