# app/schemas/points_wallet.py
from pydantic import BaseModel, ConfigDict

class PointsBalance(BaseModel):
    balance: int
    model_config = ConfigDict()
