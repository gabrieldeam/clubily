from typing import Optional, Tuple, List
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func

from geoalchemy2.elements import WKTElement

from app.models.coupon import Coupon, DiscountType
from app.models.product_category import ProductCategory
from app.models.inventory_item import InventoryItem


def _apply_geo(coupon: Coupon, lat: Optional[float], lng: Optional[float]) -> None:
    if lat is not None and lng is not None:
        # WKT lon lat
        coupon.source_location = WKTElement(f"POINT({lng} {lat})", srid=4326)
    elif lat is None and lng is None:
        # não mexe se ambos None; para limpar explicitamente, envie lat/lng como null no update
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


def create_coupon(db: Session, company_id: str, data) -> Coupon:
    # data: CouponCreate
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
    db.flush()  # para ter c.id

    _sync_m2m(db, c, company_id, data.category_ids, data.item_ids)

    db.commit()
    db.refresh(c)
    return c


def get_coupon(db: Session, coupon_id: str) -> Optional[Coupon]:
    return db.get(Coupon, coupon_id)


def list_coupons_by_company(db: Session, company_id: str, skip: int, limit: int) -> Tuple[int, List[Coupon]]:
    base_q = db.query(Coupon).filter(Coupon.company_id == company_id).order_by(Coupon.created_at.desc())
    total = base_q.count()
    items = base_q.offset(skip).limit(limit).all()
    return total, items


def update_coupon(db: Session, coupon: Coupon, data) -> Coupon:
    # data: CouponUpdate
    payload = data.model_dump(exclude_unset=True)

    for key in [
        "name", "code", "description", "is_active", "is_visible",
        "usage_limit_total", "usage_limit_per_user",
        "min_order_amount", "source_location_name"
    ]:
        if key in payload:
            setattr(coupon, key, payload[key])

    # discount_type e discount_value
    if "discount_type" in payload:
        coupon.discount_type = payload["discount_type"].value if payload["discount_type"] else None
    if "discount_value" in payload:
        coupon.discount_value = payload["discount_value"]

    # geoloc
    lat = payload.get("source_lat", None)
    lng = payload.get("source_lng", None)
    if ("source_lat" in payload) or ("source_lng" in payload):
        # se vier qualquer um, tentamos aplicar (limpar só se ambos vierem None explicitamente)
        if lat is None and lng is None:
            coupon.source_location = None
        else:
            _apply_geo(coupon, lat, lng)

    # m2m
    _sync_m2m(
        db,
        coupon,
        str(coupon.company_id),
        payload.get("category_ids", None),
        payload.get("item_ids", None),
    )

    db.commit()
    db.refresh(coupon)
    return coupon


def delete_coupon(db: Session, coupon: Coupon) -> None:
    db.delete(coupon)
    db.commit()
