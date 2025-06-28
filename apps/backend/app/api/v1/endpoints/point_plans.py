# app/api/v1/endpoints/point_plans.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.point_plan_service import list_plans, get_plan
from app.schemas.point_plan import (
    PointPlanCreate, PointPlanRead,
    PointPlanUpdate, PaginatedPointPlans
)
from app.services.point_plan_service import (
    create_plan, list_plans, get_plan,
    update_plan, delete_plan
)

from app.models.point_plan import PointPlan

router = APIRouter(prefix="/point-plans", tags=["point_plans"])

@router.get("/", response_model=PaginatedPointPlans)
def list_public_plans(
    skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    total, items = list_plans(db, skip, limit)
    return PaginatedPointPlans(total=total, skip=skip, limit=limit, items=items)

@router.get("/{plan_id}", response_model=PointPlanRead)
def get_public_plan(plan_id: str, db: Session = Depends(get_db)):
    p = get_plan(db, plan_id)
    return p

@router.post("/admin", response_model=PointPlanRead, status_code=status.HTTP_201_CREATED)
def create_point_plan(payload: PointPlanCreate, db: Session = Depends(get_db)):
    return create_plan(db, PointPlan(**payload.model_dump()))

@router.get("/admin", response_model=PaginatedPointPlans)
def read_point_plans(
    skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    total, items = list_plans(db, skip, limit)
    return PaginatedPointPlans(total=total, skip=skip, limit=limit, items=items)

@router.get("/admin/{plan_id}", response_model=PointPlanRead)
def read_point_plan(plan_id: str, db: Session = Depends(get_db)):
    p = get_plan(db, plan_id)
    if not p: raise HTTPException(status.HTTP_404_NOT_FOUND, "Plano não encontrado")
    return p

@router.patch("/admin/{plan_id}", response_model=PointPlanRead)
def patch_point_plan(plan_id: str, payload: PointPlanUpdate, db: Session = Depends(get_db)):
    p = get_plan(db, plan_id)
    if not p: raise HTTPException(status.HTTP_404_NOT_FOUND, "Plano não encontrado")
    return update_plan(db, p, payload.model_dump(exclude_unset=True))

@router.delete("/admin/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_point_plan(plan_id: str, db: Session = Depends(get_db)):
    p = get_plan(db, plan_id)
    if not p: raise HTTPException(status.HTTP_404_NOT_FOUND, "Plano não encontrado")
    delete_plan(db, p)
