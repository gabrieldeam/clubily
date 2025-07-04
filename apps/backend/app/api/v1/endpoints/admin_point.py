# backend/app/api/v1/endpoints/points.py  – adicione depois dos imports
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from uuid import UUID
from app.api.deps import get_db, require_admin

from app.schemas.points_rule_admin import PaginatedRules
from app.services.points_admin_service import (
    list_all_rules,
    list_rule_transactions,
)
from app.schemas.user_points import (
    PaginatedUserPointsTransactions
)

router = APIRouter(tags=["admin_points"])

# ---------------------------------------------------------------------------
@router.get(
    "/admin/rules",
    response_model=PaginatedRules,
    summary="Admin: Lista global de regras de pontos (paginado)",
    dependencies=[Depends(require_admin)]
)
def admin_list_rules(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, gt=0, le=100),
    db: Session = Depends(get_db),
):
    total, items = list_all_rules(db, skip, limit)
    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.get(
    "/admin/rules/{rule_id}/transactions",
    response_model=PaginatedUserPointsTransactions,
    summary="Admin: Transações vinculadas a uma regra específica (paginado)",
    dependencies=[Depends(require_admin)]
)
def admin_rule_transactions(
    rule_id: UUID = Path(..., description="ID da regra"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, gt=0, le=100),
    db: Session = Depends(get_db),
):
    total, txs = list_rule_transactions(db, str(rule_id), skip, limit)
    # reaproveita serializer existente
    items = [
        {
            "id":           t.id,
            "type":         t.type,
            "amount":       t.amount,
            "description":  t.description,
            "rule_id":      t.rule_id,
            "company_id":   t.company_id,
            "company_name": t.company.name,
            "created_at":   t.created_at,
        }
        for t in txs
    ]
    return {"total": total, "skip": skip, "limit": limit, "items": items}
