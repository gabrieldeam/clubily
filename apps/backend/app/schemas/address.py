from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class AddressBase(BaseModel):
    street: str
    city: str
    state: str
    postal_code: str
    country: Optional[str] = "Brasil"

class AddressCreate(AddressBase):
    pass

class AddressRead(AddressBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
