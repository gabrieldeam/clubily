from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.api.deps import get_db, get_current_user
from app.schemas.company_payment import PaginatedPayments, PaymentStatus
from app.services.company_payment_service import list_payments, get_balance
from app.models.user import Role

router = APIRouter(tags=["admin_payments"])

def ensure_admin(user=Depends(get_current_user)):
    if user.role != Role.admin:
        raise HTTPException(403, "Só admins")

@router.get(
    "/companies/{company_id}/credits/balance",
    response_model=float,
    dependencies=[Depends(ensure_admin)],
)
def admin_company_balance(
    company_id: str, db: Session = Depends(get_db)
):
    return get_balance(db, company_id)

@router.get(
    "/credits/history",
    response_model=PaginatedPayments,
    dependencies=[Depends(ensure_admin)],
)
def admin_all_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[PaymentStatus] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to:   Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    # coleta todos, ignorando company_id
    total, items = list_payments(db, None, skip, limit, status, date_from, date_to)
    return PaginatedPayments(total=total, skip=skip, limit=limit, items=items)
