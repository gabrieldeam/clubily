# app/api/v1/endpoints/point_purchases.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_company
from app.services.point_purchase_service import (
    create_point_purchase, list_point_purchases, list_all_point_purchases, get_point_purchase
)
from app.schemas.point_purchase import (
    PointPurchaseCreate, PointPurchaseRead, PaginatedPointPurchases
)

router = APIRouter(tags=["point_purchases"])

@router.post("/", response_model=PointPurchaseRead, status_code=status.HTTP_201_CREATED)
def purchase_points(
    payload: PointPurchaseCreate,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company)
):
    try:
        return create_point_purchase(db, str(current_company.id), str(payload.plan_id))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=PaginatedPointPurchases)
def history_points(
    skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company)
):
    total, items = list_point_purchases(db, str(current_company.id), skip, limit)
    return PaginatedPointPurchases(total=total, skip=skip, limit=limit, items=items)


@router.get("/admin", response_model=PaginatedPointPurchases)
def read_all_point_purchases(
    skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    total, items = list_all_point_purchases(db, skip, limit)
    return PaginatedPointPurchases(total=total, skip=skip, limit=limit, items=items)


@router.get("/{purchase_id}", response_model=PointPurchaseRead)
def read_point_purchase(
    purchase_id: str,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company)
):
    """
    Retorna os detalhes de uma compra de pontos pelo seu ID,
    garantindo que seja da empresa autenticada.
    """
    p = get_point_purchase(db, str(current_company.id), purchase_id)
    if not p:
        raise HTTPException(status_code=404, detail="Compra de pontos não encontrada")
    return p