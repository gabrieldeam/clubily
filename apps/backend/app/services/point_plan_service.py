# app/services/point_plan_service.py
from sqlalchemy.orm import Session
from app.models.point_plan import PointPlan

def create_plan(db: Session, obj: PointPlan) -> PointPlan:
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

def list_plans(db: Session, skip: int, limit: int):
    q = db.query(PointPlan)
    total = q.count()
    items = q.order_by(PointPlan.created_at.desc()).offset(skip).limit(limit).all()
    return total, items

def get_plan(db: Session, plan_id: str) -> PointPlan | None:
    return db.get(PointPlan, plan_id)

def update_plan(db: Session, plan: PointPlan, data: dict) -> PointPlan:
    for k,v in data.items(): setattr(plan, k, v)
    db.commit(); db.refresh(plan)
    return plan

def delete_plan(db: Session, plan: PointPlan):
    db.delete(plan); db.commit()
