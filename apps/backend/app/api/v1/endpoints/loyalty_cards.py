# app/api/v1/endpoints/loyalty_cards.py
from uuid import UUID
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import (
    APIRouter, Depends, UploadFile, File, Form,
    Query, Path, status, HTTPException, Body, Response
)
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_

from app.api.deps import (
    get_db, get_current_company, get_current_user
)
from app.services.file_service import save_upload, delete_file_from_url
from app.services.loyalty_service import (
    create_template, update_template, add_rule,
    issue_card, generate_code, stamp_with_code    
)
from app.schemas.loyalty_card import (
    TemplateCreate, TemplateUpdate, TemplateRead,
    RuleCreate, RuleRead,
    InstanceRead, InstanceDetail,
    CodeResponse, StampPayload
)
from app.models.loyalty_card import (
    LoyaltyCardTemplate,
    LoyaltyCardInstance,
    LoyaltyCardRule,
)

def paginate(query, page: int, size: int):
    """Aplica offset/limit e retorna resultados."""
    return query.limit(size).offset((page - 1) * size).all()

router = APIRouter(tags=["loyalty"])

# ─── ADMIN (empresa) / templates ─────────────────────────────────────────
@router.post(
    "/admin/templates",
    response_model=TemplateRead,
    status_code=status.HTTP_201_CREATED,
    summary="Empresa: criar template de cartão"
)
async def admin_create_template(
    # campos textuais
    title: str = Form(...),
    promo_text: Optional[str] = Form(None),
    stamp_total: int = Form(..., ge=1),
    emission_limit: Optional[int] = Form(None, ge=1),
    color_primary: Optional[str] = Form(None),
    color_bg: Optional[str] = Form(None),
    per_user_limit: int = Form(1, ge=1),
    emission_start: Optional[datetime] = Form(None),
    emission_end: Optional[datetime] = Form(None),
    active: bool = Form(True),
    # **aqui** o UploadFile chega como `stamp_icon`
    stamp_icon: UploadFile | None = File(None, description="Ícone do carimbo"),
    # deps
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    # salva arquivo e retorna URL ou None
    stamp_icon_url: Optional[str] = (
        save_upload(stamp_icon, "loyalty_icons")
        if stamp_icon
        else None
    )

    # monta o payload sem o ícone
    payload = TemplateCreate(
        title=title,
        promo_text=promo_text,
        stamp_total=stamp_total,
        emission_limit=emission_limit,
        color_primary=color_primary,
        color_bg=color_bg,
        per_user_limit=per_user_limit,
        emission_start=emission_start,
        emission_end=emission_end,
        active=active,
    )

    # chama o service passando a URL gerada
    return create_template(db, str(company.id), payload, stamp_icon_url)



@router.get(
    "/admin/templates",
    response_model=List[TemplateRead],
    summary="Empresa: listar templates"
)
def admin_list_templates(
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    return (
        db.query(LoyaltyCardTemplate)
          .filter_by(company_id=company.id)
          .order_by(LoyaltyCardTemplate.created_at.desc())
          .all()
    )

@router.put(
    "/admin/templates/{tpl_id}",
    response_model=TemplateRead,
    summary="Empresa: atualizar template"
)
async def admin_update_template(
    tpl_id: UUID = Path(...),
    title: str = Form(...),
    promo_text: Optional[str] = Form(None),
    stamp_total: int = Form(..., ge=1),
    emission_limit: Optional[int] = Form(None, ge=1),
    color_primary: Optional[str] = Form(None),
    color_bg: Optional[str] = Form(None),
    per_user_limit: int = Form(1, ge=1),
    emission_start: Optional[datetime] = Form(None),
    emission_end: Optional[datetime] = Form(None),
    active: bool = Form(True),
    stamp_icon: UploadFile | None = File(None, description="Ícone do carimbo"),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    # valida existência e empresa
    tpl = db.get(LoyaltyCardTemplate, tpl_id)
    if not tpl or tpl.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Template não encontrado")

    # salva novo ícone (se houver) e pega URL
    new_icon_url: Optional[str] = (
        save_upload(stamp_icon, "loyalty_icons")
        if stamp_icon
        else None
    )

    payload = TemplateUpdate(
        title=title,
        promo_text=promo_text,
        stamp_total=stamp_total,
        emission_limit=emission_limit,
        color_primary=color_primary,
        color_bg=color_bg,
        per_user_limit=per_user_limit,
        emission_start=emission_start,
        emission_end=emission_end,
        active=active,
    )

    # service já apaga ícone antigo (se existir) e seta o novo
    return update_template(db, tpl_id, payload, new_icon_url)


@router.delete(
    "/admin/templates/{tpl_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Empresa: deletar template (se não houver instâncias emitidas)"
)
def admin_delete_template(
    tpl_id: UUID = Path(...),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    tpl = db.get(LoyaltyCardTemplate, tpl_id)
    if not tpl or tpl.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Template não encontrado")
    exists = db.query(LoyaltyCardInstance).filter_by(template_id=tpl_id).first()
    if exists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Não é possível deletar: existem cartões emitidos")
    if tpl.stamp_icon_url:
        delete_file_from_url(tpl.stamp_icon_url)
    db.delete(tpl)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# ─── ADMIN (empresa) / regras ────────────────────────────────────────────
@router.post(
    "/admin/templates/{tpl_id}/rules",
    response_model=RuleRead,
    status_code=status.HTTP_201_CREATED,
    summary="Empresa: adicionar regra ao template"
)
def admin_add_rule(
    tpl_id: UUID = Path(...),
    payload: RuleCreate = Body(...),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    tpl = db.get(LoyaltyCardTemplate, tpl_id)
    if not tpl or tpl.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Template não encontrado")
    return add_rule(db, tpl_id, payload)

@router.get(
    "/admin/templates/{tpl_id}/rules",
    response_model=List[RuleRead],
    summary="Empresa: listar regras de um template"
)
def admin_list_rules(
    tpl_id: UUID = Path(...),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    tpl = db.get(LoyaltyCardTemplate, tpl_id)
    if not tpl or tpl.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Template não encontrado")
    return (
        db.query(LoyaltyCardRule)
          .filter_by(template_id=tpl_id)
          .order_by(LoyaltyCardRule.order.asc())
          .all()
    )

@router.get(
    "/admin/templates/{tpl_id}/rules/{rule_id}",
    response_model=RuleRead,
    summary="Empresa: obter regra pelo ID"
)
def admin_get_rule(
    tpl_id: UUID = Path(...),
    rule_id: UUID = Path(...),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    rule = db.get(LoyaltyCardRule, rule_id)
    if not rule or rule.template_id != tpl_id or rule.template.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Regra não encontrada")
    return rule

@router.put(
    "/admin/templates/{tpl_id}/rules/{rule_id}",
    response_model=RuleRead,
    summary="Empresa: atualizar regra pelo ID"
)
def admin_update_rule(
    tpl_id: UUID = Path(...),
    rule_id: UUID = Path(...),
    payload: RuleCreate = Body(...),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    rule = db.get(LoyaltyCardRule, rule_id)
    if not rule or rule.template_id != tpl_id or rule.template.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Regra não encontrada")
    for k, v in payload.model_dump().items():
        setattr(rule, k, v)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete(
    "/admin/templates/{tpl_id}/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Empresa: deletar regra do template"
)
def admin_delete_rule(
    tpl_id: UUID = Path(...),
    rule_id: UUID = Path(...),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
):
    # valida template
    tpl = db.get(LoyaltyCardTemplate, tpl_id)
    if not tpl or tpl.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Template não encontrado")

    # valida regra
    rule = db.get(LoyaltyCardRule, rule_id)
    if not rule or rule.template_id != tpl_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Regra não encontrada")

    # verifica se há instâncias emitidas
    has_instances = (
        db.query(LoyaltyCardInstance)
          .filter_by(template_id=tpl_id)
          .first()
          is not None
    )
    # conta quantas regras o template ainda tem
    total_rules = (
        db.query(LoyaltyCardRule)
          .filter_by(template_id=tpl_id)
          .count()
    )

    # se houve emissão e essa é a única regra, bloqueia
    if has_instances and total_rules <= 1:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Não é possível excluir a última regra de um template que já foi emitido"
        )

    # tudo ok: apaga a regra
    db.delete(rule)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# ─── ADMIN (empresa) / carimbar com código ───────────────────────────────
@router.post(
     "/admin/stamp",
     response_model=InstanceRead,
     summary="Empresa: carimbar cartão via código"
)
def admin_stamp_card(
     payload: StampPayload,
     db: Session = Depends(get_db),
     company = Depends(get_current_company),
 ):
     try:
         return stamp_with_code(
             db,
             str(company.id),
             payload.code,
             payload.model_dump(exclude={"code"})
         )
     except ValueError as e:
         raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

# ─── ADMIN (empresa) / listar instâncias ────────────────────────────────
@router.get(
    "/admin/templates/{tpl_id}/instances",
    response_model=List[InstanceRead],
    summary="Empresa: listar cartões emitidos de um template específico (paginado)"
)
def admin_list_instances_by_template(
    tpl_id: UUID = Path(..., description="ID do template"),
    page: int = Query(1, ge=1, description="Número da página (1 = primeira)"),
    page_size: int = Query(20, ge=1, le=100, description="Itens por página (máx 100)"),
    status: Optional[str] = Query(None, regex="^(active|completed)$"),
    missing_leq: Optional[int] = Query(None, ge=1),
    expires_within: Optional[int] = Query(None, description="dias até expirar"),
    db: Session = Depends(get_db),
    company = Depends(get_current_company),
    response: Response = None,
):
    # 1) Valida se o template pertence à empresa
    tpl = db.get(LoyaltyCardTemplate, tpl_id)
    if not tpl or tpl.company_id != company.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Template não encontrado")

    # 2) Constrói a query base
    q = db.query(LoyaltyCardInstance).filter(
        LoyaltyCardInstance.template_id == tpl_id
    )

    # 3) Aplica filtros
    if status == "completed":
        q = q.filter(LoyaltyCardInstance.completed_at.isnot(None))
    elif status == "active":
        q = q.filter(LoyaltyCardInstance.completed_at.is_(None))

    if missing_leq is not None:
        q = q.join(LoyaltyCardTemplate).filter(
            (LoyaltyCardTemplate.stamp_total - LoyaltyCardInstance.stamps_given) <= missing_leq
        )

    if expires_within is not None:
        limit_date = datetime.utcnow() + timedelta(days=expires_within)
        q = q.filter(LoyaltyCardInstance.expires_at <= limit_date)

    # 4) Total antes de paginar
    total = q.count()

    # 5) Ordena + pagina
    q = (
        q.order_by(LoyaltyCardInstance.issued_at.desc())
         .offset((page - 1) * page_size)
         .limit(page_size)
    )

    # 6) Cabeçalhos de paginação
    response.headers["X-Total-Count"] = str(total)
    response.headers["X-Page"] = str(page)
    response.headers["X-Page-Size"] = str(page_size)

    return q.all()



# ─── USUÁRIO / resgatar cartão ────────────────────────────────────────
@router.get(
    "/templates",
    response_model=List[TemplateRead],
    summary="Usuário: listar templates disponíveis por empresa"
)
def user_list_templates(
    company_id: UUID = Query(..., description="ID da empresa"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    now = datetime.utcnow()
    q = (
        db.query(LoyaltyCardTemplate)
          .filter(
              LoyaltyCardTemplate.company_id == company_id,
              LoyaltyCardTemplate.active.is_(True),
              or_(
                  LoyaltyCardTemplate.emission_start.is_(None),
                  LoyaltyCardTemplate.emission_start <= now
              ),
              or_(
                  LoyaltyCardTemplate.emission_end.is_(None),
                  LoyaltyCardTemplate.emission_end >= now
              )
          )
          .order_by(LoyaltyCardTemplate.created_at.desc())
    )
    return paginate(q, page, size)

@router.get(
    "/companies/{company_id}/loyalty/templates",
    response_model=List[TemplateRead],
    summary="Usuário: listar templates de cartão disponíveis de uma empresa"
)
def list_templates_by_company(
    company_id: UUID = Path(..., description="ID da empresa"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    now = datetime.utcnow()
    q = (
        db.query(LoyaltyCardTemplate)
          .filter(
              LoyaltyCardTemplate.company_id == company_id,
              LoyaltyCardTemplate.active.is_(True),
              ((LoyaltyCardTemplate.emission_start == None) |
               (LoyaltyCardTemplate.emission_start <= now)),
              ((LoyaltyCardTemplate.emission_end   == None) |
               (LoyaltyCardTemplate.emission_end   >= now)),
          )
          .order_by(LoyaltyCardTemplate.created_at.desc())
    )
    return paginate(q, page, size)


@router.post(
    "/templates/{tpl_id}/claim",
    response_model=InstanceRead,
    status_code=status.HTTP_201_CREATED,
    summary="Usuário: resgatar um novo cartão"
)
def user_claim_card(
    tpl_id: UUID = Path(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    try:
        return issue_card(db, tpl_id, str(user.id))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

@router.post(
    "/cards/{inst_id}/code",
    response_model=CodeResponse,
    summary="Usuário: gerar código único para carimbar"
)
def user_generate_code(
    inst_id: UUID = Path(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    inst = db.get(LoyaltyCardInstance, inst_id)
    if not inst or inst.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cartão não encontrado")
    code = generate_code(db, inst_id)
    return {"code": code.code, "expires_at": code.expires_at}

@router.get(
    "/cards",
    response_model=List[InstanceDetail],
    summary="Usuário: listar meus cartões e progresso"
)
def user_cards(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    q = (
        db.query(LoyaltyCardInstance)
          .options(
              selectinload(LoyaltyCardInstance.template),
              selectinload(LoyaltyCardInstance.stamps)
          )
          .filter_by(user_id=user.id)
          .order_by(LoyaltyCardInstance.issued_at.desc())
    )
    return paginate(q, page, size)
