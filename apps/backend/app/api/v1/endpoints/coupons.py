
from decimal import Decimal
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, get_current_company, get_current_user, require_admin
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponRead, PaginatedCoupons
from app.services.coupon_service import (
    create_coupon, get_coupon, list_coupons_by_company, update_coupon, delete_coupon, serialize_coupon, list_active_visible
)
from app.models.coupon import Coupon
from app.schemas.coupon_redeem import CouponValidateRequest, CouponValidateResponse
from app.services.coupon_redeem_service import validate_and_optionally_redeem

from app.schemas.coupon_admin import (
    CouponStatsAdmin,
    CouponRedemptionUserAdmin,
    CouponUserAggregateAdmin,
)
from app.models.user import User
from app.models.coupon_redemption import CouponRedemption
from app.models.company import Company

router = APIRouter(tags=["coupons"])


@router.post(
    "/",
    response_model=CouponRead,
    status_code=status.HTTP_201_CREATED,
    summary="Cria um cupom para a empresa logada",
)
def create_coupon_endpoint(
    payload: CouponCreate,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    return create_coupon(db, str(current_company.id), payload)

@router.get("/", response_model=PaginatedCoupons)
def list_coupons_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    total, items = list_coupons_by_company(db, str(current_company.id), skip, limit)
    # ⬇️ serialize itens
    return PaginatedCoupons(
        total=total,
        skip=skip,
        limit=limit,
        items=[serialize_coupon(db, c) for c in items],
    )

@router.get(
    "/public/visible",
    response_model=PaginatedCoupons,
    summary="Lista cupons ativos e visíveis (público; exige usuário logado)",
)
def list_public_visible_coupons(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    company_id: str | None = Query(None, description="Filtrar por empresa (opcional)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),  # ⬅️ exige login de usuário
):
    total, items = list_active_visible(db, skip, limit, company_id)
    return PaginatedCoupons(
        total=total,
        skip=skip,
        limit=limit,
        items=[serialize_coupon(db, c) for c in items],
    )

@router.get("/{coupon_id}", response_model=CouponRead)
def read_coupon_endpoint(
    coupon_id: str = Path(..., description="UUID do cupom"),
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    c = get_coupon(db, coupon_id)
    if not c or str(c.company_id) != str(current_company.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cupom não encontrado")
    return serialize_coupon(db, c)   # ⬅️ aqui


@router.get("/by-code/{code}", response_model=CouponRead)
def get_by_code(
    code: str = Path(..., description="Código do cupom (case-insensitive)"),
    db: Session = Depends(get_db),
    current_company = Depends(get_current_company),
):
    c = (
        db.query(Coupon)
          .filter(Coupon.company_id == current_company.id, func.lower(Coupon.code) == func.lower(code))
          .first()
    )
    if not c:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cupom não encontrado")
    return serialize_coupon(db, c)   # ⬅️ aqui


@router.post(
    "/redeem",
    response_model=CouponValidateResponse,
    summary="Valida e (se dry_run=false) registra o uso de um cupom para um usuário",
)
def redeem_coupon(
    payload: CouponValidateRequest,
    db: Session = Depends(get_db),
    current_company = Depends(get_current_company),
):
    ok, reason, coupon, discount, redemption = validate_and_optionally_redeem(
        db=db,
        company_id=str(current_company.id),
        code=payload.code,
        user_id=str(payload.user_id),
        amount=payload.amount,
        item_ids=payload.item_ids,
        source_lat=payload.source_lat,
        source_lng=payload.source_lng,
        source_location_name=payload.source_location_name,
        dry_run=payload.dry_run,
    )

    final_amount = None
    if ok:
        final_amount = float(Decimal(str(payload.amount)) - discount)

    return CouponValidateResponse(
        valid=ok,
        reason=reason,
        coupon_id=str(coupon.id) if coupon else None,
        discount=float(discount),
        final_amount=final_amount,
        redemption_id=str(redemption.id) if redemption else None,
    )

@router.put("/{coupon_id}", response_model=CouponRead)
def update_coupon_endpoint(
    coupon_id: str,
    payload: CouponUpdate,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    c = get_coupon(db, coupon_id)
    if not c or str(c.company_id) != str(current_company.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cupom não encontrado")
    return update_coupon(db, c, payload) 

@router.delete(
    "/{coupon_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Exclui um cupom da empresa logada",
)
def delete_coupon_endpoint(
    coupon_id: str,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    c = get_coupon(db, coupon_id)
    if not c or str(c.company_id) != str(current_company.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cupom não encontrado")
    delete_coupon(db, c)



# ──────────────────────────────────────────────────────────────────────────────
# 2.1) LISTAR STATS DE TODOS OS CUPONS DA PLATAFORMA (ADMIN)
# ──────────────────────────────────────────────────────────────────────────────
@router.get(
    "/platform/admin/coupons/stats",
    response_model=List[CouponStatsAdmin],
    summary="Plataforma (admin): estatísticas por cupom em toda a plataforma",
)
def platform_list_coupon_stats(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    company_id: Optional[UUID] = Query(None, description="Filtra por empresa"),
    active: Optional[bool] = Query(None, description="Filtra por status ativo"),
    visible: Optional[bool] = Query(None, description="Filtra por visibilidade"),
    q: Optional[str] = Query(None, description="Busca por nome/código (case-insensitive)"),
    created_from: Optional[datetime] = Query(None),
    created_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    response: Response = None,
):
    # agregados
    used_count = func.count(CouponRedemption.id).label("used_count")
    unique_users = func.count(func.distinct(CouponRedemption.user_id)).label("unique_users")
    total_discount_applied = func.coalesce(func.sum(CouponRedemption.discount_applied), 0).label("total_discount_applied")
    total_amount = func.coalesce(func.sum(CouponRedemption.amount), 0).label("total_amount")
    last_redemption_at = func.max(CouponRedemption.created_at).label("last_redemption_at")

    qy = (
        db.query(
            Coupon.id.label("coupon_id"),
            Coupon.company_id.label("company_id"),
            Company.name.label("company_name"),
            Coupon.name,
            Coupon.code,
            Coupon.is_active,
            Coupon.is_visible,
            Coupon.usage_limit_total,
            Coupon.usage_limit_per_user,
            Coupon.min_order_amount,
            Coupon.discount_type,
            Coupon.discount_value,
            Coupon.created_at,
            Coupon.updated_at,
            used_count,
            unique_users,
            total_discount_applied,
            total_amount,
            last_redemption_at,
        )
        .join(Company, Company.id == Coupon.company_id)
        .outerjoin(CouponRedemption, CouponRedemption.coupon_id == Coupon.id)
    )

    # filtros
    if company_id is not None:
        qy = qy.filter(Coupon.company_id == company_id)
    if active is not None:
        qy = qy.filter(Coupon.is_active.is_(active))
    if visible is not None:
        qy = qy.filter(Coupon.is_visible.is_(visible))
    if q:
        like = f"%{q.lower()}%"
        qy = qy.filter(func.or_(func.lower(Coupon.name).like(like), func.lower(Coupon.code).like(like)))
    if created_from is not None:
        qy = qy.filter(Coupon.created_at >= created_from)
    if created_to is not None:
        qy = qy.filter(Coupon.created_at <= created_to)

    # group by de todas as colunas base
    qy = qy.group_by(
        Coupon.id,
        Coupon.company_id,
        Company.name,
        Coupon.name,
        Coupon.code,
        Coupon.is_active,
        Coupon.is_visible,
        Coupon.usage_limit_total,
        Coupon.usage_limit_per_user,
        Coupon.min_order_amount,
        Coupon.discount_type,
        Coupon.discount_value,
        Coupon.created_at,
        Coupon.updated_at,
    ).order_by(Coupon.created_at.desc())

    total_rows = qy.count()
    rows = qy.offset((page - 1) * page_size).limit(page_size).all()

    if response is not None:
        response.headers["X-Total-Count"] = str(total_rows)
        response.headers["X-Page"] = str(page)
        response.headers["X-Page-Size"] = str(page_size)

    result: List[CouponStatsAdmin] = []
    for r in rows:
        result.append(
            CouponStatsAdmin(
                coupon_id=r.coupon_id,
                company_id=r.company_id,
                company_name=r.company_name,
                name=r.name,
                code=r.code,
                is_active=r.is_active,
                is_visible=r.is_visible,
                usage_limit_total=r.usage_limit_total,
                usage_limit_per_user=r.usage_limit_per_user,
                min_order_amount=float(r.min_order_amount) if r.min_order_amount is not None else None,
                discount_type=(r.discount_type.value if r.discount_type is not None and hasattr(r.discount_type, "value") else (r.discount_type or None)),
                discount_value=float(r.discount_value) if r.discount_value is not None else None,
                created_at=r.created_at,
                updated_at=r.updated_at,
                used_count=int(r.used_count or 0),
                unique_users=int(r.unique_users or 0),
                total_discount_applied=float(r.total_discount_applied or 0),
                total_amount=float(r.total_amount or 0),
                last_redemption_at=r.last_redemption_at,
            )
        )
    return result


# ──────────────────────────────────────────────────────────────────────────────
# 2.2) USUÁRIOS QUE USARAM UM CUPOM (AGREGADO POR USUÁRIO)
# ──────────────────────────────────────────────────────────────────────────────
@router.get(
    "/platform/admin/coupons/{coupon_id}/users",
    response_model=List[CouponUserAggregateAdmin],
    summary="Plataforma (admin): usuários que usaram um cupom (agregado por usuário)",
)
def platform_coupon_users_aggregate(
    coupon_id: UUID = Path(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    response: Response = None,
):
    qy = (
        db.query(
            CouponRedemption.coupon_id.label("coupon_id"),
            CouponRedemption.user_id.label("user_id"),
            User.name.label("user_name"),
            User.email.label("user_email"),
            func.count(CouponRedemption.id).label("uses_count"),
            func.coalesce(func.sum(CouponRedemption.discount_applied), 0).label("total_discount_applied"),
            func.coalesce(func.sum(CouponRedemption.amount), 0).label("total_amount"),
            func.min(CouponRedemption.created_at).label("first_used_at"),
            func.max(CouponRedemption.created_at).label("last_used_at"),
        )
        .join(User, User.id == CouponRedemption.user_id)
        .filter(CouponRedemption.coupon_id == coupon_id)
    )

    if date_from is not None:
        qy = qy.filter(CouponRedemption.created_at >= date_from)
    if date_to is not None:
        qy = qy.filter(CouponRedemption.created_at <= date_to)

    qy = qy.group_by(CouponRedemption.coupon_id, CouponRedemption.user_id, User.name, User.email)
    qy = qy.order_by(func.max(CouponRedemption.created_at).desc())

    total_rows = qy.count()
    rows = qy.offset((page - 1) * page_size).limit(page_size).all()

    if response is not None:
        response.headers["X-Total-Count"] = str(total_rows)
        response.headers["X-Page"] = str(page)
        response.headers["X-Page-Size"] = str(page_size)

    result: List[CouponUserAggregateAdmin] = []
    for r in rows:
        result.append(
            CouponUserAggregateAdmin(
                coupon_id=r.coupon_id,
                user_id=r.user_id,
                user_name=r.user_name,
                user_email=r.user_email,
                uses_count=int(r.uses_count or 0),
                total_discount_applied=float(r.total_discount_applied or 0),
                total_amount=float(r.total_amount or 0),
                first_used_at=r.first_used_at,
                last_used_at=r.last_used_at,
            )
        )
    return result


# ──────────────────────────────────────────────────────────────────────────────
# 2.3) LISTA DETALHADA DE RESGATES DE UM CUPOM (CADA USO)
# ──────────────────────────────────────────────────────────────────────────────
@router.get(
    "/platform/admin/coupons/{coupon_id}/redemptions",
    response_model=List[CouponRedemptionUserAdmin],
    summary="Plataforma (admin): lista de resgates do cupom (detalhado)",
)
def platform_coupon_redemptions(
    coupon_id: UUID = Path(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    response: Response = None,
):
    qy = (
        db.query(
            CouponRedemption.id.label("redemption_id"),
            CouponRedemption.coupon_id.label("coupon_id"),
            CouponRedemption.user_id.label("user_id"),
            User.name.label("user_name"),
            User.email.label("user_email"),
            CouponRedemption.amount.label("amount"),
            CouponRedemption.discount_applied.label("discount_applied"),
            CouponRedemption.source_location_name.label("source_location_name"),
            func.ST_Y(CouponRedemption.redemption_location).label("lat"),
            func.ST_X(CouponRedemption.redemption_location).label("lng"),
            CouponRedemption.created_at.label("created_at"),
        )
        .join(User, User.id == CouponRedemption.user_id)
        .filter(CouponRedemption.coupon_id == coupon_id)
    )

    if date_from is not None:
        qy = qy.filter(CouponRedemption.created_at >= date_from)
    if date_to is not None:
        qy = qy.filter(CouponRedemption.created_at <= date_to)

    qy = qy.order_by(CouponRedemption.created_at.desc())

    total_rows = qy.count()
    rows = qy.offset((page - 1) * page_size).limit(page_size).all()

    if response is not None:
        response.headers["X-Total-Count"] = str(total_rows)
        response.headers["X-Page"] = str(page)
        response.headers["X-Page-Size"] = str(page_size)

    result: List[CouponRedemptionUserAdmin] = []
    for r in rows:
        result.append(
            CouponRedemptionUserAdmin(
                redemption_id=r.redemption_id,
                coupon_id=r.coupon_id,
                user_id=r.user_id,
                user_name=r.user_name,
                user_email=r.user_email,
                amount=float(r.amount or 0),
                discount_applied=float(r.discount_applied or 0),
                source_location_name=r.source_location_name,
                redemption_lat=float(r.lat) if r.lat is not None else None,
                redemption_lng=float(r.lng) if r.lng is not None else None,
                created_at=r.created_at,
            )
        )
    return result