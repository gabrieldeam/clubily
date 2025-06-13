# backend/app/api/v1/endpoints/cashback_associations.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, get_current_company, get_current_user
from app.schemas.cashback import CashbackCreate, CashbackRead, CashbackSummary, UserCashbackCompany, PaginatedCashbacks
from app.services.cashback_service import assign_cashback, get_cashbacks_by_user, get_cashbacks_by_user, get_cashback_summary, get_companies_with_cashback, get_cashbacks_by_user_and_company
from app.models.cashback_program import CashbackProgram
from app.models.cashback import Cashback

router = APIRouter(tags=["cashback_associations"])

@router.post(
    "/{user_id}",
    response_model=CashbackRead,
    status_code=status.HTTP_201_CREATED,
    summary="Associa um cashback a um usuário (feita pela empresa autenticada)"
)
def create_cashback(
    user_id: str,
    payload: CashbackCreate,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    program = db.get(CashbackProgram, payload.program_id)
    if not program or str(program.company_id) != str(current_company.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Programa de cashback não encontrado ou não pertence à sua empresa"
        )
    
    return assign_cashback(db, user_id, payload.program_id, payload.amount_spent)


@router.get(
    "/",
    response_model=PaginatedCashbacks,
    summary="Lista todos os cashbacks do usuário logado (páginação disponível)"
)
def read_cashbacks(
    skip: int = Query(0, ge=0, description="Quantos registros pular"),
    limit: int = Query(10, ge=1, le=100, description="Máx. de registros"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user.id)

    total = db.query(func.count(Cashback.id)) \
              .filter(Cashback.user_id == user_id).scalar()
    items = get_cashbacks_by_user(db, user_id, skip, limit)

    return PaginatedCashbacks(
        total=total,
        skip=skip,
        limit=limit,
        items=items,
    )


@router.get(
    "/summary",
    response_model=CashbackSummary,
    summary="Resumo de todos os cashbacks: total e próxima expiração"
)
def read_cashback_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user.id)
    return get_cashback_summary(db, user_id)


@router.get(
    "/companies",
    response_model=List[UserCashbackCompany],
    summary="Lista empresas para as quais o usuário logado tem cashback (paginado)"
)
def read_companies_with_cashback(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user.id)
    companies = get_companies_with_cashback(db, user_id, skip, limit)
    return [
        UserCashbackCompany(
            company_id=c.id,
            name=c.name,
            logo_url=c.logo_url,
        )
        for c in companies
    ]


@router.get(
    "/company/{company_id}",
    response_model=List[CashbackRead],
    summary="Lista cashbacks do usuário logado em uma empresa específica (paginado)"
)
def read_cashbacks_by_company(
    company_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user.id)
    return get_cashbacks_by_user_and_company(
        db, user_id, company_id, skip, limit
    )