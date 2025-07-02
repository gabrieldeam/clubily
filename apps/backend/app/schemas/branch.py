### backend/app/schemas/branch.py ###
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class BranchBase(BaseModel):
    name: str
    slug: str

class BranchCreate(BranchBase):
    pass

class BranchRead(BranchBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)