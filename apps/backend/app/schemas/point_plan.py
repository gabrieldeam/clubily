# app/schemas/point_plan.py
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List

class PointPlanBase(BaseModel):
    name: str
    subtitle: Optional[str]
    description: str
    recommended: bool = False
    price: float = Field(..., gt=0)

class PointPlanCreate(PointPlanBase):
    pass

class PointPlanUpdate(BaseModel):
    name: Optional[str]
    subtitle: Optional[str]
    description: Optional[str]
    recommended: Optional[bool]
    price: Optional[float] = Field(None, gt=0)
    model_config = ConfigDict(from_attributes=True)

class PointPlanRead(PointPlanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PaginatedPointPlans(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[PointPlanRead]
