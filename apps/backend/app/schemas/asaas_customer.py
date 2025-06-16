# backend/app/schemas/asaas_customer.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class AsaasCustomerCreate(BaseModel):
    name: str = Field(..., description="Nome da empresa")
    email: EmailStr = Field(..., description="E-mail de cobrança")
    cpfCnpj: str = Field(..., description="CPF ou CNPJ do cliente")
    phone: str | None = Field(None, description="Telefone (opcional)")
    model_config = ConfigDict()
    
class CompanyAsaasCustomerRead(BaseModel):
    customer_id: str
    model_config = ConfigDict(from_attributes=True)
