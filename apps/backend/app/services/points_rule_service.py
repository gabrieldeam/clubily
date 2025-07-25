# backend/app/services/points_rule_service.py

from sqlalchemy.orm import Session
from math import floor
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Dict, Any, List, Tuple
from app.models.points_rule import PointsRule, RuleType
from app.models.user_points_wallet import UserPointsWallet
from app.models.user_points_transaction import UserPointsTransaction, UserPointsTxType

from app.services.points_wallet_service import debit_points
from app.services.wallet_service import get_wallet_balance, debit_wallet
from app.services.fee_setting_service import get_effective_fee
from app.models.fee_setting import SettingTypeEnum
from datetime import timedelta
from app.models.company import Company
from app.services.purchase_log_service import count_purchases
from app.models.purchase_log import PurchaseLog



GENERATIVE = {
    RuleType.value_spent,
    RuleType.event,
    RuleType.frequency,
    RuleType.recurrence,
    RuleType.first_purchase,
    RuleType.digital_behavior,
    RuleType.geolocation,
}
MULTIPLIER = {
    RuleType.category,
    RuleType.special_date,
    RuleType.inventory,
}

def cooldown_ok(db: Session, user_id: str, rule: PointsRule) -> bool:
    cooldown = int(rule.config.get("cooldown_days", 0))
    if cooldown == 0:
        return True

    last_tx = (
        db.query(UserPointsTransaction)
          .filter_by(user_id=user_id, rule_id=str(rule.id))
          .order_by(UserPointsTransaction.created_at.desc())
          .first()
    )
    if not last_tx:
        return True

    # agora usamos datetime.now(timezone.utc)  ➜ ambas aware
    return (
        datetime.now(timezone.utc) - last_tx.created_at
        >= timedelta(days=cooldown)
    )

# ─── CRUD de regras ───────────────────────────────────────────────────────────

def get_company_rules(db: Session, company_id: str):
    return db.query(PointsRule).filter_by(company_id=company_id).all()

def get_visible_rules(db: Session, company_id: str):
    return db.query(PointsRule).filter_by(
        company_id=company_id,
        active=True,
        visible=True
    ).all()

def get_active_rules(db: Session, company_id: str) -> list[PointsRule]:
    """
    Retorna todas as regras da empresa que estão apenas com active=True,
    independente do flag `visible`.
    """
    return (
        db.query(PointsRule)
          .filter_by(company_id=company_id, active=True)
          .all()
    )


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

