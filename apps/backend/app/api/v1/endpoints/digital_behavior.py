from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, UUID4, ConfigDict
from typing import Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.points_rule import PointsRule
from app.schemas.company import CompanyBasic

from app.api.deps import get_db, get_current_company
from app.services.digital_behavior_service import (
    get_digital_rule_by_slug,
    process_digital_behavior_event, is_slug_unique
)

from app.services.lead_service import create_or_update_lead
from app.schemas.user import LeadCreate
from app.core.phone_utils import normalize_phone
from app.core.cpf_utils   import normalize_cpf

router = APIRouter(tags=["digital_behavior"])

class DigitalBehaviorResponse(BaseModel):
    company: CompanyBasic
    slug: str
    name: str | None = None
    description: str | None = None
    points: int = 0
    valid_from: str | None = None
    valid_to: str | None = None
    max_attributions: int = 0
    model_config = ConfigDict(from_attributes=True)


class DigitalBehaviorTriggerPayload(BaseModel):    
    user_id: UUID4 | None = None
    phone:  str   | None = None
    cpf:    str   | None = None

class DigitalBehaviorTriggerResponse(BaseModel):
    points_awarded: int

class SlugAvailabilityResponse(BaseModel):
    available: bool

@router.get(
    "/slug-available",
    response_model=SlugAvailabilityResponse,
    status_code=200
)
def check_slug_available(
    slug: str = Query(..., description="Slug a testar"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company)
):
    """
    Verifica se o slug já existe para regras digital_behavior
    desta empresa.
    """
    available = is_slug_unique(
        db,
        slug,
        str(current_company.id)
    )
    return {"available": available}

@router.get("/{slug}", response_model=DigitalBehaviorResponse)
def get_digital_rule(slug: str, db: Session = Depends(get_db)):
    rule: PointsRule | None = get_digital_rule_by_slug(db, slug)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regra não encontrada")

    cfg = rule.config or {}
    return DigitalBehaviorResponse(
        slug=slug,
        name=rule.name,
        description=rule.description,
        points=int(cfg.get("points") or 0),
        valid_from=cfg.get("valid_from") or None,
        valid_to=cfg.get("valid_to") or None,
        max_attributions=int(cfg.get("max_attributions") or 0),
        company=rule.company,
    )


@router.post(
    "/{slug}/trigger",
    response_model=DigitalBehaviorTriggerResponse,
    status_code=status.HTTP_201_CREATED
)
def trigger_rule(
    slug: str,
    payload: DigitalBehaviorTriggerPayload,
    db: Session = Depends(get_db),
):
    """
    Público: identifica a empresa pelo slug da regra.
    1) Pré-cadastra/atualiza lead com phone/cpf (ou usa user_id)
    2) Processa o evento digital e atribui pontos
    """
    # Descobre a empresa pelo slug (sem exigir login)
    rule = get_digital_rule_by_slug(db, slug)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regra não encontrada")
    company_id = str(rule.company_id)

    # 1) Pré-cadastro / atualização de lead
    if payload.phone or payload.cpf:
        phone_norm = normalize_phone(payload.phone) if payload.phone else None
        cpf_norm   = normalize_cpf(payload.cpf)     if payload.cpf   else None

        lead = create_or_update_lead(
            db,
            LeadCreate(
                phone      = phone_norm,
                cpf        = cpf_norm,
                company_id = company_id
            )
        )
        user_id = str(lead.id)

    elif payload.user_id:
        user_id = str(payload.user_id)

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="É necessário fornecer user_id ou phone/cpf para pré-cadastro"
        )

    # 2) Processa o evento digital e atribui pontos
    try:
        awarded = process_digital_behavior_event(
            db,
            user_id,
            slug,
            amount=Decimal("0"),
            purchased_items=[]
        )
    except ValueError as e:
        # se a regra estiver inativa/expirada/etc, converte para 404 quando fizer sentido
        msg = str(e)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrada" in msg or "inativa" in msg else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=msg)

    return {"points_awarded": awarded}