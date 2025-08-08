from uuid import UUID
from pydantic import BaseModel, AnyUrl, field_validator

class BannerBase(BaseModel):
    title: str
    image_url: str
    link_url: AnyUrl | None = None
    order: int = 0

    @field_validator("link_url", mode="before")
    @classmethod
    def empty_to_none(cls, v):
        if isinstance(v, str) and v.strip() == "":
            return None
        return v

class BannerCreate(BannerBase):
    pass

class BannerRead(BannerBase):
    id: UUID

    class Config:
        orm_mode = True
