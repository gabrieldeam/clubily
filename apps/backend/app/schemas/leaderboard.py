# app/schemas/leaderboard.py
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class LeaderboardEntry(BaseModel):
    user_id: UUID
    name: str
    points: int

class PaginatedLeaderboard(BaseModel):
    total: int
    skip: int
    limit: int
    items: list[LeaderboardEntry]
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)
