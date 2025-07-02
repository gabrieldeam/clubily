### backend/app/api/v1/endpoints/branches.py ###
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.api.deps import get_db, get_current_company
from app.schemas.branch import BranchCreate, BranchRead
from app.models.branch import Branch

router = APIRouter(tags=["branches"])

@router.get("/", response_model=list[BranchRead])
def list_branches(db: Session = Depends(get_db), current_company=Depends(get_current_company)):
    return db.query(Branch).filter_by(company_id=current_company.id).all()

@router.post("/", response_model=BranchRead, status_code=status.HTTP_201_CREATED)
def create_branch(payload: BranchCreate, db: Session = Depends(get_db), current_company=Depends(get_current_company)):
    b = Branch(company_id=current_company.id, **payload.dict())
    db.add(b); db.commit(); db.refresh(b)
    return b

@router.put("/{branch_id}", response_model=BranchRead)
def update_branch(branch_id: UUID, payload: BranchCreate, db: Session = Depends(get_db), current_company=Depends(get_current_company)):
    b = db.get(Branch, branch_id)
    if not b or b.company_id != current_company.id:
        raise HTTPException(404)
    for k, v in payload.dict().items():
        setattr(b, k, v)
    db.commit(); db.refresh(b); return b

@router.delete("/{branch_id}", status_code=204)
def delete_branch(branch_id: UUID, db: Session = Depends(get_db), current_company=Depends(get_current_company)):
    b = db.get(Branch, branch_id)
    if not b or b.company_id != current_company.id:
        raise HTTPException(404)
    db.delete(b); db.commit()