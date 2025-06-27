# backend/app/api/v1/endpoints/admin_commissions.py

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, require_admin
from app.services.commission_service import (
    list_withdrawals, change_withdrawal_status
)
from app.schemas.commission import CommissionWithdrawalRead

router = APIRouter(
    tags=["admin_commissions"],
    dependencies=[Depends(require_admin)]
)

@router.get("/", response_model=List[CommissionWithdrawalRead])
def read_withdrawals(
    skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total, items = list_withdrawals(db, skip, limit)
    return items

@router.patch("/{withdrawal_id}/approve", response_model=CommissionWithdrawalRead)
def approve_withdrawal(
    withdrawal_id: str, db: Session = Depends(get_db)
):
    try:
        return change_withdrawal_status(db, withdrawal_id, approve=True)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/{withdrawal_id}/reject", response_model=CommissionWithdrawalRead)
def reject_withdrawal(
    withdrawal_id: str, db: Session = Depends(get_db)
):
    try:
        return change_withdrawal_status(db, withdrawal_id, approve=False)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
