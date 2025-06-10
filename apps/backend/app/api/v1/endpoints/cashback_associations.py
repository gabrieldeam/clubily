from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.schemas.cashback import CashbackCreate, CashbackRead
from app.services.cashback_service import (
    assign_cashback,
    get_cashbacks_by_user,
)

router = APIRouter(prefix="/users/{user_id}/cashbacks", tags=["cashbacks"])

@router.post("/", response_model=CashbackRead, status_code=status.HTTP_201_CREATED)
def create_cashback(
    user_id: str,
    payload: CashbackCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if str(current_user.id) != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN)
    return assign_cashback(db, user_id, payload.program_id, payload.amount_spent)

@router.get("/", response_model=List[CashbackRead])
def read_cashbacks(
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if str(current_user.id) != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN)
    return get_cashbacks_by_user(db, user_id)