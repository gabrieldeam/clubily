from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.category import CategoryCreate, CategoryRead
from app.services.category_service import (
    create_category, get_category,
    update_category, delete_category,
    list_categories, get_category_by_name
)
from app.db.deps import get_db

router = APIRouter(prefix="/categories", tags=["categories"])

@router.post("/", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category_endpoint(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
):
    # verifica duplicata
    if get_category_by_name(db, category_in.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category_in.name}' already exists"
        )
    return create_category(db, category_in)

@router.get("/{category_id}", response_model=CategoryRead)
def read_category(
    category_id: str,
    db: Session = Depends(get_db),
):
    category = get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.put("/{category_id}", response_model=CategoryRead)
def update_category_endpoint(
    category_id: str,
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
):
    category = update_category(db, category_id, category_in)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.delete("/{category_id}", response_model=CategoryRead)
def delete_category_endpoint(
    category_id: str,
    db: Session = Depends(get_db),
):
    category = delete_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.get("/", response_model=list[CategoryRead])
def list_categories_endpoint(db: Session = Depends(get_db)):
    return list_categories(db)
