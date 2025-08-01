from uuid import UUID
from pydantic import BaseModel, HttpUrl

class BannerBase(BaseModel):
    title: str
    image_url: str
    link_url: HttpUrl | None = None
    order: int = 0

class BannerCreate(BannerBase):
    pass

class BannerRead(BannerBase):
    id: UUID

    class Config:
        orm_mode = True
