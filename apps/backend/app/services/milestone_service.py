from uuid import UUID
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException
from sqlalchemy import asc
from typing import List
from app.models.milestone          import Milestone
from app.models.user_milestone     import UserMilestone
from app.models.user_points_stats  import UserPointsStats

from app.schemas.milestone import MilestoneCreate, MilestoneUpdate


# ── CRUD Milestone ────────────────────────────────────────────
def create_milestone(db: Session, payload: MilestoneCreate, image_url: str) -> Milestone:
    m = Milestone(**payload.model_dump(), image_url=image_url)
    db.add(m)
    db.commit(); db.refresh(m)
    return m

def update_milestone(db: Session, mid: UUID, payload: MilestoneUpdate,
                     image_url: str | None = None) -> Milestone:
    m = db.get(Milestone, mid)
    if not m:
        raise HTTPException(404, "Marco não encontrado")
    for k, v in payload.model_dump().items():
        setattr(m, k, v)
    if image_url is not None:
        m.image_url = image_url
    db.commit(); db.refresh(m)
    return m

def delete_milestone(db: Session, mid: UUID):
    m = db.get(Milestone, mid)
    if not m:
        raise HTTPException(404)
    db.delete(m); db.commit()

def list_milestones(db: Session, skip: int, limit: int) -> List[Milestone]:
    return (
        db.query(Milestone)
          .filter(Milestone.active == True)
          .order_by(Milestone.order, Milestone.points)
          .offset(skip).limit(limit).all()
    )


# ── Lógica de atribuição ao usuário ───────────────────────────
def _ensure_user_milestones(db: Session, user_id: str):
    """
    Cria registros em user_milestones para todos os marcos cujo
    limiar já foi atingido pelo usuário, caso ainda não existam.
    """
    stats = db.query(UserPointsStats).filter_by(user_id=user_id).first()
    lifetime = stats.lifetime_points if stats else 0

    eligible_ids = [
        str(m.id)
        for m in db.query(Milestone.id)
                    .filter(Milestone.active==True, Milestone.points<=lifetime)
                    .all()
    ]
    if not eligible_ids:
        return

    existing = {
        str(r.milestone_id)
        for r in db.query(UserMilestone.milestone_id)
                   .filter_by(user_id=user_id)
                   .all()
    }
    to_insert = [mid for mid in eligible_ids if mid not in existing]
    for mid in to_insert:
        db.add(UserMilestone(user_id=user_id, milestone_id=mid))
    if to_insert:
        db.commit()

def get_user_milestones(db: Session, user_id: str) -> list[UserMilestone]:
    _ensure_user_milestones(db, user_id)

    return (
        db.query(UserMilestone)
          .options(selectinload(UserMilestone.milestone))   # ➋ carrega o Milestone
          .join(Milestone, Milestone.id == UserMilestone.milestone_id)
          .filter(UserMilestone.user_id == user_id)
          .order_by(Milestone.order, Milestone.points)
          .all()
    )



def get_next_milestone_status(db: Session, user_id: str) -> dict | None:
    """
    Retorna o próximo marco que o usuário ainda não alcançou
    e quantos pontos faltam.
    Estrutura já pronta para o schema NextMilestoneRead.
    """
    stats = db.query(UserPointsStats).filter_by(user_id=user_id).first()
    user_pts = stats.lifetime_points if stats else 0

    next_m = (
        db.query(Milestone)
          .filter(Milestone.active.is_(True))
          .filter(Milestone.points > user_pts)
          .order_by(asc(Milestone.points))
          .first()
    )
    if not next_m:
        return None

    remaining = next_m.points - user_pts

    return {
        "milestone_id": next_m.id,
        "title":        next_m.title,
        "points":       next_m.points,      # <- agora o nome bate com o schema
        "image_url":    next_m.image_url,
        "user_points":  user_pts,
        "remaining":    remaining,
    }


def list_all_milestones_with_status(db: Session, user_id: str) -> list[dict]:
    """
    Lista todos os marcos ativos, informando se o usuário já os conquistou.

    Retorno compatível com schema MilestoneStatusRead.
    """
    # 1) todos os marcos ativos ordenados
    all_ms = (
        db.query(Milestone)
          .filter(Milestone.active.is_(True))
          .order_by(Milestone.points.asc())
          .all()
    )

    # 2) marcos que o usuário já possui  {milestone_id: achieved_at}
    achieved = {
        um.milestone_id: um.achieved_at                #  ← campo correto
        for um in db.query(UserMilestone)
                    .filter_by(user_id=user_id)
                    .all()
    }

    # 3) monta saída
    out = []
    for m in all_ms:
        ach_at = achieved.get(m.id)
        out.append(
            {
                "id":          m.id,
                "title":       m.title,
                "points":      m.points,    #  ← chave alinhada ao schema
                "image_url":   m.image_url,
                "achieved":    ach_at is not None,
                "achieved_at": ach_at,
            }
        )
    return out