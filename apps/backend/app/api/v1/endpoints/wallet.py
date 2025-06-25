# backend/app/api/v1/endpoints/wallet.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path, status, Query
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from app.api.deps import get_db, get_current_company, get_current_user
from app.schemas.wallet import WalletRead, UserCashbackWalletRead, WalletSummary, UserWalletRead, WalletWithdraw, UserWalletRead, WalletTransactionRead
from app.services.wallet_service import (
    get_or_create_wallet,
    list_user_wallets,
    get_user_wallet,
    get_user_wallet_summary,
    get_or_create_user_wallet,
    withdraw_user_wallet,
)
from uuid import UUID
from app.services.cashback_service import (
    expire_overdue_cashbacks
)
from app.models.wallet_transaction import WalletTransaction


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

@router.get(
    "/cashback-wallets",
    response_model=List[UserCashbackWalletRead],
    summary="Lista todas as carteiras de cashback do usuário logado"
)
def read_my_wallets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user.id)
    return list_user_wallets(db, user_id)


@router.get(
    "/cashback-wallets/summary",
    response_model=WalletSummary,
    summary="Resumo: total de saldo e número de carteiras do usuário logado"
)
def read_wallets_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # 1) expira tudo que venceu antes de resumir
    expire_overdue_cashbacks(db)

    # 2) retorna total + count
    user_id = str(current_user.id)
    return get_user_wallet_summary(db, user_id)


@router.get(
    "/debits",
    response_model=List[WalletTransactionRead],
    summary="Lista apenas os débitos da carteira do usuário logado para uma empresa"
)
def read_wallet_debits(
    company_id: str = Query(..., description="UUID da empresa para filtrar débitos"),
    skip: int = Query(0, ge=0, description="Quantos registros pular"),
    limit: int = Query(50, ge=1, le=200, description="Máximo de registros"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # 1) busca só os lançamentos negativos (débitos)
    q = (
        db.query(WalletTransaction)
          .filter(
              WalletTransaction.user_id    == current_user.id,
              WalletTransaction.company_id == company_id,
              WalletTransaction.amount     < Decimal("0.00")
          )
    )

    # 2) aplica paginação e ordenação por data decrescente
    transactions = (
        q.order_by(WalletTransaction.created_at.desc())
         .offset(skip)
         .limit(limit)
         .all()
    )

    return transactions

@router.get(
    "/summary",
    summary="Resumo de todas as carteiras do usuário logado",
)
def wallet_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_user_wallet_summary(db, str(current_user.id))

@router.get(
    "/cashback-wallets/{company_id}",
    response_model=UserCashbackWalletRead,
    summary="Detalha a carteira de cashback para uma empresa específica"
)
def read_my_company_wallet(
    company_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    expire_overdue_cashbacks(db)

    user_id = str(current_user.id)
    w = get_user_wallet(db, user_id, company_id)
    if not w:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Carteira não encontrada")
    return w


@router.get(
    "/{user_id}/wallet",
    response_model=UserWalletRead,
    status_code=status.HTTP_200_OK,
    summary="Saldo de cashback do usuário para a empresa logada",
)
def read_user_wallet(
    user_id: UUID = Path(..., description="UUID do usuário"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    # busca (ou cria) a carteira do usuário para esta empresa
    w = get_or_create_user_wallet(db, str(user_id), str(current_company.id))
    if not w:
        # na prática get_or_create nunca devolve None, mas garante
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Carteira não encontrada")
    return w

@router.post(
    "/{user_id}/wallet/withdraw",
    response_model=UserWalletRead,
    status_code=status.HTTP_200_OK,
    summary="Debita um valor da carteira de cashback de um usuário (pela empresa autenticada)"
)
def withdraw_cashback(
    user_id: str = Path(..., description="UUID do usuário cujo saldo será debitado"),
    payload: WalletWithdraw = None,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    """
    A empresa logada informa um `amount` para debitar da carteira do `user_id`.
    Retorna a carteira atualizada.
    """
    try:
        w = withdraw_user_wallet(
            db,
            user_id,
            str(current_company.id),
            payload.amount,
        )
        return w
    except ValueError as e:
        # regras de negócio / saldo insuficiente
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))