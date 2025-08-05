### backend/app/api/v1/endpoints/product_categories.py ###
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.api.deps import get_db, get_current_company
from app.schemas.product_category import (
    ProductCategoryCreate,
    ProductCategoryRead,
    PaginatedProductCategories,ProductCategoryBasic
)
from app.models.product_category import ProductCategory

router = APIRouter(tags=["product_categories"])

@router.get(
    "/",
    response_model=PaginatedProductCategories,
    summary="Listar categorias de produto (paginado)"
)
def list_categories(
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(10, gt=0, le=100, description="Máximo de registros retornados"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company)
):
    # Query base
    q = db.query(ProductCategory).filter_by(company_id=current_company.id)
    total = q.count()
    items = q.offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items
    }

@router.get(
    "/by-ids",
    response_model=List[ProductCategoryBasic],
    summary="Buscar categorias por uma lista de IDs (retorna só id e name)"
)
def get_categories_by_ids(
    ids: List[UUID] = Query(
        ...,
        description="Repita o parâmetro para cada ID. Ex.: ?ids=a&ids=b&ids=c"
    ),
    db: Session = Depends(get_db),
):
    """
    Retorna somente `id` e `name` das categorias informadas.
    Não dispara 404 se alguma não existir; apenas ignora as inexistentes.
    Mantém a ordem dos IDs recebidos.
    """
    if not ids:
        return []

    rows = db.query(ProductCategory).filter(ProductCategory.id.in_(ids)).all()
    by_id = {c.id: c for c in rows}
    return [by_id[i] for i in ids if i in by_id]

@router.post("/", response_model=ProductCategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(payload: ProductCategoryCreate, db: Session = Depends(get_db), current_company=Depends(get_current_company)):
    cat = ProductCategory(company_id=current_company.id, **payload.dict())
    db.add(cat); db.commit(); db.refresh(cat)
    return cat

@router.put("/{category_id}", response_model=ProductCategoryRead)
def update_category(category_id: UUID, payload: ProductCategoryCreate, db: Session = Depends(get_db), current_company=Depends(get_current_company)):
    cat = db.get(ProductCategory, category_id)
    if not cat or cat.company_id != current_company.id:
        raise HTTPException(404)
    for k, v in payload.dict().items():
        setattr(cat, k, v)
    db.commit(); db.refresh(cat)
    return cat

@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: UUID, db: Session = Depends(get_db), current_company=Depends(get_current_company)):
    cat = db.get(ProductCategory, category_id)
    if not cat or cat.company_id != current_company.id:
        raise HTTPException(404)
    db.delete(cat); db.commit()