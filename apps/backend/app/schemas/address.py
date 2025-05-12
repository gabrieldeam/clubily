from datetime import datetime
from typing import Optional
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
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
