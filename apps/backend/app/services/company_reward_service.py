# app/services/reward_service.py
import random, string
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

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
def generate_reward_code(db: Session, link: TemplateRewardLink, instance: LoyaltyCardInstance, ttl_minutes: int = 30):
    # 1 por instância+link em aberto
    code_obj = (
        db.query(RewardRedemptionCode)
          .filter_by(link_id=link.id, instance_id=instance.id, used=False)
          .first()
    )
    exp_at = datetime.utcnow() + timedelta(minutes=ttl_minutes)
    if code_obj:
        code_obj.code = _rand_code()
        code_obj.expires_at = exp_at
    else:
        code_obj = RewardRedemptionCode(
            link_id=link.id,
            instance_id=instance.id,
            code=_rand_code(),
            expires_at=exp_at
        )
        db.add(code_obj)
    db.commit(); db.refresh(code_obj)
    return code_obj


def redeem_with_code(db: Session, company_id: str, code: str):
    rec = (
        db.query(RewardRedemptionCode)
          .join(TemplateRewardLink, TemplateRewardLink.id == RewardRedemptionCode.link_id)
          .join(CompanyReward, CompanyReward.id == TemplateRewardLink.reward_id)
          .join(LoyaltyCardInstance, LoyaltyCardInstance.id == RewardRedemptionCode.instance_id)
          .join(LoyaltyCardTemplate, LoyaltyCardTemplate.id == LoyaltyCardInstance.template_id)
          .filter(
              RewardRedemptionCode.code == code,
              RewardRedemptionCode.used.is_(False),
              RewardRedemptionCode.expires_at >= datetime.utcnow(),
              CompanyReward.company_id == company_id
          )
          .with_for_update()
          .first()
    )
    if not rec:
        raise ValueError("Código inválido ou expirado")

    reward = rec.link.reward
    if reward.stock_qty is not None and reward.stock_qty <= 0:
        raise ValueError("Sem estoque")

    # desconta
    if reward.stock_qty is not None:
        reward.stock_qty -= 1
    rec.used = True
    db.commit()
    return reward   # devolve para mostrar ao admin
