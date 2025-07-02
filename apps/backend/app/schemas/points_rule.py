# backend/app/schemas/points_rule.py
from uuid import UUID
from enum import Enum
from typing import Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class RuleType(str, Enum):
    value_spent = "value_spent"
    event = "event"
    frequency = "frequency"
    category = "category"
    first_purchase = "first_purchase"
    recurrence = "recurrence"
    digital_behavior = "digital_behavior"
    special_date = "special_date"
    geolocation = "geolocation"
    inventory = "inventory"

class PointsRuleBase(BaseModel):
    name: str
    description: str | None
    rule_type: RuleType
    config: Dict[str, Any]
    active: bool = True
    visible: bool = True

    model_config = ConfigDict()

class PointsRuleCreate(PointsRuleBase):
    pass

class PointsRuleUpdate(PointsRuleBase):
    pass

class PointsRuleRead(PointsRuleBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
