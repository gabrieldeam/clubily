# app/services/coupon_service.py
from typing import Optional, Tuple, List
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from geoalchemy2.elements import WKTElement

from app.models.coupon import Coupon, DiscountType
from app.models.product_category import ProductCategory
from app.models.inventory_item import InventoryItem
from app.schemas.coupon import CouponRead, PaginatedCoupons  # ⬅️ importar schemas


def _apply_geo(coupon: Coupon, lat: Optional[float], lng: Optional[float]) -> None:
    if lat is not None and lng is not None:
        coupon.source_location = WKTElement(f"POINT({lng} {lat})", srid=4326)
    elif lat is None and lng is None:
        pass


def _sync_m2m(
    db: Session,
    coupon: Coupon,
    company_id: str,
    category_ids: Optional[List[UUID]],
    item_ids: Optional[List[UUID]],
) -> None:
    if category_ids is not None:
        cats = (
            db.query(ProductCategory)
              .filter(ProductCategory.company_id == company_id,
                      ProductCategory.id.in_(category_ids))
              .all()
        )
        coupon.categories = cats

    if item_ids is not None:
        its = (
            db.query(InventoryItem)
              .filter(InventoryItem.company_id == company_id,
                      InventoryItem.id.in_(item_ids))
              .all()
        )
        coupon.items = its


# ---------- NOVO: serializer p/ CouponRead ----------
def serialize_coupon(db: Session, c: Coupon) -> CouponRead:
    # lat/lng a partir do Geography POINT (lon/lat)
    lat = lng = None
    if c.source_location is not None:
        # ST_Y = latitude, ST_X = longitude
        lat = db.scalar(func.ST_Y(c.source_location))
        lng = db.scalar(func.ST_X(c.source_location))

    return CouponRead(
        id=c.id,
        company_id=c.company_id,
        name=c.name,
        code=c.code,
        description=c.description,
        is_active=c.is_active,
        is_visible=c.is_visible,
        usage_limit_total=c.usage_limit_total,
        usage_limit_per_user=c.usage_limit_per_user,
        min_order_amount=float(c.min_order_amount) if c.min_order_amount is not None else None,
        discount_type=(c.discount_type.value if c.discount_type is not None else None),
        discount_value=float(c.discount_value) if c.discount_value is not None else None,
        category_ids=[cat.id for cat in (c.categories or [])],
        item_ids=[it.id for it in (c.items or [])],
        source_location_name=c.source_location_name,
        source_lat=float(lat) if lat is not None else None,
        source_lng=float(lng) if lng is not None else None,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )
# ----------------------------------------------------


def create_coupon(db: Session, company_id: str, data) -> CouponRead:
    c = Coupon(
        company_id=company_id,
        name=data.name,
        code=data.code,
        description=data.description,
        is_active=data.is_active if data.is_active is not None else True,
        is_visible=data.is_visible if data.is_visible is not None else True,
        usage_limit_total=data.usage_limit_total,
        usage_limit_per_user=data.usage_limit_per_user,
        min_order_amount=data.min_order_amount,
        discount_type=data.discount_type.value if data.discount_type else None,
        discount_value=data.discount_value,
        source_location_name=data.source_location_name,
    )
    _apply_geo(c, data.source_lat, data.source_lng)
    db.add(c)
    db.flush()

    _sync_m2m(db, c, company_id, data.category_ids, data.item_ids)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Código de cupom '{data.code}' já existe para esta empresa."
        )

    db.refresh(c)
    return serialize_coupon(db, c)


def get_coupon(db: Session, coupon_id: str) -> Optional[Coupon]:
    return db.get(Coupon, coupon_id)


def list_coupons_by_company(db: Session, company_id: str, skip: int, limit: int) -> Tuple[int, List[Coupon]]:
    base_q = db.query(Coupon).filter(Coupon.company_id == company_id).order_by(Coupon.created_at.desc())
    total = base_q.count()
    items = base_q.offset(skip).limit(limit).all()
    return total, items


def update_coupon(db: Session, coupon: Coupon, data) -> CouponRead:
    payload = data.model_dump(exclude_unset=True)

    for key in [
        "name", "code", "description", "is_active", "is_visible",
        "usage_limit_total", "usage_limit_per_user",
        "min_order_amount", "source_location_name"
    ]:
        if key in payload:
            setattr(coupon, key, payload[key])

    if "discount_type" in payload:
        coupon.discount_type = payload["discount_type"].value if payload["discount_type"] else None
    if "discount_value" in payload:
        coupon.discount_value = payload["discount_value"]

    lat = payload.get("source_lat", None)
    lng = payload.get("source_lng", None)
    if ("source_lat" in payload) or ("source_lng" in payload):
        if lat is None and lng is None:
            coupon.source_location = None
        else:
            _apply_geo(coupon, lat, lng)

    _sync_m2m(
        db,
        coupon,
        str(coupon.company_id),
        payload.get("category_ids", None),
        payload.get("item_ids", None),
    )

    db.commit()
    db.refresh(coupon)
    # ⬇️ retornar já serializado
    return serialize_coupon(db, coupon)


def delete_coupon(db: Session, coupon: Coupon) -> None:
    db.delete(coupon)
    db.commit()
