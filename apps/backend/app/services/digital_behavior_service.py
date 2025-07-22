# backend/app/services/digital_behavior_service.py

from sqlalchemy.orm import Session
from datetime import datetime, timezone
from decimal import Decimal
from typing import List
from sqlalchemy.orm import joinedload
from app.models.points_rule import PointsRule, RuleType
from app.models.user_points_transaction import UserPointsTransaction, UserPointsTxType

from app.services.points_wallet_service import debit_points
from app.services.points_rule_service import credit_user_points

from app.services.wallet_service import get_wallet_balance, debit_wallet
from app.services.fee_setting_service import get_effective_fee
from app.models.fee_setting import SettingTypeEnum
from app.services.purchase_log_service import log_purchase

def is_slug_unique(
    db: Session,
    slug: str,
    company_id: str
) -> bool:
    existing = (
        db.query(PointsRule)
          .filter(
              PointsRule.company_id == company_id,
              PointsRule.rule_type == RuleType.digital_behavior,
              PointsRule.config["slug"].astext == slug
          )
          .first()
    )
    return existing is None

def get_digital_rule_by_slug(db: Session, slug: str) -> PointsRule | None:
    return (
        db.query(PointsRule)
            .options(joinedload(PointsRule.company))
            .filter(
                PointsRule.rule_type == RuleType.digital_behavior,
                PointsRule.config["slug"].astext == slug
            )
            .first()
    )

def process_digital_behavior_event(
    db: Session,
    user_id: str,
    slug: str,
    amount: Decimal,
    purchased_items: List[str]
) -> int:
    rule = get_digital_rule_by_slug(db, slug)
    if not rule or not rule.active:
        raise ValueError("Regra digital não encontrada ou inativa")

    cfg = rule.config
    now = datetime.now(timezone.utc)

    # valida período (corrigido)
    if cfg.get("valid_from"):
        start = datetime.fromisoformat(cfg["valid_from"])
        # se for naive, assume UTC
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if now < start:
            raise ValueError("Regra ainda não iniciou")

    if cfg.get("valid_to"):
        end = datetime.fromisoformat(cfg["valid_to"])
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        if now > end:
            raise ValueError("Regra expirada")

    # limite por usuário
    max_attr = int(cfg.get("max_attributions", 0))
    if max_attr > 0:
        used = (
            db.query(UserPointsTransaction)
              .filter_by(
                  user_id=user_id,
                  rule_id=str(rule.id),
                  type=UserPointsTxType.award
              )
              .count()
        )
        if used >= max_attr:
            raise ValueError("Limite de usos atingido para este usuário")

    # 2) log de evento
    log_purchase(
        db,
        user_id,
        str(rule.company_id),
        amount,
        purchased_items
    )

    # 3) cobra taxa
    fee = get_effective_fee(db, str(rule.company_id), SettingTypeEnum.points)
    bal = get_wallet_balance(db, str(rule.company_id))
    if bal < fee:
        rule.active = False
        db.commit()
        raise ValueError("Saldo da empresa insuficiente para taxa de pontos")

    debit_wallet(
        db,
        str(rule.company_id),
        fee,
        description=f"Taxa pontos (digital: {cfg.get('name')})"
    )

    # 4) debita reserva
    pts_to_award = int(cfg.get("points", 0))
    try:
        debit_points(
            db,
            str(rule.company_id),
            pts_to_award,
            description=f"Reserva pontos digital: {cfg.get('name')}"
        )
    except Exception:
        rule.active = False
        db.commit()
        raise ValueError("Falha ao reservar pontos; regra desativada")

    # 5) credita usuário
    credit_user_points(
        db,
        user_id,
        str(rule.company_id),
        str(rule.id),
        pts_to_award,
        description=cfg.get("description")
    )

    return pts_to_award
