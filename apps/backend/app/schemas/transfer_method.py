# app/schema/transfer_method.py

from uuid import UUID
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict

class PixKeyType(str, Enum):
    PHONE  = "PHONE"
    EMAIL  = "EMAIL"
    CPF    = "CPF"
    CNPJ   = "CNPJ"
    RANDOM = "RANDOM"

class TransferMethodCreate(BaseModel):
    name: str
    key_type: PixKeyType
    key_value: str

class TransferMethodRead(BaseModel):
    id: UUID
    name: str
    key_type: PixKeyType
    key_value: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
