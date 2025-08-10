# app/services/loyalty_service.py
import random, string
from datetime import datetime, timedelta, timezone
from uuid import UUID
from decimal import Decimal
from typing import Optional, List, Set
import os
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload, noload

from app.models.loyalty_card import (
    LoyaltyCardTemplate, LoyaltyCardRule, LoyaltyCardInstance,
    LoyaltyCardStamp, LoyaltyCardStampCode
)
from app.schemas.loyalty_card import TemplateCreate, RuleCreate
from app.models.inventory_item import InventoryItem
from app.services.wallet_service import get_wallet_balance, debit_wallet
from app.services.fee_setting_service import get_effective_fee
from app.models.fee_setting import SettingTypeEnum
from app.schemas.loyalty_card import StampData

# ───────── helpers ─────────────────────────────────────────────
def _rand_code(n: int = 6) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=n))

# ───────── templates ───────────────────────────────────────────
def create_template(
    db: Session, company_id: str, payload: TemplateCreate, stamp_icon_url: str | None
) -> LoyaltyCardTemplate:
    data = payload.model_dump()
    if stamp_icon_url:
        data["stamp_icon_url"] = stamp_icon_url
    tpl = LoyaltyCardTemplate(company_id=company_id, **data)
    db.add(tpl); db.commit(); db.refresh(tpl)
    return tpl


def _delete_file_from_url(url: str):
    # url = "/static/rewards/loyalty_icons/abc.png"
    rel_path = url.lstrip("/")                # "static/rewards/loyalty_icons/abc.png"
    file_path = Path(os.getcwd()) / rel_path  # "/full/path/to/app/static/rewards/…"
    if file_path.exists():
        file_path.unlink()

def update_template(db, tpl_id, payload, stamp_icon_url):
    tpl = db.get(LoyaltyCardTemplate, tpl_id)
    if not tpl:
        raise ValueError("Template not found")

    # 1) Atualiza tudo do payload EXCETO o stamp_icon_url
    data = payload.model_dump()
    data.pop("stamp_icon_url", None)           # remove o campo que viria sempre None
    for k, v in data.items():
        setattr(tpl, k, v)

    # 2) Só agora trato o novo ícone (se vier)
    if stamp_icon_url is not None:
        if tpl.stamp_icon_url:
            _delete_file_from_url(tpl.stamp_icon_url)
        tpl.stamp_icon_url = stamp_icon_url

    db.commit()
    db.refresh(tpl)
    return tpl



def add_rule(db: Session, tpl_id: UUID, payload: RuleCreate) -> LoyaltyCardRule:
    tpl = db.get(LoyaltyCardTemplate, tpl_id)
    if not tpl: raise ValueError("Template not found")
    rule = LoyaltyCardRule(template_id=tpl_id, **payload.model_dump())
    db.add(rule); db.commit(); db.refresh(rule)
    return rule

# ───────── emissão de cartão ───────────────────────────────────
def issue_card(db: Session, tpl_id: UUID, user_id: str) -> LoyaltyCardInstance:
    tpl = db.get(LoyaltyCardTemplate, tpl_id)
    if not tpl or not tpl.active:
        raise ValueError("Template inativo")
    now = datetime.now(timezone.utc)
    if tpl.emission_start and now < tpl.emission_start:
        raise ValueError("Emissão ainda não começou")
    if tpl.emission_end and now > tpl.emission_end:
        raise ValueError("Emissão encerrada")

    # respeita limite total do template
    if tpl.emission_limit is not None:
        total_emitted = db.query(LoyaltyCardInstance).filter_by(template_id=tpl_id).count()
        if total_emitted >= tpl.emission_limit:
            raise ValueError("Limite total de emissões atingido")

    # respeita limite por usuário
    count = (
        db.query(LoyaltyCardInstance)
          .filter_by(template_id=tpl_id, user_id=user_id)
          .count()
    )
    if count >= tpl.per_user_limit:
        raise ValueError("Limite por usuário excedido")

    inst = LoyaltyCardInstance(
        template_id=tpl_id,
        user_id=user_id,
        expires_at=tpl.emission_end,   # ou derivar regra de validade
    )
    db.add(inst); db.commit(); db.refresh(inst)
    return inst

