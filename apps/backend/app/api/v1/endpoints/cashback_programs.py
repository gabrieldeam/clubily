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

router = APIRouter(prefix="/companies/{company_id}/cashback-programs", tags=["cashback_programs"])

@router.post("/", response_model=CashbackProgramRead, status_code=status.HTTP_201_CREATED)
def create_cashback_program(
    company_id: str,
    payload: CashbackProgramCreate,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    if str(current_company.id) != company_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN)
    return create_program(db, company_id, payload)

@router.get("/", response_model=List[CashbackProgramRead])
def read_programs(
    company_id: str,
    db: Session = Depends(get_db),
):
    return get_programs_by_company(db, company_id)

@router.get("/{program_id}", response_model=CashbackProgramRead)
def read_program(
    program_id: str,
    db: Session = Depends(get_db),
):
    prog = get_program(db, program_id)
    if not prog:
        raise HTTPException(status.HTTP_404_NOT_FOUND)
    return prog

@router.put("/{program_id}", response_model=CashbackProgramRead)
def edit_program(
    company_id: str,
    program_id: str,
    payload: CashbackProgramCreate,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    prog = get_program(db, program_id)
    if not prog or str(prog.company_id) != company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND)
    return update_program(db, prog, payload.model_dump())

@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_program(
    company_id: str,
    program_id: str,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    prog = get_program(db, program_id)
    if not prog or str(prog.company_id) != company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND)
    delete_program(db, prog)