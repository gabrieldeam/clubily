# app/services/reward_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from uuid import UUID
from typing import List
from app.models import (
    RewardCategory, RewardProduct, reward_product_categories,
    RewardOrder, RewardOrderItem, UserPointsWallet,
    UserPointsTransaction, UserPointsTxType, OrderStatus
)
from app.schemas.rewards import RewardCategoryCreate, RewardProductUpdate, RewardProductCreate

# ---------- Categorias ----------
def create_category(db: Session, data):
    cat = RewardCategory(**data.model_dump())
    db.add(cat); db.commit(); db.refresh(cat)
    return cat

def list_categories(db: Session):
    return db.query(RewardCategory).all()

def update_category(db: Session, category_id: UUID, payload: RewardCategoryCreate) -> RewardCategory:
    cat = db.get(RewardCategory, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    # não permite editar se estiver associada a algum produto
    used = db.query(RewardProduct).filter(RewardProduct.categories.any(id=category_id)).first()
    if used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível editar: categoria já está associada a um produto"
        )
    cat.name = payload.name
    cat.slug = payload.slug
    db.commit()
    db.refresh(cat)
    return cat

def delete_category(db: Session, category_id: UUID):
    cat = db.get(RewardCategory, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    used = db.query(RewardProduct).filter(RewardProduct.categories.any(id=category_id)).first()
    if used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir: categoria associada a um produto"
        )
    db.delete(cat)

# ---------- Produtos ----------
def create_product(db: Session, payload, image_url, pdf_url):
    cat_ids = payload.category_ids
    prod = RewardProduct(
        **payload.model_dump(exclude={"category_ids"}),
        image_url=image_url,
        pdf_url=pdf_url
    )
    if cat_ids:
        cats = db.query(RewardCategory).filter(RewardCategory.id.in_(cat_ids)).all()
        prod.categories = cats
    db.add(prod); db.commit(); db.refresh(prod)
    return prod

def list_products(db: Session):
    return db.query(RewardProduct).all()

def update_product(
    db: Session,
    product_id: UUID,
    payload: RewardProductUpdate,
    image_url: str | None = None,
    pdf_url:   str | None = None
) -> RewardProduct:
    prod = db.get(RewardProduct, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    # não permite editar se já foi pedido
    used = db.query(RewardOrderItem).filter_by(product_id=product_id).first()
    if used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível editar: produto já foi solicitado em um pedido"
        )
    prod.name        = payload.name
    prod.sku         = payload.sku
    prod.points_cost = payload.points_cost
    prod.short_desc  = payload.short_desc
    prod.long_desc   = payload.long_desc
    if image_url is not None:
        prod.image_url = image_url
    if pdf_url is not None:
        prod.pdf_url   = pdf_url
    # atualizar categorias
    cats = db.query(RewardCategory).filter(RewardCategory.id.in_(payload.category_ids)).all()
    prod.categories = cats
    db.commit()
    db.refresh(prod)
    return prod

# — excluir produto —
def delete_product(db: Session, product_id: UUID):
    prod = db.get(RewardProduct, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    used = db.query(RewardOrderItem).filter_by(product_id=product_id).first()
    if used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir: produto já foi solicitado em um pedido"
        )
    db.delete(prod)
    db.commit()
    
# ---------- Pedidos ----------
def create_order(db: Session, user_id: str, order_in):
    # 1) calcula custo total em pontos
    prod_map = {
        str(p.id): p for p in
        db.query(RewardProduct).filter(
            RewardProduct.id.in_([i.product_id for i in order_in.items])
        ).all()
    }

    total_cost = 0
    for it in order_in.items:
        p = prod_map.get(str(it.product_id))
        if not p:
            raise HTTPException(404, "Produto não encontrado")
        total_cost += p.points_cost * it.quantity

    # 2) verifica saldo
    wallet = db.query(UserPointsWallet).filter_by(user_id=user_id).first()
    if not wallet or wallet.balance < total_cost:
        raise HTTPException(400, "Saldo insuficiente")

    # 3) debita e grava transação
    wallet.balance -= total_cost
    tx = UserPointsTransaction(
        wallet_id = wallet.id,
        user_id   = user_id,
        company_id= None,           # prêmio é global
        rule_id   = None,
        type      = UserPointsTxType.redeem,
        amount    = -total_cost,
        description = "Resgate loja de prêmios"
    )
    db.add(tx)

    # 4) cria pedido
    order = RewardOrder(
        user_id = user_id,
        **order_in.model_dump(exclude={"items"})
    )
    db.add(order); db.flush()  # preenche order.id

    # 5) itens do pedido
    for it in order_in.items:
        db.add(
            RewardOrderItem(
                order_id = order.id,
                product_id = it.product_id,
                quantity = it.quantity
            )
        )

    db.commit(); db.refresh(order)
    return order

def list_user_orders(db: Session, user_id: str):
    return (
        db.query(RewardOrder)
          .filter_by(user_id=user_id)
          .order_by(RewardOrder.created_at.desc())
          .all()
    )

def admin_list_orders(db: Session, status: OrderStatus|None):
    q = db.query(RewardOrder).order_by(RewardOrder.created_at.desc())
    if status:
        q = q.filter_by(status=status)
    return q.all()

def admin_update_order_status(db: Session, order_id: UUID, approve: bool, msg: str|None):
    order = db.get(RewardOrder, order_id)
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    if order.status != OrderStatus.pending:
        raise HTTPException(400, "Pedido já processado")

    order.status = OrderStatus.approved if approve else OrderStatus.refused
    order.refusal_msg = msg
    db.commit(); db.refresh(order)
    if approve:
        # Aqui você avisaria usuário, dispararia e-mail etc.
        pass
    else:
        # Em caso de recusa você **não** devolve pontos automaticamente;
        # se quiser devolver, crie uma transação contrária aqui.
        pass
    return order
