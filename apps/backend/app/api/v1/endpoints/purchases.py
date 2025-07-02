### backend/app/api/v1/endpoints/purchases.py ###
from fastapi import APIRouter, Depends, status
from decimal import Decimal
from pydantic import BaseModel
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_company
from app.services.purchase_log_service import log_purchase
from app.services.points_rule_service import evaluate_all_rules

router = APIRouter(prefix="/purchases", tags=["purchases"])

class PurchasePayload(BaseModel):
    user_id: UUID
    amount: Decimal
    product_categories: List[str] = []
    purchased_items: List[str] = []
    branch_id: str | None = None
    event: str | None = None

@router.post("/evaluate", status_code=status.HTTP_201_CREATED)
async def create_purchase(
    payload: PurchasePayload,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company)
):
    """
    Cria um registro de compra e avalia todas as regras de pontos
    em duas passagens (geradoras e multiplicadoras).
    Retorna total_awarded e breakdown por regra.
    """
    # 1) grava compra
    log_purchase(db, str(payload.user_id), str(current_company.id), payload.amount)

    # 2) avalia todas as regras em duas fases
    total_awarded, breakdown = evaluate_all_rules(
        db,
        str(payload.user_id),
        str(current_company.id),
        payload.dict()
    )

    return {"total_awarded": total_awarded, "breakdown": breakdown}
