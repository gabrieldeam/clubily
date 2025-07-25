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
    name: Optional[str] = None
    description: Optional[str] = None
    points: int
    valid_from: str | None
    valid_to: str | None
    max_attributions: int

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
    # usa seu helper que já traz o filtro por rule_type
    rule: PointsRule | None = get_digital_rule_by_slug(db, slug)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Regra não encontrada")

    cfg = rule.config
    return DigitalBehaviorResponse(
        slug=slug,
        name=rule.name,
        description=rule.description,
        points=cfg.get("points"),
        valid_from=cfg.get("valid_from"),
        valid_to=cfg.get("valid_to"),
        max_attributions=cfg.get("max_attributions"),
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
    current_company=Depends(get_current_company)
):
    """
    1) Pré-cadastra ou atualiza lead (usuário) se vier phone ou cpf
    2) Dispara a atribuição de pontos para o evento digital
    """
    # 1) Pré‑cadastro / atualização de lead
    if payload.phone or payload.cpf:
        # normaliza antes de criar/atualizar
        phone_norm = normalize_phone(payload.phone) if payload.phone else None
        cpf_norm   = normalize_cpf(payload.cpf)     if payload.cpf   else None

        lead = create_or_update_lead(
            db,
            LeadCreate(
                phone      = phone_norm,
                cpf        = cpf_norm,
                company_id = str(current_company.id)
            )
        )
        user_id = str(lead.id)

    elif payload.user_id:
        user_id = str(payload.user_id)

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="É necessário fornecer user_id ou phone/cpf para pré‑cadastro"
        )

    # 2) Processa o evento digital e atribui pontos
    try:
        # note: aqui usamos amount=0 e purchased_items=[]
        awarded = process_digital_behavior_event(
            db,
            user_id,
            slug,
            amount=Decimal("0"),
            purchased_items=[]
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return {"points_awarded": awarded}