def get_or_create_user_points_wallet(
    db: Session,
    user_id: str
) -> UserPointsWallet:
    """
    Retorna a carteira global de pontos do usuário ou cria uma nova com balance=0.
    """
    w = db.query(UserPointsWallet).filter_by(user_id=user_id).first()
    if not w:
        w = UserPointsWallet(
            user_id=user_id,
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
    w = get_or_create_user_points_wallet(db, user_id)
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
    skip: int,
    limit: int
) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Retorna total e lista paginada das transações.
    Inclui company_name em cada item.
    """
    base_q = (
        db.query(UserPointsTransaction)
          .join(Company, Company.id == UserPointsTransaction.company_id)
          .filter(UserPointsTransaction.user_id == user_id)
    )

    total = base_q.count()
    txs = (
        base_q
        .order_by(UserPointsTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    items: List[Dict[str, Any]] = []
    for t in txs:
        items.append(
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
        )
    return total, items



# ─── Avaliação e atribuição de pontos ─────────────────────────────────────────

def evaluate_all_rules(
    db: Session,
    user_id: str,
    company_id: str,
    payload: Dict[str, Any]
) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Avalia TODAS as regras ativas em DUAS PASSAGENS:
    1) só geradoras → acumula base_points
    2) só multiplicadoras (recebem base_points no payload)

    Retorna (total_awarded, breakdown), onde breakdown é lista de
    {'rule_id': str, 'points': int}.
    """

    rules = get_active_rules(db, company_id)

    total_awarded = 0
    breakdown: List[Dict[str, Any]] = []
    base_points = 0

    # Helper para avaliar uma única regra (já debita taxa/pontos e credita usuário)
    def _eval_single(rule: PointsRule, pl: Dict[str, Any]) -> int:
        # copia da sua evaluate_and_award original, mas sem buscar regras nem verificar active
        # --- Início de lógica de avaliação individual ---
        cfg = rule.config
        pts = 0
        # converter date se necessário
        date_val = pl.get("date")
        if isinstance(date_val, str):
            try:
                date_val = datetime.fromisoformat(date_val)
            except ValueError:
                date_val = None

        # cada case igual ao que você já tem...
        if rule.rule_type == RuleType.value_spent:
            amount = Decimal(str(pl.get("amount_spent", 0)))
            step = Decimal(str(cfg.get("step", 1)))
            pts_per = int(cfg.get("points", 0))
            pts = floor(amount / step) * pts_per

        elif rule.rule_type == RuleType.event:
            if pl.get("event") == cfg.get("event_name"):
                pts = int(cfg.get("points", 0))

        elif rule.rule_type == RuleType.frequency:
            window = int(cfg.get("window_days", 0))
            threshold = int(cfg.get("threshold", 0))
            purchases = count_purchases(db, user_id, company_id, window)
            if purchases >= threshold and cooldown_ok(db, user_id, rule):
                pts = int(cfg.get("bonus_points", 0))

        elif rule.rule_type == RuleType.recurrence:
        # parâmetros da regra
            period_days         = int(cfg.get("period_days", 7))
            threshold_per       = int(cfg.get("threshold_per_period", 1))
            consecutive_periods = int(cfg.get("consecutive_periods", 1))
            bonus               = int(cfg.get("bonus_points", 0))

            streak = 0
            now = datetime.utcnow()

            # para cada período consecutivo i:
            # definimos janela [now - (i+1)*period_days, now - i*period_days)
            for i in range(consecutive_periods):
                window_end   = now - timedelta(days=period_days * i)
                window_start = window_end - timedelta(days=period_days)

                count = (
                    db.query(PurchaseLog)
                    .filter(
                        PurchaseLog.user_id   == user_id,
                        PurchaseLog.company_id== company_id,
                        PurchaseLog.created_at >= window_start,
                        PurchaseLog.created_at <  window_end
                    )
                    .count()
                )
                if count >= threshold_per:
                    streak += 1

            if streak >= consecutive_periods and cooldown_ok(db, user_id, rule):
                pts = bonus


        elif rule.rule_type == RuleType.category:
            # só aplica multiplicador se a categoria do payload estiver na lista
            payload_cats = pl.get("product_categories", [])
            rule_cats    = cfg.get("categories", [])
            # se **qualquer** categoria comprada bater na regra
            if any(cat in rule_cats for cat in payload_cats):
                mult = float(cfg.get("multiplier", 1))
                pts  = floor(pl.get("base_points", 0) * mult)


        elif rule.rule_type == RuleType.inventory:
            # só aplica multiplicador se o item estiver na lista
            item_ids = cfg.get("item_ids", [])
            if pl.get("item_id") in item_ids:
                mult = float(cfg.get("multiplier", 1))
                pts = floor(pl.get("base_points", 0) * mult)

        elif rule.rule_type == RuleType.first_purchase:
            bonus = int(cfg.get("bonus_points", 0))
            if "is_first" in pl:
                if pl["is_first"]:
                    pts = bonus
            else:
                total = db.query(PurchaseLog).filter_by(
                    user_id=user_id, company_id=company_id
                ).count()
                if total == 1:
                    pts = bonus
        
        elif rule.rule_type == RuleType.special_date:
            today = date_val.date() if date_val else datetime.utcnow().date()

            cfg_date = cfg.get("date")
            cfg_start = cfg.get("start")
            cfg_end   = cfg.get("end")
            multiplier = float(cfg.get("multiplier", 1))

            in_fixed_day = False
            in_range     = False

            if cfg_date and today.strftime("%m-%d") == cfg_date:
                in_fixed_day = True

            if cfg_start and cfg_end:
                start = datetime.fromisoformat(cfg_start).date()
                end   = datetime.fromisoformat(cfg_end).date()
                if start <= today <= end:
                    in_range = True

            if in_range or in_fixed_day:
                pts = floor(pl.get("base_points", 0) * multiplier)


        elif rule.rule_type == RuleType.geolocation:
            if pl.get("branch_id") == cfg.get("branch_id"):
                pts = int(cfg.get("points", 0))

        # regra não atendida
        if pts <= 0:
            return 0

        # 5) cobra taxa
        fee = get_effective_fee(db, company_id, SettingTypeEnum.points)
        bal = get_wallet_balance(db, company_id)
        if bal < fee:
            # desativa tudo
            db.query(PointsRule).filter_by(company_id=company_id).update({"active": False})
            db.commit()
            return 0

        debit_wallet(db, company_id, fee, description=f"Taxa pontos ({rule.name})")

        # 6) debita reserva de pontos
        try:
            debit_points(db, company_id, pts, description=f"Regra points: {rule.name}")
        except:
            db.query(PointsRule).filter_by(company_id=company_id).update({"active": False})
            db.commit()
            return 0

        # 7) credita usuário
        credit_user_points(db, user_id, company_id, str(rule.id), pts, description=rule.name)

        return pts
        # --- Fim de lógica individual ---

    # === Primeira passada: regras geradoras ===
    for r in rules:
        if r.rule_type in GENERATIVE:
            pts = _eval_single(r, payload)
            if pts:
                total_awarded += pts
                breakdown.append({"rule_id": str(r.id), "points": pts})
                base_points += pts

    # === Segunda passada: multiplicadores recebem base_points ===
    # só pros rules de multiplier
    payload_with_base = payload.copy()
    payload_with_base["base_points"] = base_points
    for r in rules:
        if r.rule_type in MULTIPLIER:
            pts = _eval_single(r, payload_with_base)
            if pts:
                total_awarded += pts
                breakdown.append({"rule_id": str(r.id), "points": pts})

    return total_awarded, breakdown


