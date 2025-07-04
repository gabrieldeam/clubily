# backend/app/services/points_admin_service.py
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Tuple
from app.models.points_rule import PointsRule
from app.models.company import Company
from app.models.user_points_transaction import UserPointsTransaction

# --- lista paginada de regras ---
def list_all_rules(
    db: Session,
    skip: int,
    limit: int
) -> Tuple[int, List[Dict[str, Any]]]:
    base_q = (
        db.query(PointsRule, Company.name.label("company_name"))
          .join(Company, Company.id == PointsRule.company_id)
    )
    total = base_q.count()
    rows  = (
        base_q
        .order_by(PointsRule.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    items = [
        {
            "id":           r.PointsRule.id,
            "company_id":   r.PointsRule.company_id,
            "company_name": r.company_name,
            "name":         r.PointsRule.name,
            "description":  r.PointsRule.description,
            "rule_type":    r.PointsRule.rule_type,
            "active":       r.PointsRule.active,
            "visible":      r.PointsRule.visible,
            "created_at":   r.PointsRule.created_at,
            "updated_at":   r.PointsRule.updated_at,
        }
        for r in rows
    ]
    return total, items


# --- lista paginada de transações por rule_id ---
def list_rule_transactions(
    db: Session,
    rule_id: str,
    skip: int,
    limit: int
):
    base_q = db.query(UserPointsTransaction).filter_by(rule_id=rule_id)
    total  = base_q.count()
    txs    = (
        base_q
        .order_by(UserPointsTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return total, txs
