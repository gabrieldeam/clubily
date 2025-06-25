# backend/app/api/v1/endpoints/cashback_programs.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_company
from app.schemas.cashback_program import (
    CashbackProgramCreate,
    CashbackProgramRead,
    PaginatedProgramUsage,
    UserProgramStats,
)
from app.services.cashback_program_service import (
    create_program,
    get_programs_by_company,
    get_program,
    update_program,
    delete_program,
    get_program_associations_paginated,
    get_user_program_stats,
    get_public_programs_by_company,
    collect_program_metrics,
)
from app.models.cashback_program import CashbackProgram

router = APIRouter(tags=["cashback_programs"])

@router.post(
    "/",
    response_model=CashbackProgramRead,
    status_code=status.HTTP_201_CREATED,
    summary="Cria um programa de cashback para a empresa logada",
)
def create_cashback_program(
    payload: CashbackProgramCreate,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    return create_program(db, str(current_company.id), payload)


@router.get(
    "/",
    response_model=List[CashbackProgramRead],
    summary="Lista todos os programas da empresa logada",
)
def read_programs(
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    return get_programs_by_company(db, str(current_company.id))


@router.get(
    "/{program_id}",
    response_model=CashbackProgramRead,
    summary="Detalha um programa da empresa logada",
)
def read_program(
    program_id: str,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    prog = get_program(db, program_id)
    if not prog or str(prog.company_id) != str(current_company.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Programa não encontrado")
    return prog


@router.put(
    "/{program_id}",
    response_model=CashbackProgramRead,
    summary="Edita um programa da empresa logada",
)
def edit_program(
    program_id: str,
    payload: CashbackProgramCreate,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    prog = get_program(db, program_id)
    if not prog or str(prog.company_id) != str(current_company.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Programa não encontrado")
    return update_program(db, prog, payload.model_dump())


@router.delete(
    "/{program_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Exclui um programa da empresa logada",
)
def remove_program(
    program_id: str,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    prog = get_program(db, program_id)
    if not prog or str(prog.company_id) != str(current_company.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Programa não encontrado")
    delete_program(db, prog)

@router.get(
    "/{program_id}/usage",
    response_model=PaginatedProgramUsage,
    summary="Uso de um programa: métricas + associações paginadas",
)
def program_usage(
    program_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    # valida permissão...
    prog = db.get(CashbackProgram, program_id)
    if not prog or str(prog.company_id) != str(current_company.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Programa não encontrado")

    # coleta todas as métricas
    m = collect_program_metrics(db, program_id)

    # associações paginadas
    total_assocs, associations = get_program_associations_paginated(db, program_id, skip, limit)

    return PaginatedProgramUsage(
        total_cashback_value   = m["total_value"],
        usage_count            = m["usage_count"],
        average_amount_spent   = m["avg_amount"],
        unique_user_count      = m["unique_users"],
        average_uses_per_user  = m["avg_uses"],
        average_interval_days  = m["avg_interval"],
        total_associations     = total_assocs,
        skip                   = skip,
        limit                  = limit,
        associations           = associations,
    )


@router.get(
    "/{program_id}/user/{user_id}/stats",
    response_model=UserProgramStats,
    summary="Estatísticas de cashback de um usuário: programa específico + empresa inteira",
)
def program_user_stats(
    program_id: str = Path(..., description="UUID do programa de cashback"),
    user_id: str    = Path(..., description="UUID do usuário alvo"),
    db: Session     = Depends(get_db),
    current_company= Depends(get_current_company),
):
    # 1) valida que o programa existe e pertence à empresa logada
    prog = db.get(CashbackProgram, program_id)
    if not prog or str(prog.company_id) != str(current_company.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Programa não encontrado")

    # 2) busca stats
    return get_user_program_stats(
        db,
        company_id=str(current_company.id),
        program_id=program_id,
        user_id=user_id
    )

@router.get(
    "/{company_id}/public",
    response_model=List[CashbackProgramRead],
    status_code=status.HTTP_200_OK,
    summary="Lista os programas públicos e ativos de qualquer empresa",
)
def read_public_programs_by_company(
    company_id: str = Path(..., description="UUID da empresa"),
    db: Session    = Depends(get_db),
):
    """
    Retorna apenas os programas de cashback com is_active=True e is_visible=True
    pertencentes à empresa informada na URL.
    """
    return get_public_programs_by_company(db, company_id)