def check_rule_eligibility(
    db: Session,
    user_id: str,
    rule: PointsRule
) -> dict:
    """
    Retorna um dict com:
      - already_awarded: se já recebeu pontos desta regra (apenas frequency/recurrence),
      - message: texto explicando onde o usuário está no progresso.
    """

    cfg   = rule.config
    now   = datetime.utcnow()
    rid   = str(rule.id)

    # ─── First Purchase ───────────────────────────────────
    if rule.rule_type == RuleType.first_purchase:
        # conta total de compras do usuário nessa empresa
        total = (
            db.query(PurchaseLog)
              .filter_by(user_id=user_id, company_id=rule.company_id)
              .count()
        )
        if total == 0:
            return {
                "already_awarded": False,
                "message": "Você ainda não fez nenhuma compra. Na sua primeira compra, ganha "
                           f"{cfg.get('bonus_points', 0)} pontos!"
            }
        else:
            # verifica se já recebeu esse bônus
            already = (
                db.query(UserPointsTransaction)
                  .filter_by(
                      user_id=user_id,
                      rule_id=rid,
                      type=UserPointsTxType.award
                  )
                  .first()
            )
            if already:
                return {
                    "already_awarded": True,
                    "message": (
                        f"Você já recebeu {already.amount} pontos de primeira compra "
                        f"em {already.created_at.date()}."
                    )
                }
            else:
                return {
                    "already_awarded": False,
                    "message": (
                        "Parabéns! Você já fez sua primeira compra e pode receber "
                        f"{cfg.get('bonus_points', 0)} pontos."
                    )
                }

    # ─── Frequency ────────────────────────────────────────
    if rule.rule_type == RuleType.frequency:
        window    = int(cfg.get("window_days", 0))
        threshold = int(cfg.get("threshold", 0))
        start     = now - timedelta(days=window)

        # quantas compras no período
        count = (
            db.query(PurchaseLog)
              .filter(
                  PurchaseLog.user_id    == user_id,
                  PurchaseLog.company_id == rule.company_id,
                  PurchaseLog.created_at >= start
              )
              .count()
        )

        if count == 0:
            return {
                "already_awarded": False,
                "message": (
                    f"Você ainda não fez nenhuma compra nos últimos {window} dias."
                )
            }

        # já foi premiado?
        already = (
            db.query(UserPointsTransaction)
              .filter(
                  UserPointsTransaction.user_id    == user_id,
                  UserPointsTransaction.rule_id    == rid,
                  UserPointsTransaction.type       == UserPointsTxType.award,
                  UserPointsTransaction.created_at >= start
              )
              .first()
        )
        if already:
            return {
                "already_awarded": True,
                "message": (
                    f"Você já recebeu {already.amount} pontos por atingir a meta "
                    f"de {threshold} compras em {window} dias "
                    f"({already.created_at.date()})."
                )
            }

        # chegou na meta?
        if count >= threshold:
            return {
                "already_awarded": False,
                "message": (
                    f"Você fez {count} compras nos últimos {window} dias — "
                    f"atingiu a meta de {threshold} e agora pode receber "
                    f"{cfg.get('bonus_points', 0)} pontos!"
                )
            }

        # quantas faltam?
        remaining = threshold - count
        return {
            "already_awarded": False,
            "message": (
                f"Você fez {count} compras nos últimos {window} dias. "
                f"Faltam {remaining} para atingir a meta de {threshold} e "
                f"receber {cfg.get('bonus_points', 0)} pontos."
            )
        }

    # ─── Recurrence ───────────────────────────────────────
    if rule.rule_type == RuleType.recurrence:
        period_days         = int(cfg.get("period_days", 7))
        threshold_per       = int(cfg.get("threshold_per_period", 1))
        consecutive_periods = int(cfg.get("consecutive_periods", 1))
        bonus               = int(cfg.get("bonus_points", 0))

        streak = 0
        # para cada período consecutivo
        for i in range(consecutive_periods):
            window_end   = now - timedelta(days=period_days * i)
            window_start = window_end - timedelta(days=period_days)

            count = (
                db.query(PurchaseLog)
                  .filter(
                      PurchaseLog.user_id    == user_id,
                      PurchaseLog.company_id == rule.company_id,
                      PurchaseLog.created_at >= window_start,
                      PurchaseLog.created_at <  window_end
                  )
                  .count()
            )
            if count >= threshold_per:
                streak += 1

        # já recebeu?
        already = (
            db.query(UserPointsTransaction)
              .filter(
                  UserPointsTransaction.user_id    == user_id,
                  UserPointsTransaction.rule_id    == rid,
                  UserPointsTransaction.type       == UserPointsTxType.award
              )
              .first()
        )
        if already:
            return {
                "already_awarded": True,
                "message": (
                    f"Você já recebeu {already.amount} pontos de recorrência "
                    f"({already.created_at.date()})."
                )
            }

        if streak >= consecutive_periods:
            return {
                "already_awarded": False,
                "message": (
                    f"Você completou {streak} períodos de {period_days} dias "
                    f"com ≥{threshold_per} compras cada — agora pode receber "
                    f"{bonus} pontos!"
                )
            }

        periods_left = consecutive_periods - streak
        return {
            "already_awarded": False,
            "message": (
                f"Você completou {streak}/{consecutive_periods} períodos de "
                f"{period_days} dias. Faltam {periods_left} para ganhar {bonus} pontos."
            )
        }

    # ─── Outros tipos não contemplados aqui ───────────────
    return {
        "already_awarded": False,
        "message": "Esta regra não depende de histórico de compras."
    }