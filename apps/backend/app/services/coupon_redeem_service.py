from typing import Optional, Tuple, List
from uuid import UUID
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func
from geoalchemy2.elements import WKTElement

from app.models.coupon import Coupon, DiscountType
from app.models.coupon_redemption import CouponRedemption
from app.models.inventory_item import InventoryItem

def _round2(x: Decimal) -> Decimal:
    return x.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def _compute_discount(amount: Decimal, coupon: Coupon) -> Decimal:
    if not coupon.discount_type or not coupon.discount_value:
        return Decimal("0.00")
    if coupon.discount_type == DiscountType.percent:
        return _round2(amount * (Decimal(coupon.discount_value) / Decimal("100")))
    # fixed
    return _round2(Decimal(coupon.discount_value))

def _items_categories_of_cart(db: Session, company_id: str, item_ids: List[UUID]) -> set[str]:
    if not item_ids:
        return set()
    items = (
        db.query(InventoryItem)
          .options(selectinload(InventoryItem.categories))
          .filter(
              InventoryItem.company_id == company_id,
              InventoryItem.id.in_(item_ids)
          )
          .all()
    )
    cat_ids: set[str] = set()
    for it in items:
        for c in it.categories:
            cat_ids.add(str(c.id))
    return cat_ids

def _eligible_by_scope(db: Session, coupon: Coupon, company_id: str, item_ids: Optional[List[UUID]]) -> bool:
    # Se o cupom não restringe por categorias/itens, é global
    has_cat_scope = len(coupon.categories) > 0
    has_item_scope = len(coupon.items) > 0
    if not has_cat_scope and not has_item_scope:
        return True

    # Sem itens no carrinho não tem como provar elegibilidade
    if not item_ids:
        return False

    item_id_str = {str(i) for i in item_ids}
    coupon_item_ids = {str(it.id) for it in coupon.items}
    if item_id_str.intersection(coupon_item_ids):
        return True

    cart_cat_ids = _items_categories_of_cart(db, company_id, item_ids)
    coupon_cat_ids = {str(c.id) for c in coupon.categories}
    if cart_cat_ids.intersection(coupon_cat_ids):
        return True

    return False

def validate_and_optionally_redeem(
    db: Session,
    company_id: str,
    code: str,
    user_id: str,
    amount: float,
    item_ids: Optional[List[UUID]],
    source_lat: Optional[float],
    source_lng: Optional[float],
    source_location_name: Optional[str],
    dry_run: bool = False,
    *,                       
    autocommit: bool = True,
) -> Tuple[bool, Optional[str], Optional[Coupon], Decimal, Optional[CouponRedemption]]:
    """
    Retorna: (valid, reason, coupon, discount, redemption)
    - Em caso de dry_run=True: não grava uso.
    - Com dry_run=False: grava CouponRedemption de forma atômica.
    """
    # 1) trava a linha do cupom para evitar condições de corrida nos limites
    coupon = (
        db.query(Coupon)
          .options(
              selectinload(Coupon.categories),
              selectinload(Coupon.items),
          )
          .filter(Coupon.company_id == company_id, func.lower(Coupon.code) == func.lower(code))
          .with_for_update()
          .first()
    )
    if not coupon:
        return False, "Cupom não encontrado", None, Decimal("0.00"), None

    if not coupon.is_active:
        return False, "Cupom inativo", coupon, Decimal("0.00"), None

    # (opcional) visibilidade costuma afetar listagem, não uso. Se quiser bloquear, descomente:
    # if not coupon.is_visible:
    #     return False, "Cupom não está visível", coupon, Decimal("0.00"), None

    # 2) limites de uso
    # total
    if coupon.usage_limit_total is not None:
        total_used = db.query(func.count(CouponRedemption.id)) \
                       .filter(CouponRedemption.coupon_id == coupon.id).scalar()
        if total_used >= coupon.usage_limit_total:
            return False, "Limite total de usos atingido", coupon, Decimal("0.00"), None

    # por usuário
    if coupon.usage_limit_per_user is not None:
        user_used = db.query(func.count(CouponRedemption.id)) \
                      .filter(
                          CouponRedemption.coupon_id == coupon.id,
                          CouponRedemption.user_id == user_id
                      ).scalar()
        if user_used >= coupon.usage_limit_per_user:
            return False, "Limite de usos por usuário atingido", coupon, Decimal("0.00"), None

    # 3) mínimo de pedido
    amount_dec = _round2(Decimal(str(amount)))
    if coupon.min_order_amount is not None and amount_dec < Decimal(coupon.min_order_amount):
        return False, "Valor mínimo do pedido não alcançado", coupon, Decimal("0.00"), None

    # 4) escopo por itens/categorias
    if not _eligible_by_scope(db, coupon, company_id, item_ids or []):
        return False, "Itens do carrinho não elegíveis para este cupom", coupon, Decimal("0.00"), None

    # 5) calcular desconto
    discount = _compute_discount(amount_dec, coupon)
    if discount <= 0:
        return False, "Cupom não gera desconto neste pedido", coupon, Decimal("0.00"), None

    # nunca permitir desconto > amount
    if discount > amount_dec:
        discount = amount_dec

    if dry_run:
        return True, None, coupon, discount, None

    # 6) gravar resgate
    red = CouponRedemption(
        coupon_id=coupon.id,
        user_id=user_id,
        company_id=company_id,
        amount=amount_dec,
        discount_applied=discount,
        item_ids=[str(i) for i in (item_ids or [])],
        source_location_name=source_location_name,
    )
    if source_lat is not None and source_lng is not None:
        red.redemption_location = WKTElement(f"POINT({source_lng} {source_lat})", srid=4326)

    db.add(red)
    if autocommit:
        db.commit()
        db.refresh(red)
    else:
        db.flush()        # << adiciona
        db.refresh(red)


    return True, None, coupon, discount, red
