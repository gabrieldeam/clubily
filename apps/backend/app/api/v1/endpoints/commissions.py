# backend/app/api/v1/endpoints/commissions.py

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import List
from app.api.deps import get_db, get_current_user
from app.services.commission_service import (
    get_commission_balance, list_commission_transactions,
    request_commission_withdrawal, list_withdrawals_for_user
)
from app.schemas.commission import (
    CommissionBalance, CommissionTxRead,
    PaginatedCommissionTx, CommissionWithdrawalCreate, CommissionWithdrawalRead
)

router = APIRouter(tags=["commissions"])

@router.get("/balance", response_model=CommissionBalance)
def read_commission_balance(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    bal = get_commission_balance(db, str(user.id))
    return {"balance": float(bal)}

@router.get("/history", response_model=PaginatedCommissionTx)
def read_commission_history(
    skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    total, items = list_commission_transactions(db, str(user.id), skip, limit)
    return {"total": total, "skip": skip, "limit": limit, "items": items}

@router.post(
    "/withdrawals",
    response_model=CommissionWithdrawalRead,
    status_code=status.HTTP_201_CREATED
)
def make_withdrawal(
    payload: CommissionWithdrawalCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        # 1) valida método existe e pertence ao user
        from app.services.transfer_method_service import get_transfer_method
        tm = get_transfer_method(db, str(user.id), str(payload.transfer_method_id))
        if not tm:
            raise ValueError("Método de transferência inválido")
        # 2) solicita saque informando o método
        wr = request_commission_withdrawal(
            db, str(user.id),
            Decimal(str(payload.amount)),
            transfer_method_id=str(payload.transfer_method_id)
        )
        return wr
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get(
    "/withdrawals",
    response_model=List[CommissionWithdrawalRead],
    summary="Lista as suas solicitações de saque"
)
def read_my_withdrawals(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # busca só as retiradas do wallet do próprio user
    from app.services.commission_service import list_withdrawals_for_user
    return list_withdrawals_for_user(db, str(user.id))