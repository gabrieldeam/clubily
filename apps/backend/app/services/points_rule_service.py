# backend/app/services/points_rule_service.py

from sqlalchemy.orm import Session
from math import floor
from datetime import datetime
from decimal import Decimal

from app.models.points_rule import PointsRule, RuleType
from app.models.user_points_wallet import UserPointsWallet
from app.models.user_points_transaction import UserPointsTransaction, UserPointsTxType

from app.services.points_wallet_service import debit_points
from app.services.wallet_service import get_wallet_balance, debit_wallet
from app.services.fee_setting_service import get_effective_fee
from app.models.fee_setting import SettingTypeEnum


# ─── CRUD de regras ───────────────────────────────────────────────────────────

def get_company_rules(db: Session, company_id: str):
    return db.query(PointsRule).filter_by(company_id=company_id).all()

def get_visible_rules(db: Session, company_id: str):
    return db.query(PointsRule).filter_by(
        company_id=company_id,
        active=True,
        visible=True
    ).all()

def get_rule(db: Session, rule_id: str) -> PointsRule | None:
    return db.get(PointsRule, rule_id)


def create_rule(db: Session, company_id: str, rule_in):
    rule = PointsRule(company_id=company_id, **rule_in.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

def update_rule(db: Session, rule_id: str, rule_in):
    rule = get_rule(db, rule_id)
    for field, value in rule_in.dict().items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule

def delete_rule(db: Session, rule_id: str):
    rule = get_rule(db, rule_id)
    db.delete(rule)
    db.commit()


# ─── Carteira de pontos do usuário ────────────────────────────────────────────

def get_or_create_user_points_wallet(db: Session, user_id: str, company_id: str):
    w = db.query(UserPointsWallet).filter_by(
        user_id=user_id,
        company_id=company_id
    ).first()
    if not w:
        w = UserPointsWallet(
            user_id=user_id,
            company_id=company_id,
            balance=0
        )
        db.add(w)
        db.commit()
        db.refresh(w)
    return w

def credit_user_points(
    db: Session,
    user_id: str,
    company_id: str,
    rule_id: str,
    points: int,
    description: str | None
):
    w = get_or_create_user_points_wallet(db, user_id, company_id)
    w.balance += points
    tx = UserPointsTransaction(
        wallet_id=w.id,
        user_id=user_id,
        company_id=company_id,
        rule_id=rule_id,
        type=UserPointsTxType.award,
        amount=points,
        description=description
    )
    db.add(tx)
    db.commit()
    db.refresh(w)
    return w

def list_user_points_transactions(
    db: Session,
    user_id: str,
    company_id: str,
    skip: int,
    limit: int
):
    base_q = db.query(UserPointsTransaction).filter_by(
        user_id=user_id,
        company_id=company_id
    )
    total = base_q.count()
    items = (
        base_q
        .order_by(UserPointsTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return total, items


# ─── Avaliação e atribuição de pontos ─────────────────────────────────────────

def evaluate_and_award(
    db: Session,
    user_id: str,
    company_id: str,
    rule_id: str,
    payload: dict
) -> int:
    # 1) Busca e valida a regra
    rule = get_rule(db, rule_id)
    if not rule or not rule.active:
        return 0

    # 2) Extrai configuração e payload
    cfg = rule.config
    base_points = 0

    # Se o payload trouxe 'date' como string, converte para datetime
    date_val = payload.get("date")
    if isinstance(date_val, str):
        try:
            date_val = datetime.fromisoformat(date_val)
        except ValueError:
            date_val = None

    # 3) Lógica por tipo de regra
    if rule.rule_type == RuleType.value_spent:
        amount = Decimal(str(payload.get("amount_spent", 0)))
        step = Decimal(str(cfg.get("step", 1)))
        pts_per_step = int(cfg.get("points", 0))
        base_points = floor(amount / step) * pts_per_step

    elif rule.rule_type == RuleType.event:
        if payload.get("event") == cfg.get("event_name"):
            base_points = int(cfg.get("points", 0))

    elif rule.rule_type == RuleType.frequency:
        if payload.get("count", 0) >= int(cfg.get("threshold", 0)):
            base_points = int(cfg.get("bonus_points", 0))

    elif rule.rule_type == RuleType.category:
        cats = payload.get("product_categories", [])
        if any(c in cfg.get("categories", []) for c in cats):
            multiplier = float(cfg.get("multiplier", 1))
            raw = int(payload.get("base_points", 0)) * multiplier
            base_points = int(floor(raw))

    elif rule.rule_type == RuleType.first_purchase:
        if payload.get("is_first", False):
            base_points = int(cfg.get("bonus_points", 0))

    elif rule.rule_type == RuleType.recurrence:
        if payload.get("streak", 0) >= int(cfg.get("consecutive_periods", 0)):
            base_points = int(cfg.get("bonus_points", 0))

    elif rule.rule_type == RuleType.digital_behavior:
        base_points = int(cfg.get("events", {}).get(payload.get("event"), 0))

    elif rule.rule_type == RuleType.special_date:
        if date_val:
            if cfg.get("start") and cfg.get("end"):
                start = datetime.fromisoformat(cfg["start"])
                end = datetime.fromisoformat(cfg["end"])
                if start <= date_val <= end:
                    multiplier = float(cfg.get("multiplier", 1))
                    raw = int(payload.get("base_points", 0)) * multiplier
                    base_points = int(floor(raw))
            else:
                # data exata MM-DD
                if date_val.strftime("%m-%d") == cfg.get("date"):
                    multiplier = float(cfg.get("multiplier", 1))
                    raw = int(payload.get("base_points", 0)) * multiplier
                    base_points = int(floor(raw))

    elif rule.rule_type == RuleType.geolocation:
        if payload.get("branch_id") == cfg.get("branch_id"):
            base_points = int(cfg.get("points", 0))

    elif rule.rule_type == RuleType.inventory:
        items = payload.get("purchased_items", [])
        if any(i in cfg.get("item_ids", []) for i in items):
            multiplier = float(cfg.get("multiplier", 1))
            raw = int(payload.get("base_points", 0)) * multiplier
            base_points = int(floor(raw))

    # 4) Se não gerou pontos, encerra sem ação
    if base_points <= 0:
        return 0

    # 5) Cobra a taxa em créditos para vincular o ponto (ex.: R$0,10)
    fee = get_effective_fee(db, company_id, SettingTypeEnum.points)
    balance = get_wallet_balance(db, company_id)
    if balance < fee:
        # sem saldo para taxa: desativa regras e encerra
        db.query(PointsRule).filter_by(company_id=company_id).update({"active": False})
        db.commit()
        return 0

    debit_wallet(
        db,
        company_id,
        fee,
        description=f"Taxa de pontos (Regra: {rule.name})"
    )

    # 6) Tenta debitar os pontos da reserva da empresa
    try:
        debit_points(
            db,
            company_id,
            base_points,
            description=f"Regra: {rule.name}"
        )
    except Exception:
        # falha no débito de pontos: desativa regras e encerra
        db.query(PointsRule).filter_by(company_id=company_id).update({"active": False})
        db.commit()
        return 0

    # 7) Credita os pontos na carteira do usuário
    credit_user_points(
        db,
        user_id,
        company_id,
        rule_id,
        base_points,
        description=rule.name
    )

    return base_points