# ───────── código de carimbo ───────────────────────────────────
def generate_code(db: Session, instance_id: UUID, ttl_minutes: int = 15):
    inst = db.get(LoyaltyCardInstance, instance_id)
    if not inst: raise ValueError("Cartão não encontrado")
    code_obj = (
        db.query(LoyaltyCardStampCode)
          .filter_by(instance_id=instance_id, used=False)
          .first()
    )
    exp_at = datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes)
    if code_obj:
        code_obj.code = _rand_code()
        code_obj.expires_at = exp_at
    else:
        code_obj = LoyaltyCardStampCode(
            instance_id=instance_id,
            code=_rand_code(),
            expires_at=exp_at,
            used=False
        )
        db.add(code_obj)
    db.commit(); db.refresh(code_obj)
    return code_obj

# ───────── registro de carimbo pela empresa ───────────────────
def stamp_with_code(
    db: Session,
    company_id: str,
    code: str,
    payload: Optional[dict]
) -> LoyaltyCardInstance:
    """
    1) Valida o código de carimbo
    2) Verifica expiração do cartão
    3) Verifica se não está completo
    4) Avalia regras do template
    5) Insere o carimbo
    6) Marca completed_at se for o último
    7) Cobra taxa de loyalty
    8) Retorna a instância atualizada
    """
    payload = payload or {}

    # 1) Busca o código válido e não usado, para esta empresa
    code_rec = (
        db.query(LoyaltyCardStampCode)
          .join(LoyaltyCardInstance, LoyaltyCardInstance.id == LoyaltyCardStampCode.instance_id)
          .join(LoyaltyCardTemplate, LoyaltyCardTemplate.id == LoyaltyCardInstance.template_id)
          .filter(
              LoyaltyCardStampCode.code == code,
              LoyaltyCardStampCode.used.is_(False),
              LoyaltyCardStampCode.expires_at >= datetime.now(timezone.utc),
              LoyaltyCardTemplate.company_id == company_id
          )
          .with_for_update()
          .first()
    )
    if not code_rec:
        raise ValueError("Código inválido ou expirado")

    # 2) Carrega instância e template
    inst = db.get(LoyaltyCardInstance, code_rec.instance_id)
    tpl  = inst.template

    # ← Verifica se o cartão expirou
    now = datetime.now(timezone.utc)
    if inst.expires_at and inst.expires_at < now:
        inst.completed_at = now
        db.commit()
        raise ValueError("Cartão expirado")

    # 3) Se já estiver completo
    if inst.stamps_given >= tpl.stamp_total:
        raise ValueError("Cartão já completo")

    # 4) Carrega regras ativas em ordem
    rules = (
        db.query(LoyaltyCardRule)
          .filter_by(template_id=tpl.id, active=True)
          .order_by(LoyaltyCardRule.order.asc())
          .all()
    )

    # 5) Pré-calcula categorias de produtos (se houver)
    purchased: List[str] = [str(u) for u in (payload.get("purchased_items") or [])]
    item_categories: Set[str] = set()
    if purchased:
        items = (
            db.query(InventoryItem)
              .filter(InventoryItem.id.in_(purchased))
              .options(selectinload(InventoryItem.categories))
              .all()
        )
        for item in items:
            for cat in item.categories:
                item_categories.add(str(cat.id))

    # 6) Tenta casar alguma regra
    from decimal import Decimal  # já importado no topo
    matched = False
    for rule in rules:
        cfg = rule.config or {}
        rtype = rule.rule_type.value if hasattr(rule.rule_type, "value") else rule.rule_type

        if rtype == "purchase_amount":
            amt = payload.get("amount")
            if amt is not None and Decimal(str(amt)) >= Decimal(str(cfg.get("amount", 0))):
                matched = True

        elif rtype == "visit":
            need = int(cfg.get("visits", 1))
            got  = int(payload.get("visit_count") or 0)
            if got >= need:
                matched = True

        elif rtype == "product_bought":
            if any(pid in cfg.get("product_ids", []) for pid in purchased):
                matched = True

        elif rtype == "category_bought":
            if item_categories & set(cfg.get("category_ids", [])):
                matched = True

        elif rtype == "service_done":
            sid = payload.get("service_id")
            if sid and str(sid) == cfg.get("service_id"):
                matched = True

        elif rtype == "custom_event":
            ev = payload.get("event_name")
            if ev and ev == cfg.get("event_name"):
                matched = True

        if matched:
            break

    if not matched:
        raise ValueError("Nenhuma regra aplicável para este código/payload")

    # 7) Insere o carimbo
    next_stamp = inst.stamps_given + 1
    stamp = LoyaltyCardStamp(
        instance_id=inst.id,
        stamp_no=next_stamp,
        given_by_id=None
    )
    db.add(stamp)
    inst.stamps_given = next_stamp

    # 8) Se completou, marca completed_at
    if next_stamp >= tpl.stamp_total:
        inst.completed_at = datetime.now(timezone.utc)

    # 9) Marca o código como usado
    code_rec.used = True

    # 10) Cobre taxa de loyalty da empresa
    company_id_str = str(tpl.company_id)
    fee = Decimal(str(get_effective_fee(db, company_id_str, SettingTypeEnum.loyalty)))
    balance = get_wallet_balance(db, company_id_str)
    if balance < fee:
        raise ValueError(
            f"Saldo insuficiente para taxa de carimbo no cartão fidelidade (custa R${fee:.2f})"
        )
    debit_wallet(
        db,
        company_id_str,
        fee,
        description="taxa de carimbo no cartão fidelidade"
    )

    # 11) Persiste e retorna
    db.commit()
    db.refresh(inst)
    return inst


















