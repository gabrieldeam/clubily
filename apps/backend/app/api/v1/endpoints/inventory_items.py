### backend/app/api/v1/endpoints/inventory_items.py ###
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from app.api.deps import get_db, get_current_company
from app.schemas.inventory_item import InventoryItemCreate, InventoryItemRead, PaginatedInventoryItems
from app.models.inventory_item import InventoryItem
from app.models.product_category import ProductCategory
from sqlalchemy import or_

router = APIRouter(tags=["inventory"])

@router.get(
    "/",
    response_model=PaginatedInventoryItems,
    summary="Listar itens de inventário (paginado)"
)
def list_items(
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(10, gt=0, le=100, description="Máximo de registros retornados"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company)
):
    # constrói query base filtrando pela empresa
    q = db.query(InventoryItem).filter_by(company_id=current_company.id)

    total = q.count()
    items = q.offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items
    }

@router.post("/", response_model=InventoryItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: InventoryItemCreate, db: Session = Depends(get_db), current_company=Depends(get_current_company)):
    data = payload.dict()
    category_ids = data.pop("category_ids", [])
    it = InventoryItem(company_id=current_company.id, **data)
    if category_ids:
        cats = db.query(ProductCategory).filter(ProductCategory.id.in_(category_ids), ProductCategory.company_id==current_company.id).all()
        it.categories = cats
    db.add(it); db.commit(); db.refresh(it)
    return it

@router.put("/{item_id}", response_model=InventoryItemRead)
def update_item(item_id: UUID, payload: InventoryItemCreate, db: Session = Depends(get_db), current_company=Depends(get_current_company)):
    it = db.get(InventoryItem, item_id)
    if not it or it.company_id != current_company.id:
        raise HTTPException(404)
    data = payload.dict()
    category_ids = data.pop("category_ids", [])
    for k, v in data.items():
        setattr(it, k, v)
    if category_ids is not None:
        cats = db.query(ProductCategory).filter(ProductCategory.id.in_(category_ids), ProductCategory.company_id==current_company.id).all()
        it.categories = cats
    db.commit(); db.refresh(it); return it

@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: UUID, db: Session = Depends(get_db), current_company=Depends(get_current_company)):
    it = db.get(InventoryItem, item_id)
    if not it or it.company_id != current_company.id:
        raise HTTPException(404)
    db.delete(it); db.commit()


@router.get(
    "/search",
    response_model=PaginatedInventoryItems,
    summary="Buscar itens de inventário por nome ou SKU (paginado)"
)
def search_items(
    q: str = Query(..., min_length=1, description="Termo de busca (nome ou SKU)"),
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(10, gt=0, le=100, description="Máximo de registros retornados"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company)
):
    # query base: filtra apenas itens da empresa
    base_q = db.query(InventoryItem).filter_by(company_id=current_company.id)
    # adiciona filtro de busca (ILIKE para case‑insensitive)
    pattern = f"%{q}%"
    base_q = base_q.filter(
        or_(
            InventoryItem.name.ilike(pattern),
            InventoryItem.sku.ilike(pattern)
        )
    )

    total = base_q.count()
    items = base_q.offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items
    }