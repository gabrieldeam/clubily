from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# --- Admin / público -----------------------------------------
class MilestoneBase(BaseModel):
    title: str
    description: str | None = None
    points: int
    order: int = 0
    active: bool = True

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(MilestoneBase):
    pass

class MilestoneRead(MilestoneBase):
    id: UUID
    image_url: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PaginatedMilestone(BaseModel):
    total: int
    skip: int
    limit: int
    items: list[MilestoneRead]
    model_config = ConfigDict(from_attributes=True)

# --- Para o usuário ------------------------------------------
class UserMilestoneRead(BaseModel):
    milestone: MilestoneRead
    achieved_at: datetime
    model_config = ConfigDict(from_attributes=True)


# app/schemas/milestone.py  (ou onde definiu)

class NextMilestoneRead(BaseModel):
    milestone_id: UUID
    title: str
    points: int          # <- era threshold
    image_url: str
    user_points: int
    remaining: int

class MilestoneStatusRead(BaseModel):
    id: UUID
    title: str
    points: int          # <- era threshold
    image_url: str
    achieved: bool
    achieved_at: datetime | None
