from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.api.deps import get_db, require_admin
from app.schemas.selection_item import (
    SelectionItemCreate, SelectionItemRead,
    CategorySelectionRead, ProductSelectionRead
)
from app.models.selection_item import SelectionType
from app.services.selection_item_service import (
    create_selection, delete_selection,
    get_category_selection, list_product_selections
)

router = APIRouter(tags=["selections"])

@router.post(
    "/",
    response_model=SelectionItemRead,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: criar seleção (produto ou categoria)"
)
def admin_create_selection(
    payload: SelectionItemCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    return create_selection(db, payload.type, str(payload.item_id))

@router.delete(
    "/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Admin: deletar seleção"
)
def admin_delete_selection(
    type: SelectionType = Query(..., description="product ou category"),
    item_id: Optional[UUID] = Query(None, description="item_id (obrigatório para produto)"),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    delete_selection(db, type, str(item_id) if item_id else None)
    return

@router.get(
    "/category",
    response_model=CategorySelectionRead,
    summary="Admin: obter seleção de categoria atual"
)
def admin_get_category_selection(
    db: Session = Depends(get_db),
):
    sel = get_category_selection(db)
    return {"item_id": sel.item_id}

@router.get(
    "/products",
    response_model=List[ProductSelectionRead],
    summary="Admin: listar todos produtos selecionados"
)
def admin_list_product_selections(
    db: Session = Depends(get_db),
):
    sels = list_product_selections(db)
    return [{"item_id": s.item_id} for s in sels]
