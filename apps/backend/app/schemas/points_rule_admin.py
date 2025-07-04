# backend/app/schemas/points_rule_admin.py
from uuid import UUID
from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict
from .points_rule import RuleType

class PointsRuleWithCompany(BaseModel):
    id: UUID
    company_id: UUID
    company_name: str
    name: str
    description: str | None
    rule_type: RuleType
    active: bool
    visible: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict()

class PaginatedRules(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[PointsRuleWithCompany]
