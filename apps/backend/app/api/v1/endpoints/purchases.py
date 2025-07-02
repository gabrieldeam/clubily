### backend/app/api/v1/endpoints/purchases.py ###
from fastapi import APIRouter, Depends, status
from decimal import Decimal
from pydantic import BaseModel
from app.api.deps import get_db, get_current_company
from sqlalchemy.orm import Session
from uuid import UUID
from app.services.purchase_log_service import log_purchase
from app.services.points_rule_service import evaluate_and_award, get_visible_rules

class PurchasePayload(BaseModel):
    user_id: UUID
    amount: Decimal
    product_categories: list[str] = []
    purchased_items: list[str] = []
    branch_id: str | None = None
    event: str | None = None

router = APIRouter(tags=["purchases"])

@router.post("/evaluate", status_code=status.HTTP_201_CREATED)
def create_purchase(payload: PurchasePayload, db: Session = Depends(get_db), current_company=Depends(get_current_company)):
    # 1. grava compra
    log_purchase(db, str(payload.user_id), str(current_company.id), payload.amount)

    # 2. carrega regras ativas
    rules = get_visible_rules(db, str(current_company.id))

    total_awarded = 0
    breakdown = []
    for rule in rules:
        points = evaluate_and_award(db, str(payload.user_id), str(current_company.id), str(rule.id), payload.dict())
        if points:
            total_awarded += points
            breakdown.append({"rule_id": str(rule.id), "points": points})
    return {"total_awarded": total_awarded, "breakdown": breakdown}