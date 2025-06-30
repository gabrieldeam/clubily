# backend/app/api/v1/endpoints/point_plans.py

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.point_plan_service import (
    list_plans, get_plan,
)
from app.schemas.point_plan import (
    PointPlanRead, PaginatedPointPlans
)

router = APIRouter(tags=["point_plans"])


@router.get("/", response_model=PaginatedPointPlans)
def list_public_plans(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total, items = list_plans(db, skip, limit)
    return PaginatedPointPlans(total=total, skip=skip, limit=limit, items=items)


@router.get("/{plan_id}", response_model=PointPlanRead)
def get_public_plan(plan_id: UUID, db: Session = Depends(get_db)):
    p = get_plan(db, str(plan_id))
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plano não encontrado")
    return p
