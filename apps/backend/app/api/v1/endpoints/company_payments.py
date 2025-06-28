from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.api.deps import get_db, get_current_company
from app.schemas.company_payment import (
    CompanyPaymentCreate, CompanyPaymentRead,
    PaginatedPayments, PaymentStatus, PaginatedAdminPayments, PaymentStatus as PaymentStatusEnum
)
from app.services.company_payment_service import (
    create_charge, list_payments, get_balance, get_charge, list_all_company_payments
)

router = APIRouter(tags=["company_payments"])

@router.post(
    "/",
    response_model=CompanyPaymentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Gera cobrança PIX (crédito mínimo R$25)"
)
def buy_credits(
    payload: CompanyPaymentCreate,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    try:
        return create_charge(db, str(current_company.id), payload.amount)
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get(
    "/balance",
    response_model=float,
    summary="Saldo de créditos da empresa (aprovados)"
)
def read_balance(
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    return get_balance(db, str(current_company.id))

@router.get(
    "/history",
    response_model=PaginatedPayments,
    summary="Histórico de compras (filtros: status, date range)"
)
def read_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[PaymentStatus] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to:   Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    total, items = list_payments(
        db, str(current_company.id), skip, limit, status, date_from, date_to
    )
    return PaginatedPayments(total=total, skip=skip, limit=limit, items=items)


@router.get(
    "/{payment_id}",
    response_model=CompanyPaymentRead,
    summary="Recupera o status de uma cobrança PIX pelo ID",
)
def read_charge(
    payment_id: str,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    """
    Retorna a cobrança criada pela empresa autenticada
    para que o front possa verificar se já saiu CONFIRMED, RECEIVED, etc.
    """
    charge = get_charge(db, str(current_company.id), payment_id)
    if not charge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cobrança não encontrada"
        )
    return charge


@router.get(
    "/admin/payments",
    response_model=PaginatedAdminPayments,
    summary="(Admin) Lista todas as cobranças paginadas com dados da empresa"
)
def read_all_payments(
    skip: int = Query(0, ge=0, description="Quantos registros pular"),
    limit: int = Query(10, ge=1, le=100, description="Máximo por página"),
    status: Optional[PaymentStatusEnum] = Query(None, description="Filtrar por status"),
    date_from: Optional[datetime] = Query(None, description="Data mínima (inclusive)"),
    date_to:   Optional[datetime] = Query(None, description="Data máxima (inclusive)"),
    db: Session = Depends(get_db),
):
    total, payments = list_all_company_payments(
        db, skip, limit, status, date_from, date_to
    )
    return PaginatedAdminPayments(
        total=total,
        skip=skip,
        limit=limit,
        items=payments
    )