from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.fee_setting import SettingTypeEnum
from decimal import Decimal

class FeeSettingBase(BaseModel):
    setting_type: SettingTypeEnum = Field(..., description="Tipo de serviço")
    fee_amount: float           = Field(..., ge=0, description="Valor da taxa (ex: 0.10)")

class FeeSettingCreate(FeeSettingBase):
    pass

class FeeSettingUpdate(BaseModel):
    fee_amount: Decimal | None = Field(None, description="Novo valor da taxa (se omitido, mantém o atual)")

    model_config = ConfigDict()  # from_attributes if estiver lendo do ORM

class FeeSettingRead(FeeSettingBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
