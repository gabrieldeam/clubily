# backend/app/api/v1/endpoints/wallet.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path, status, Query
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from app.api.deps import get_db, get_current_company, get_current_user, require_admin
from app.schemas.wallet import WalletRead, UserCashbackWalletRead, WalletSummary, UserWalletRead, WalletWithdraw, UserWalletRead, WalletTransactionRead, WalletOperation, PaginatedWalletTransactions
from app.services.wallet_service import (
    get_or_create_wallet,
    list_user_wallets,
    get_user_wallet,
    get_user_wallet_summary,
    get_or_create_user_wallet,
    withdraw_user_wallet,
    credit_wallet,
    debit_wallet
)
from uuid import UUID
from app.services.cashback_service import (
    expire_overdue_cashbacks
)
from app.models.wallet_transaction import WalletTransaction
from app.models.credits_wallet_transaction import CreditsWalletTransaction


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
    "/transactions",
    response_model=PaginatedWalletTransactions,
    summary="Extrato paginado de créditos da própria empresa"
)
def list_own_wallet_transactions(
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, gt=0, le=100),
):
    """
    Retorna o extrato (crédito e débito) paginado da carteira da empresa autenticada.
    """
    base_q = (
        db.query(CreditsWalletTransaction)
          .filter_by(company_id=current_company.id)
    )
    total = base_q.count()
    items = (
        base_q
        .order_by(CreditsWalletTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items,
    }

@router.get(
    "/admin/{company_id}/balance",
    response_model=WalletRead,
    dependencies=[Depends(require_admin)]
)
def read_points_balance_by_company(
    company_id: str,
    db: Session = Depends(get_db),
):
    """
    Admin only: retorna o saldo de pontos da empresa passada por ID.
    """
    wallet = get_or_create_wallet(db, company_id)
    return wallet

@router.post(
    "/admin/{company_id}/credit",
    response_model=WalletRead,
    dependencies=[Depends(require_admin)],
    summary="Admin: credita créditos em uma empresa"
)
def admin_credit_wallet(
    company_id: str,
    op: WalletOperation,
    db: Session = Depends(get_db),
):
    """
    Admin apenas: credita `amount` reais na carteira da empresa.
    """
    w = credit_wallet(
        db,
        company_id,
        op.amount,
        description="inclusão especial de créditos"
    )
    return w

# -- débito admin ---
@router.post(
    "/admin/{company_id}/debit",
    response_model=WalletRead,
    dependencies=[Depends(require_admin)],
    summary="Admin: debita créditos de uma empresa"
)
def admin_debit_wallet(
    company_id: str,
    op: WalletOperation,
    db: Session = Depends(get_db),
):
    """
    Admin apenas: debita `amount` reais da carteira da empresa.
    """
    try:
        w = debit_wallet(
            db,
            company_id,
            op.amount,
            description="retirada especial de créditos"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return w


@router.get(
    "/admin/{company_id}/transactions",
    response_model=PaginatedWalletTransactions,
    dependencies=[Depends(require_admin)],
    summary="Admin: extrato paginado de créditos"
)
def admin_list_wallet_transactions(
    company_id: str,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, gt=0, le=100),
):
    """
    Admin apenas: extrato de transações de crédito/débito de uma empresa.
    """
    base_q = db.query(CreditsWalletTransaction).filter_by(company_id=company_id)
    total = base_q.count()
    items = (
        base_q
        .order_by(CreditsWalletTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items,
    }









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