# backend/app/api/v1/endpoints/cashback_programs.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_company
from app.schemas.cashback_program import (
    CashbackProgramCreate,
    CashbackProgramRead,
)
from app.services.cashback_program_service import (
    create_program,
    get_programs_by_company,
    get_program,
    update_program,
    delete_program,
)

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
