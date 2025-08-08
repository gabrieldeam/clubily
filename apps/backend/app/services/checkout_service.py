from decimal import Decimal
from typing import Tuple
from sqlalchemy.orm import Session, selectinload
from uuid import UUID

from app.services.purchase_log_service import log_purchase
from app.services.coupon_redeem_service import validate_and_optionally_redeem
from app.services.cashback_service import assign_cashback
from app.services.points_rule_service import evaluate_all_rules
from app.models.inventory_item import InventoryItem

def run_checkout(
    db: Session,
    *,
    company_id: str,
    user_id: str,
    amount: float,
    item_ids: list[str] | None,
    branch_id: str | None,
    event: str | None,
    coupon_code: str | None,
    source_lat: float | None,
    source_lng: float | None,
    source_location_name: str | None,
    associate_cashback: bool,
    program_id: str | None,
    stamp_code: str | None,
) -> tuple[str, str | None, str | None, float, float, float]:
    """
    Retorna: (purchase_id, coupon_id, redemption_id, discount, final_amount, points_awarded)
    """
    try:
        # 1) registra compra (garanta que log_purchase NÃO faça commit por conta própria)
        purchase = log_purchase(
            db,
            user_id=user_id,
            company_id=company_id,
            amount=Decimal(str(amount)),
            item_ids=item_ids or [],
        )
        purchase_id = str(getattr(purchase, "id", purchase))

        discount = Decimal("0.00")
        coupon_id = redemption_id = None

        # 2) cupom
        if coupon_code:
            ok, reason, coupon, disc, redemption = validate_and_optionally_redeem(
                db=db,
                company_id=company_id,
                code=coupon_code,
                user_id=user_id,
                amount=amount,
                item_ids=[UUID(i) for i in (item_ids or [])],
                source_lat=source_lat,
                source_lng=source_lng,
                source_location_name=source_location_name,
                dry_run=False,
                autocommit=False,  # NÃO comitar aqui
            )
            if not ok:
                raise ValueError(reason or "Cupom inválido")
            discount = disc
            coupon_id = str(coupon.id)
            redemption_id = str(redemption.id)

        final_amount = Decimal(str(amount)) - discount
        if final_amount < 0:
            final_amount = Decimal("0.00")

        # 3) categorias dos itens (para pontos), igual ao /purchases/evaluate
        product_category_ids = []
        if item_ids:
            items = (
                db.query(InventoryItem)
                  .filter(InventoryItem.id.in_(item_ids))
                  .options(selectinload(InventoryItem.categories))
                  .all()
            )
            product_category_ids = list({ str(cat.id) for it in items for cat in it.categories })

        # 4) pontos (sobre valor final)
        data = {
            "user_id": user_id,
            "amount_spent": float(final_amount),
            "product_categories": product_category_ids,
            "purchased_items": item_ids or [],
            "branch_id": branch_id,
            "event": event,
        }
        points_awarded, _ = evaluate_all_rules(db, user_id, company_id, data)

        # 5) cashback opcional (sobre valor final)
        if associate_cashback:
            if not program_id:
                raise ValueError("program_id obrigatório quando associate_cashback=true")
            assign_cashback(
                db,
                user_id=user_id,
                program_id=program_id,
                amount_spent=float(final_amount),
                autocommit=False,  # NÃO comitar aqui
            )

        # 6) carimbo opcional (se tiver service, chame aqui sem commit)
        # if stamp_code:
        #     admin_stamp_card(db, code=stamp_code, amount=float(final_amount), item_ids=item_ids or [], visit_count=1)

        # Agora sim, 1 commit pra tudo
        db.commit()

        return (
            purchase_id,
            coupon_id,
            redemption_id,
            float(discount),
            float(final_amount),
            float(points_awarded or 0.0),
        )

    except Exception:
        db.rollback()
        raise
