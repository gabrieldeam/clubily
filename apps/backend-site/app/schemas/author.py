from uuid import UUID
from pydantic import BaseModel, HttpUrl

class AuthorBase(BaseModel):
    name: str
    bio: str | None = None
    avatar_url: str | None = None

class AuthorCreate(AuthorBase):
    pass

class AuthorRead(AuthorBase):
    id: UUID

    class Config:
        orm_mode = True
