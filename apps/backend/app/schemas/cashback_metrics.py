from datetime import date
from typing import List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class DataPoint(BaseModel):
    day: date
    value: float

    model_config = ConfigDict(from_attributes=True)

class MonthlyCharts(BaseModel):
    spend_by_day:        List[DataPoint]  # Gastos (amount_spent) por dia
    cashback_value_by_day: List[DataPoint]  # Valor de cashback gerado por dia
    cashback_count_by_day: List[DataPoint]  # Quantas associações por dia
    new_users_by_day:    List[DataPoint]  # Usuários cadastrados por dia

    model_config = ConfigDict(from_attributes=True)


class ProgramMetrics(BaseModel):
    program_id: UUID = Field(..., description="UUID do programa")
    name: str = Field(..., description="Nome do programa")
    total_cashback_value: float = Field(..., description="Soma de todos os cashbacks deste programa")
    usage_count: int = Field(..., description="Total de associações (usos) deste programa")
    average_amount_spent: float = Field(..., description="Valor médio gasto por uso")
    unique_user_count: int = Field(..., description="Número de usuários distintos que usaram este programa")
    average_uses_per_user: float = Field(..., description="Média de usos por usuário")
    average_interval_days: Optional[float] = Field(None, description="Intervalo médio em dias entre usos (por usuário)")
    roi: Optional[float] = Field(None, description="Approx. ROI: total_amount_spent / total_cashback_value")

    model_config = ConfigDict(from_attributes=True)

class CompanyMetrics(BaseModel):
    company_id: UUID = Field(..., description="UUID da empresa")
    total_cashback_value: float = Field(..., description="Soma de todos os valores de cashback")
    total_amount_spent: float = Field(..., description="Soma de todos os valores gastos")
    usage_count: int = Field(..., description="Total de associações realizadas")
    unique_user_count: int = Field(..., description="Número de usuários diferentes que receberam cashback")
    average_amount_spent_per_use: float = Field(..., description="Valor médio gasto por associação")
    average_uses_per_user: float = Field(..., description="Média de usos por usuário")
    # opcional: intervalo médio entre associações em dias (difícil de calcular exatamente)
    generated_at: datetime = Field(..., description="Timestamp da geração deste resumo")

    model_config = ConfigDict(from_attributes=True)