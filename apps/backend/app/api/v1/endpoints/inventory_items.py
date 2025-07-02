### backend/app/api/v1/endpoints/inventory_items.py ###
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.api.deps import get_db, get_current_company
from app.schemas.inventory_item import InventoryItemCreate, InventoryItemRead
from app.models.inventory_item import InventoryItem
from app.models.product_category import ProductCategory

router = APIRouter(tags=["inventory"])

@router.get("/", response_model=list[InventoryItemRead])
def list_items(db: Session = Depends(get_db), current_company=Depends(get_current_company)):
    return db.query(InventoryItem).filter_by(company_id=current_company.id).all()

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