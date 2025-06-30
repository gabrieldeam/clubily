# app/api/v1/endpoints/points_wallet.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_company
from app.services.points_wallet_service import get_points_balance
from app.schemas.points_wallet import PointsBalance

router = APIRouter(tags=["points"])

@router.get("/balance", response_model=PointsBalance)
def read_points_balance(
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company)
):
    bal = get_points_balance(db, str(current_company.id))
    return {"balance": bal}
