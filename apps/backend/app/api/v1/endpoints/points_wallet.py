# app/api/v1/endpoints/points_wallet.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_company, require_admin
from app.services.points_wallet_service import get_points_balance, debit_points, credit_points
from app.schemas.points_wallet import PointsBalance, PointsOperation, PointsTransaction, PaginatedPointsTransactions
from app.models.points_wallet_transaction import PointsWalletTransaction

router = APIRouter(tags=["points"])

@router.get("/balance", response_model=PointsBalance)
def read_points_balance(
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company)
):
    bal = get_points_balance(db, str(current_company.id))
    return {"balance": bal}

@router.get(
    "/transactions",
    response_model=PaginatedPointsTransactions,
    summary="Extrato paginado da própria empresa"
)
def list_own_transactions(
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, gt=0, le=100),
):
    """
    Retorna um extrato paginado (crédito e débito) da carteira da empresa autenticada.
    """
    base_q = db.query(PointsWalletTransaction).filter_by(company_id=current_company.id)
    total = base_q.count()
    items = (
        base_q
        .order_by(PointsWalletTransaction.created_at.desc())
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
    response_model=PointsBalance,
    dependencies=[Depends(require_admin)]
)
def read_points_balance_by_company(
    company_id: str,
    db: Session = Depends(get_db),
):
    """
    Admin only: retorna o saldo de pontos da empresa passada por ID.
    """
    balance = get_points_balance(db, company_id)
    return {"balance": balance}

@router.post(
    "/admin/{company_id}/debit",
    response_model=PointsBalance,
    dependencies=[Depends(require_admin)],
    summary="Admin: debita pontos de qualquer empresa"
)
def debit_points_by_company(
    company_id: str,
    op: PointsOperation,
    db: Session = Depends(get_db),
):
    """
    Admin apenas: debita `points` pontos da carteira da empresa passada por ID.
    Esta é uma **retirada especial de pontos**.
    """
    # passa a descrição da transação aqui no endpoint:
    debit_points(
        db,
        company_id,
        op.points,
        description="retirada especial de pontos"
    )
    balance = get_points_balance(db, company_id)
    return {"balance": balance}


@router.post(
    "/admin/{company_id}/credit",
    response_model=PointsBalance,
    dependencies=[Depends(require_admin)],
    summary="Admin: credita pontos na carteira de qualquer empresa"
)
def credit_points_by_company(
    company_id: str,
    op: PointsOperation,
    db: Session = Depends(get_db),
):
    """
    Admin apenas: credita `points` pontos na carteira da empresa identificada por `company_id`.
    Esta é uma **inclusão especial de créditos**.
    """
    # passa a descrição da transação aqui no endpoint:
    credit_points(
        db,
        company_id,
        op.points,
        description="inclusão especial de pontos"
    )
    balance = get_points_balance(db, company_id)
    return {"balance": balance}


@router.get(
    "/admin/{company_id}/transactions",
    response_model=PaginatedPointsTransactions,
    dependencies=[Depends(require_admin)],
    summary="Admin: extrato paginado de qualquer empresa"
)
def list_transactions_by_company(
    company_id: str,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, gt=0, le=100),
):
    """
    Admin apenas: retorna um extrato paginado da empresa passada por ID.
    """
    base_q = db.query(PointsWalletTransaction).filter_by(company_id=company_id)
    total = base_q.count()
    items = (
        base_q
        .order_by(PointsWalletTransaction.created_at.desc())
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