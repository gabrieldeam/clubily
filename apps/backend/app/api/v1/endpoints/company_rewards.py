# app/api/v1/endpoints/rewards.py
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Path, Body, status, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.api.deps import get_db, get_current_company, get_current_user
from app.services.file_service import save_upload

from app.services.company_reward_service import (
    create_reward, update_reward, delete_reward,
    add_link, remove_link,
    generate_reward_code, redeem_with_code
)
from app.schemas.reward import (
    RewardCreate, RewardUpdate, RewardRead,
    LinkCreate, LinkRead, RewardCodeResponse
)
from app.models.reward import CompanyReward, TemplateRewardLink
from app.models.loyalty_card import LoyaltyCardTemplate, LoyaltyCardInstance

router = APIRouter(tags=["company_rewards"])

# ─── CRUD Reward ---------------------------------------------------------
@router.post(
    "/admin",
    response_model=RewardRead,
    status_code=status.HTTP_201_CREATED,
    summary="Empresa: criar recompensa"
)
async def admin_create_reward(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    secret: bool = Form(False),
    stock_qty: Optional[int] = Form(None, ge=0),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    img_url = save_upload(image, "rewards") if image else None
    payload = RewardCreate(
        name=name,
        description=description,
        secret=secret,
        stock_qty=stock_qty
    )
    return create_reward(db, str(company.id), payload, img_url)


@router.get(
    "/admin",
    response_model=List[RewardRead],
    summary="Empresa: listar recompensas"
)
def admin_list_rewards(
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    return db.query(CompanyReward).filter_by(company_id=company.id).all()


@router.put(
    "/admin/{reward_id}",
    response_model=RewardRead,
    summary="Empresa: atualizar recompensa"
)
async def admin_update_reward(
    reward_id: UUID = Path(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    secret: bool = Form(False),
    stock_qty: Optional[int] = Form(None, ge=0),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    reward = db.get(CompanyReward, reward_id)
    if not reward or reward.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recompensa não encontrada")
    img_url = save_upload(image, "rewards") if image else None
    payload = RewardUpdate(
        name=name,
        description=description,
        secret=secret,
        stock_qty=stock_qty
    )
    return update_reward(db, reward, payload, img_url)


@router.delete(
    "/admin/{reward_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Empresa: deletar recompensa"
)
def admin_delete_reward(
    reward_id: UUID = Path(...),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    reward = db.get(CompanyReward, reward_id)
    if not reward or reward.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recompensa não encontrada")
    try:
        delete_reward(db, reward)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ─── Link recompensa ↔ template -----------------------------------------
@router.post(
    "/admin/templates/{tpl_id}/attach",
    response_model=LinkRead,
    status_code=status.HTTP_201_CREATED,
    summary="Empresa: associar recompensa a template"
)
def admin_attach_reward(
    tpl_id: UUID = Path(..., description="ID do template"),
    payload: LinkCreate = Body(...),
    db: Session = Depends(get_db),
    company=Depends(get_current_company),
):
    tpl = db.get(LoyaltyCardTemplate, tpl_id)
    if not tpl or tpl.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Template não encontrado")

    reward = db.get(CompanyReward, payload.reward_id)
    if not reward or reward.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recompensa não encontrada")

    # impede dois links no mesmo stamp_no
    exists = (
        db.query(TemplateRewardLink)
          .filter_by(template_id=tpl.id, stamp_no=payload.stamp_no)
          .first()
    )
    if exists:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Já existe recompensa no carimbo #{payload.stamp_no}"
        )

    # cria vínculo (agora sem restrição em reward_id)
    try:
        return add_link(db, tpl, reward, payload.stamp_no)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    except IntegrityError:
        db.rollback()
        # deveria não cair aqui, mas só por segurança:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Erro inesperado ao associar recompensa"
        )



@router.post(
    "/user/instances/{inst_id}/rewards/{link_id}/code",
    response_model=RewardCodeResponse,
    summary="Usuário: gerar código para resgatar recompensa"
)
def user_generate_reward_code(
    inst_id: UUID = Path(...),
    link_id: UUID = Path(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    inst = db.get(LoyaltyCardInstance, inst_id)
    if not inst or inst.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Instância não encontrada")
    link = db.get(TemplateRewardLink, link_id)
    if not link or link.template_id != inst.template_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ligação inválida")

    code_obj, reused = generate_reward_code(db, link, inst)
    return {
        "code": code_obj.code,
        "expires_at": code_obj.expires_at,
        "reused": reused,
    }


@router.delete(
    "/admin/link/{link_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Empresa: desvincular recompensa do template"
)
def admin_remove_link(
    link_id: UUID = Path(...),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    link = (
        db.query(TemplateRewardLink)
          .join(LoyaltyCardTemplate)
          .filter(TemplateRewardLink.id == link_id, LoyaltyCardTemplate.company_id == company.id)
          .first()
    )
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ligação não encontrada")
    try:
        remove_link(db, link)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ─── USER: gerar código de resgate ---------------------------------------
@router.post(
    "/user/instances/{inst_id}/rewards/{link_id}/code",
    summary="Usuário: gerar código para resgatar recompensa"
)
def user_generate_reward_code(
    inst_id: UUID = Path(...),
    link_id: UUID = Path(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    inst = db.get(LoyaltyCardInstance, inst_id)
    if not inst or inst.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Instância não encontrada")
    link = db.get(TemplateRewardLink, link_id)
    if not link or link.template_id != inst.template_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ligação inválida")
    return generate_reward_code(db, link, inst)


# ─── ADMIN: confirmar resgate via código ---------------------------------
@router.post(
    "/admin/redeem",
    summary="Empresa: colocar código e descontar estoque"
)
def admin_redeem_reward(
    code: str = Form(...),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    try:
        reward = redeem_with_code(db, company.id, code)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return {"message": f"Recompensa '{reward.name}' resgatada com sucesso!"}
