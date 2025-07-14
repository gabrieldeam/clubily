# app/services/loyalty_metrics_service.py
from datetime import date, datetime, time, timedelta
from uuid import UUID

from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session

from app.models.loyalty_card import (
    LoyaltyCardTemplate,
    LoyaltyCardInstance,
    LoyaltyCardStamp,
)
from app.models.reward import RewardRedemptionCode, TemplateRewardLink


# ───────────────────────── helpers ─────────────────────────────
def _to_datetime_range(date_from: date | None, date_to: date | None):
    """Converte date → datetime (00 h a 23:59)."""
    if date_from and date_to and date_from > date_to:
        date_from, date_to = date_to, date_from
    start = datetime.combine(date_from, time.min) if date_from else None
    end   = datetime.combine(date_to,   time.max) if date_to   else None
    return start, end


# ───────────────────────── resumo numérico ─────────────────────
def summary_for_company(
    db: Session,
    company_id: str,
    tpl_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict:
    start_dt, end_dt = _to_datetime_range(date_from, date_to)

    # cartões emitidos ----------------------------------------------------
    base_q = (
        db.query(LoyaltyCardInstance)
        .join(
            LoyaltyCardTemplate,
            LoyaltyCardTemplate.id == LoyaltyCardInstance.template_id,
        )
        .filter(LoyaltyCardTemplate.company_id == company_id)
    )
    if tpl_id:
        base_q = base_q.filter(LoyaltyCardInstance.template_id == tpl_id)
    if start_dt:
        base_q = base_q.filter(LoyaltyCardInstance.issued_at >= start_dt)
    if end_dt:
        base_q = base_q.filter(LoyaltyCardInstance.issued_at <= end_dt)

    total_cards  = base_q.count()
    unique_users = base_q.distinct(LoyaltyCardInstance.user_id).count()

    # carimbos ------------------------------------------------------------
    stamps_q = (
        db.query(func.count())                        # COUNT(*)
        .select_from(LoyaltyCardStamp)               # 👈 raíz explícita
        .join(
            LoyaltyCardInstance,
            LoyaltyCardStamp.instance_id == LoyaltyCardInstance.id,
        )
        .join(
            LoyaltyCardTemplate,
            LoyaltyCardTemplate.id == LoyaltyCardInstance.template_id,
        )
        .filter(LoyaltyCardTemplate.company_id == company_id)
    )
    if tpl_id:
        stamps_q = stamps_q.filter(LoyaltyCardInstance.template_id == tpl_id)
    if start_dt:
        stamps_q = stamps_q.filter(LoyaltyCardStamp.given_at >= start_dt)
    if end_dt:
        stamps_q = stamps_q.filter(LoyaltyCardStamp.given_at <= end_dt)

    total_stamps = stamps_q.scalar() or 0

    # recompensas resgatadas ---------------------------------------------
    redeem_q = (
        db.query(RewardRedemptionCode)
        .join(
            TemplateRewardLink,
            RewardRedemptionCode.link_id == TemplateRewardLink.id,
        )
        .join(
            LoyaltyCardTemplate,
            LoyaltyCardTemplate.id == TemplateRewardLink.template_id,
        )
        .filter(LoyaltyCardTemplate.company_id == company_id)
        .filter(RewardRedemptionCode.used.is_(True))
    )
    if tpl_id:
        redeem_q = redeem_q.filter(
            RewardRedemptionCode.instance.has(template_id=tpl_id)
        )
    if start_dt:
        redeem_q = redeem_q.filter(RewardRedemptionCode.expires_at >= start_dt)
    if end_dt:
        redeem_q = redeem_q.filter(RewardRedemptionCode.expires_at <= end_dt)

    rewards_redeemed = redeem_q.count()

    return dict(
        total_cards=total_cards,
        unique_users=unique_users,
        total_stamps=total_stamps,
        rewards_redeemed=rewards_redeemed,
    )


# ───────────────────────── séries diárias ─────────────────────
def daily_counts(
    db: Session,
    company_id: str,
    tpl_id: UUID | None,
    date_from: date,
    date_to: date,
) -> dict[str, dict[date, int]]:
    """Retorna contagens por dia entre date_from e date_to (inclusive)."""
    if date_from > date_to:
        date_from, date_to = date_to, date_from

    start_dt = datetime.combine(date_from, time.min)
    end_dt   = datetime.combine(date_to,   time.max)
    span     = (date_to - date_from).days + 1
    full_rng = [date_from + timedelta(d) for d in range(span)]

    # cartões por dia -----------------------------------------------------
    day_col = cast(LoyaltyCardInstance.issued_at, Date)

    cards_q = (
        db.query(day_col.label("d"), func.count().label("n"))
        .join(
            LoyaltyCardTemplate,
            LoyaltyCardTemplate.id == LoyaltyCardInstance.template_id,
        )
        .filter(LoyaltyCardTemplate.company_id == company_id)
        .filter(LoyaltyCardInstance.issued_at.between(start_dt, end_dt))
    )
    if tpl_id:
        cards_q = cards_q.filter(LoyaltyCardInstance.template_id == tpl_id)

    cards = {d: n for d, n in cards_q.group_by("d").all()}

    # resgates por dia ----------------------------------------------------
    redeem_day = cast(RewardRedemptionCode.expires_at, Date)

    redeems_q = (
        db.query(redeem_day.label("d"), func.count().label("n"))
        .select_from(RewardRedemptionCode)            # 👈 raíz explícita
        .join(
            TemplateRewardLink,
            RewardRedemptionCode.link_id == TemplateRewardLink.id,
        )
        .join(
            LoyaltyCardTemplate,
            LoyaltyCardTemplate.id == TemplateRewardLink.template_id,
        )
        .filter(LoyaltyCardTemplate.company_id == company_id)
        .filter(RewardRedemptionCode.used.is_(True))
        .filter(RewardRedemptionCode.expires_at.between(start_dt, end_dt))
    )
    if tpl_id:
        redeems_q = redeems_q.filter(
            RewardRedemptionCode.instance.has(template_id=tpl_id)
        )

    redeems = {d: n for d, n in redeems_q.group_by("d").all()}

    # completa range com zeros -------------------------------------------
    return {
        "cards":   {d: cards.get(d, 0)   for d in full_rng},
        "redeems": {d: redeems.get(d, 0) for d in full_rng},
    }
