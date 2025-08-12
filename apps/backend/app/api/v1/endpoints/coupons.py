
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, get_current_company, get_current_user
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponRead, PaginatedCoupons
from app.services.coupon_service import (
    create_coupon, get_coupon, list_coupons_by_company, update_coupon, delete_coupon, serialize_coupon, list_active_visible
)
from app.models.coupon import Coupon
from app.schemas.coupon_redeem import CouponValidateRequest, CouponValidateResponse
from app.services.coupon_redeem_service import validate_and_optionally_redeem

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
