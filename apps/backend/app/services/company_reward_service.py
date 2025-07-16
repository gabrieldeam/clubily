# app/services/reward_service.py

from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
from uuid import UUID
from app.models.reward import (
    CompanyReward, TemplateRewardLink, RewardRedemptionCode
)
from app.models.loyalty_card import LoyaltyCardInstance, LoyaltyCardTemplate
from app.services.loyalty_service import _rand_code      # reaproveita helper
from app.schemas.reward import RewardCreate, RewardUpdate

# ───────── CRUD básico de reward ──────────────────────────────
def create_reward(db: Session, company_id: str, payload: RewardCreate, image_url: str | None):
    data = payload.model_dump()
    if image_url:
        data["image_url"] = image_url
    reward = CompanyReward(company_id=company_id, **data)
    db.add(reward); db.commit(); db.refresh(reward)
    return reward

def update_reward(db: Session, reward: CompanyReward, payload: RewardUpdate, image_url: str | None):
    data = payload.model_dump()
    data.pop("image_url", None)
    for k, v in data.items():
        setattr(reward, k, v)
    if image_url is not None:
        reward.image_url = image_url
    db.commit(); db.refresh(reward)
    return reward

def delete_reward(db: Session, reward: CompanyReward):
    # Regra: se existir template emitido e este for o último reward dele → bloqueia
    for link in reward.template_links:
        tpl = link.template
        has_instances = db.query(LoyaltyCardInstance).filter_by(template_id=tpl.id).first() is not None
        if has_instances and len(tpl.rewards_map) <= 1:
            raise ValueError(f"Não é possível excluir – o template '{tpl.title}' já foi emitido e ficaria sem recompensas.")
    db.delete(reward); db.commit()


# ───────── ligação reward ↔ template ──────────────────────────
def add_link(db: Session, tpl: LoyaltyCardTemplate, reward: CompanyReward, stamp_no: int):
    if stamp_no > tpl.stamp_total:
        raise ValueError("stamp_no maior que stamp_total do template")
    link = TemplateRewardLink(template_id=tpl.id, reward_id=reward.id, stamp_no=stamp_no)
    db.add(link); db.commit(); db.refresh(link)
    return link

def remove_link(db: Session, link: TemplateRewardLink):
    tpl = link.template
    has_instances = db.query(LoyaltyCardInstance).filter_by(template_id=tpl.id).first() is not None
    if has_instances and len(tpl.rewards_map) <= 1:
        raise ValueError("Não é possível remover a última recompensa de um template que já foi emitido")
    db.delete(link); db.commit()


# ───────── geração / uso de código de resgate ─────────────────
def generate_reward_code(
    db: Session,
    link: TemplateRewardLink,
    instance: LoyaltyCardInstance,
    ttl_minutes: int = 30
) -> tuple[RewardRedemptionCode, bool]:
    now = datetime.now(timezone.utc)

    code_obj = (
        db.query(RewardRedemptionCode)
          .filter_by(link_id=link.id, instance_id=instance.id, used=False)
          .first()
    )

    # se achar e ainda não expirou, devolve reutilizado
    if code_obj and code_obj.expires_at >= now:
        return code_obj, True

    new_exp = now + timedelta(minutes=ttl_minutes)

    if code_obj:
        # expirou → atualiza
        code_obj.code = _rand_code()
        code_obj.expires_at = new_exp
    else:
        # nunca existiu → cria
        code_obj = RewardRedemptionCode(
            link_id=link.id,
            instance_id=instance.id,
            code=_rand_code(),
            expires_at=new_exp
        )
        db.add(code_obj)

    db.commit()
    db.refresh(code_obj)
    return code_obj, False


def redeem_with_code(db: Session, company_id: UUID, code: str):
    # normalize
    code = code.strip().upper()
    now = datetime.now(timezone.utc)

    # 1) fetch & lock the redemption record, joining through to company & instance
    rec = (
        db.query(RewardRedemptionCode)
          .join(TemplateRewardLink, TemplateRewardLink.id == RewardRedemptionCode.link_id)
          .join(CompanyReward,      CompanyReward.id      == TemplateRewardLink.reward_id)
          .join(LoyaltyCardInstance, LoyaltyCardInstance.id == RewardRedemptionCode.instance_id)
          .filter(
              func.upper(RewardRedemptionCode.code) == code,
              RewardRedemptionCode.used.is_(False),
              CompanyReward.company_id == company_id
          )
          .with_for_update()
          .first()
    )
    if not rec:
        raise ValueError("Código inexistente ou inválido")

    inst = rec.instance

    # 2) expired?
    if inst.expires_at and inst.expires_at < now:
        # mark closed
        inst.completed_at = now
        db.commit()
        raise ValueError("Cartão expirado")

    # 3) enough stamps for this reward?
    required = rec.link.stamp_no
    if inst.stamps_given < required:
        raise ValueError(f"Ainda não atingiu o carimbo #{required} necessário para esse resgate")

    # 4) stock
    reward = rec.link.reward
    if reward.stock_qty is not None and reward.stock_qty <= 0:
        raise ValueError("Sem estoque")

    # 5) all good → decrement stock, mark code used & card claimed
    if reward.stock_qty is not None:
        reward.stock_qty -= 1

    rec.used = True
    inst.reward_claimed = True

    db.commit()
    return reward