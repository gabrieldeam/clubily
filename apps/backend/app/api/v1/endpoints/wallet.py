# backend/app/api/v1/endpoints/wallet.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_company
from app.schemas.wallet import WalletRead
from app.services.wallet_service import get_wallet_balance, get_or_create_wallet

router = APIRouter(tags=["wallet"])

@router.get(
    "/",
    response_model=WalletRead,
    summary="Saldo atual de créditos da empresa autenticada"
)
def read_wallet(
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    # garante que exista
    w = get_or_create_wallet(db, str(current_company.id))
    return w