def _rtype(rule) -> str:
    return rule.rule_type.value if hasattr(rule.rule_type, "value") else str(rule.rule_type)

def _calc_stamps_from_rules(
    db: Session,
    rules: list[LoyaltyCardRule],
    payload: Optional[StampData],
) -> int:
    if not rules:
        return 1
    if payload is None:
        return 0

    # prepara insumos do payload
    amount = float(payload.amount or 0)
    visit_count = int(payload.visit_count or 0)
    purchased_ids = [str(x) for x in (payload.purchased_items or [])]
    service_id = str(payload.service_id) if payload.service_id else None
    event_name = payload.event_name

    # resolve categorias dos itens comprados (p/ category_bought)
    purchased_category_ids: set[str] = set()
    if purchased_ids:
        items = (
            db.query(InventoryItem)
              .filter(InventoryItem.id.in_(purchased_ids))
              .options(selectinload(InventoryItem.categories))
              .all()
        )
        for it in items:
            for cat in it.categories:
                purchased_category_ids.add(str(cat.id))

    max_stamps = 0

    for rule in rules:
        if not getattr(rule, "active", True):
            continue

        cfg = rule.config or {}
        rt = _rtype(rule)
        stamps_from_rule = 0

        if rt == "purchase_amount":
            min_amount = float(cfg.get("amount") or 0)
            if min_amount > 0 and amount >= min_amount:
                stamps_from_rule = int(amount // min_amount)

        elif rt == "visit":
            needed = int(cfg.get("visits") or 1)
            if needed > 0 and visit_count >= needed:
                stamps_from_rule = visit_count // needed

        elif rt == "service_done":
            if service_id and str(cfg.get("service_id")) == service_id:
                stamps_from_rule = 1

        elif rt == "product_bought":
            cfg_ids = set(str(x) for x in (cfg.get("product_ids") or []))
            if cfg_ids and set(purchased_ids) & cfg_ids:
                stamps_from_rule = 1

        elif rt == "category_bought":
            cfg_cat_ids = set(str(x) for x in (cfg.get("category_ids") or []))
            if cfg_cat_ids and purchased_category_ids & cfg_cat_ids:
                stamps_from_rule = 1

        elif rt == "custom_event":
            if event_name and cfg.get("event_name") == event_name:
                stamps_from_rule = 1

        max_stamps = max(max_stamps, stamps_from_rule)

    return max_stamps

# ─── NOVO: carimbar diretamente sem código ─────────────────────────────────────
def stamp_direct(
    db: Session,
    company_id: str,
    instance_id: UUID,
    payload: Optional[StampData],
    *,
    force: bool = False,
):
    """
    Carimba diretamente uma instância (admin), travando apenas a linha da instância.
    Regras:
      - Se `force=True`, ignora regras do template (mas ainda respeita expiração e limite).
      - Se `force=False`, aplica a 1ª/maior regra que caiba (ver _calc_stamps_from_rules).
      - Sempre limita ao máximo de carimbos do template.
    """

    # 1) Lock SOMENTE a linha da instância, sem eager loads (evita LEFT OUTER JOIN + FOR UPDATE)
    inst = db.execute(
        select(LoyaltyCardInstance)
        .options(noload("*"))
        .where(LoyaltyCardInstance.id == instance_id)
        .with_for_update(of=LoyaltyCardInstance)
    ).scalar_one_or_none()

    if not inst:
        raise ValueError("Cartão não encontrado")

    # 2) Validar se o cartão pertence a um template da empresa logada
    tpl = db.get(LoyaltyCardTemplate, inst.template_id)
    if not tpl or str(tpl.company_id) != str(company_id):
        raise ValueError("Cartão não pertence à sua empresa")

    # 3) Regras de expiração
    now = datetime.now(timezone.utc)
    if inst.expires_at and inst.expires_at < now:
        raise ValueError("Cartão expirado")

    # 4) Se já está completo, não pode receber mais carimbos
    if inst.completed_at is not None or inst.stamps_given >= tpl.stamp_total:
        raise ValueError("Cartão já está completo")

    # 5) Determinar quantos carimbos dar
    if force:
        # Admin forçando: permite informar visit_count para dar múltiplos carimbos
        stamps_to_add = int(getattr(payload, "visit_count", 0) or 1)
    else:
        # Aplica regras
        rules = (
            db.query(LoyaltyCardRule)
            .filter(LoyaltyCardRule.template_id == tpl.id, LoyaltyCardRule.active.is_(True))
            .order_by(LoyaltyCardRule.order.asc())
            .all()
        )
        stamps_to_add = _calc_stamps_from_rules(db, rules, payload)

    if stamps_to_add <= 0:
        raise ValueError("As regras do template não foram atendidas para carimbar")

    # 6) Respeitar o limite do template
    remaining = tpl.stamp_total - inst.stamps_given
    stamps_to_add = min(stamps_to_add, remaining)

    if stamps_to_add <= 0:
        raise ValueError("Nenhum carimbo disponível para adicionar")

    # 7) Criar registros de carimbo + atualizar contadores
    #    Gera stamp_no sequenciais: (stamps_given + 1) ... (stamps_given + stamps_to_add)
    new_stamps = []
    for i in range(1, stamps_to_add + 1):
        stamp_no = inst.stamps_given + i
        new_stamps.append(
            LoyaltyCardStamp(
                instance_id=inst.id,
                stamp_no=stamp_no,
                # Se o seu modelo tiver um campo JSON para metadados, descomente:
                # meta=(payload.model_dump(exclude_none=True) if payload else None),
            )
        )

    for s in new_stamps:
        db.add(s)

    inst.stamps_given += stamps_to_add

    # 8) Marcar como completo, se alcançou o total
    if inst.stamps_given >= tpl.stamp_total and inst.completed_at is None:
        inst.completed_at = now


    fee = Decimal(str(get_effective_fee(db, str(tpl.company_id), SettingTypeEnum.loyalty)))
    balance = get_wallet_balance(db, str(tpl.company_id))
    if balance < fee:
        raise ValueError(f"Saldo insuficiente para taxa de carimbo no cartão fidelidade (custa R${fee:.2f})")

    debit_wallet(
        db,
        str(tpl.company_id),
        fee,
        description="taxa de carimbo no cartão fidelidade"
    )

    db.add(inst)
    db.commit()
    db.refresh(inst)  # retorna com valores atualizados

    return inst