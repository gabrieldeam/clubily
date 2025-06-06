# backend/app/schemas/address.py

from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class AddressBase(BaseModel):
    street: str
    number: str
    neighborhood: str
    complement: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: Optional[str] = Field(default="Brasil")

class AddressCreate(AddressBase):
    # `is_selected` geralmente não faz parte do payload de criação: deixamos default=False
    is_selected: bool = Field(default=False, description="Se este é o endereço principal")

class AddressRead(AddressBase):
    id: UUID
    user_id: UUID
    is_selected: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AddressUpdate(BaseModel):
    # Para atualizar qualquer campo
    street: Optional[str] = None
    number: Optional[str] = None
    neighborhood: Optional[str] = None
    complement: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_selected: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)
