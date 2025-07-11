# backend/app/api/v1/endpoints/slides.py

from fastapi import (
    APIRouter, Depends, UploadFile, File, Form,
    Query, Path, HTTPException, status
)
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.api.deps import get_db, require_admin, get_current_user
from app.services.file_service import save_upload
from app.services.slide_image_service import (
    create_slide, list_slides, get_slide,
    update_slide, delete_slide
)
from app.schemas.slide_image import (
    SlideImageCreate, SlideImageRead, SlideImageUpdate,
    PaginatedSlideImage
)
from app.models.slide_image import SlideImage

router = APIRouter(tags=["slides"])


# ─── Admin: CRUD de slides ─────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=SlideImageRead,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: criar slide",
    dependencies=[Depends(require_admin)]
)
def admin_create_slide(
    title: str = Form(...),
    order: int = Form(0),
    active: bool = Form(True),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # salva o arquivo em app/static/rewards/slides
    img_url = save_upload(image, "slides")
    return create_slide(db, title, img_url, order, active)


@router.get(
    "/",
    response_model=PaginatedSlideImage,
    summary="Admin: listar slides (paginado)",
    dependencies=[Depends(require_admin)]
)
def admin_list_slides(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, gt=0, le=100),
    db: Session = Depends(get_db),
):
    total = db.query(SlideImage).count()
    items = list_slides(db, skip, limit)
    return {"total": total, "skip": skip, "limit": limit, "items": items}

# ─── Autenticado: listar todos os slides ativos ────────────────────────────────

@router.get(
    "/active",
    response_model=List[SlideImageRead],
    summary="Listar todos os slides ativos (usuário autenticado)"
)
def list_active_slides(
    db: Session = Depends(get_db),
    _user = Depends(get_current_user),
):
    """
    Retorna todos os slides com `active=True`, ordenados pelo campo `order`.
    Exige apenas que o usuário esteja autenticado — não precisa ser admin.
    """
    slides = (
        db.query(SlideImage)
          .filter_by(active=True)
          .order_by(SlideImage.order)
          .all()
    )
    return slides


@router.get(
    "/{slide_id}",
    response_model=SlideImageRead,
    summary="Admin: obter slide por ID",
    dependencies=[Depends(require_admin)]
)
def admin_get_slide(
    slide_id: UUID = Path(...),
    db: Session = Depends(get_db),
):
    return get_slide(db, slide_id)


@router.put(
    "/{slide_id}",
    response_model=SlideImageRead,
    summary="Admin: editar slide",
    dependencies=[Depends(require_admin)]
)
def admin_update_slide(
    slide_id: UUID = Path(...),
    title: str = Form(...),
    order: int = Form(0),
    active: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    img_url = save_upload(image, "slides") if image else None
    return update_slide(db, slide_id, title, img_url, order, active)


@router.delete(
    "/{slide_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Admin: excluir slide",
    dependencies=[Depends(require_admin)]
)
def admin_delete_slide(
    slide_id: UUID = Path(...),
    db: Session = Depends(get_db),
):
    delete_slide(db, slide_id)
    return


