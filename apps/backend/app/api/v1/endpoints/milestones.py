from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, Path, status, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.api.deps import get_db, require_admin, get_current_user
from app.services.file_service import save_upload
from app.services.milestone_service import (
    create_milestone, update_milestone, delete_milestone,
    list_milestones, get_user_milestones, get_next_milestone_status, list_all_milestones_with_status
)
from app.schemas.milestone import (
    MilestoneCreate, MilestoneUpdate, MilestoneRead,
    PaginatedMilestone, UserMilestoneRead, NextMilestoneRead, MilestoneStatusRead
)
from app.models.milestone import Milestone

router = APIRouter(tags=["milestones"])

# ---------- ADMIN -------------------------------------------------------------

@router.post(
    "/admin",
    response_model=MilestoneRead,
    status_code=status.HTTP_201_CREATED
)
def admin_create_milestone(
    title: str = Form(...),
    description: str | None = Form(None),
    points: int = Form(..., ge=1),
    order: int = Form(0),
    active: bool = Form(True),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    img_url = save_upload(image, "milestones")
    payload = MilestoneCreate(
        title=title, description=description,
        points=points, order=order, active=active
    )
    return create_milestone(db, payload, img_url)


@router.get(
    "/admin",
    response_model=PaginatedMilestone,
    summary="Admin: listar marcos (paginado)"
)
def admin_list_milestones(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    total = db.query(Milestone).count()
    items = list_milestones(db, skip, limit)
    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.put(
    "/admin/{mid}",
    response_model=MilestoneRead,
    summary="Admin: editar marco"
)
def admin_update_milestone(
    mid: UUID = Path(...),
    title: str = Form(...),
    description: str | None = Form(None),
    points: int = Form(..., ge=1),
    order: int = Form(0),
    active: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    img_url = save_upload(image, "milestones") if image else None
    payload = MilestoneUpdate(
        title=title, description=description,
        points=points, order=order, active=active
    )
    return update_milestone(db, mid, payload, img_url)


@router.delete(
    "/admin/{mid}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Admin: excluir marco"
)
def admin_delete_milestone(
    mid: UUID = Path(...),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    delete_milestone(db, mid)
    return

# ---------- USER --------------------------------------------------------------

@router.get(
    "/my",
    response_model=List[UserMilestoneRead],
    summary="Usuário: meus marcos conquistados"
)
def my_milestones(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_user_milestones(db, str(current_user.id))


@router.get(
    "/next",
    response_model=NextMilestoneRead,
    summary="Usuário: próximo marco e pontos faltantes"
)
def my_next_milestone(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    status = get_next_milestone_status(db, str(current_user.id))
    if not status:
        raise HTTPException(404, "Você já atingiu o maior marco disponível")
    return status

@router.get(
    "/all",
    response_model=List[MilestoneStatusRead],
    summary="Usuário: lista todos os marcos e indica quais já conquistou"
)
def all_milestones(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return list_all_milestones_with_status(db, str(current_user.id))