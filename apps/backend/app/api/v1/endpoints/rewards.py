# backend/app/api/v1/endpoints/rewards.py

from fastapi import (
    APIRouter, Depends, UploadFile, File, Form,
    Query, HTTPException, status
)
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.api.deps import get_db, get_current_user, require_admin
from app.models.reward_category import RewardCategory
from app.models.reward_product import RewardProduct
from app.models.reward_order import RewardOrder, OrderStatus
from app.schemas.rewards import (
    RewardCategoryCreate, RewardCategoryRead, PaginatedRewardCategory,
    RewardProductCreate, RewardProductUpdate, RewardProductRead, PaginatedRewardProduct,
    RewardOrderCreate, RewardOrderRead, PaginatedRewardOrder
)
from app.services.file_service import save_upload
from app.services.reward_service import (
    create_category, list_categories,
    update_category, delete_category,
    create_product, list_products,
    update_product, delete_product,
    create_order, list_user_orders,
    admin_list_orders, admin_update_order_status
)

router = APIRouter(tags=["rewards"])


# ─── Admin: categorias ─────────────────────────────────────────────────────────

@router.post(
    "/admin/categories",
    response_model=RewardCategoryRead,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: Criar categoria"
)
def admin_create_category(
    payload: RewardCategoryCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    return create_category(db, payload)


@router.get(
    "/admin/categories",
    response_model=PaginatedRewardCategory,
    summary="Admin: Listar categorias (paginado)"
)
def admin_read_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    q = db.query(RewardCategory)
    total = q.count()
    items = (
        q.order_by(RewardCategory.created_at.desc())
         .offset(skip)
         .limit(limit)
         .all()
    )
    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.put(
    "/admin/categories/{category_id}",
    response_model=RewardCategoryRead,
    summary="Admin: Editar categoria"
)
def admin_update_category(
    category_id: UUID,
    payload: RewardCategoryCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    return update_category(db, category_id, payload)


@router.delete(
    "/admin/categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Admin: Excluir categoria"
)
def admin_delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    delete_category(db, category_id)
    return


# ─── Público: categorias ────────────────────────────────────────────────────────

@router.get(
    "/categories",
    response_model=PaginatedRewardCategory,
    summary="Listar categorias disponíveis (paginado)"
)
def read_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(RewardCategory)
    total = q.count()
    items = (
        q.order_by(RewardCategory.created_at.desc())
         .offset(skip)
         .limit(limit)
         .all()
    )
    return {"total": total, "skip": skip, "limit": limit, "items": items}


# ─── Admin: produtos ───────────────────────────────────────────────────────────

@router.post(
    "/admin/products",
    response_model=RewardProductRead,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: Criar produto de recompensa"
)
def admin_create_product(
    name: str = Form(...),
    sku: str = Form(...),
    points_cost: int = Form(...),
    short_desc: Optional[str] = Form(None),
    long_desc: Optional[str]  = Form(None),
    category_ids: str = Form("", description="IDs separados por vírgula"),
    image: UploadFile = File(None),
    pdf: UploadFile   = File(None),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    img_url = save_upload(image, "reward_images") if image else None
    pdf_url = save_upload(pdf, "reward_pdfs") if pdf else None

    payload = RewardProductCreate(
        name=name,
        sku=sku,
        points_cost=points_cost,
        short_desc=short_desc,
        long_desc=long_desc,
        category_ids=[UUID(cid) for cid in category_ids.split(",") if cid]
    )
    return create_product(db, payload, img_url, pdf_url)


@router.get(
    "/admin/products",
    response_model=PaginatedRewardProduct,
    summary="Admin: Listar produtos (paginado)"
)
def admin_read_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    q = db.query(RewardProduct)
    total = q.count()
    items = (
        q.order_by(RewardProduct.created_at.desc())
         .offset(skip)
         .limit(limit)
         .all()
    )
    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.put(
    "/admin/products/{product_id}",
    response_model=RewardProductRead,
    summary="Admin: Editar produto"
)
def admin_update_product(
    product_id: UUID,
    name: str = Form(...),
    sku: str = Form(...),
    points_cost: int = Form(...),
    short_desc: Optional[str] = Form(None),
    long_desc:  Optional[str] = Form(None),
    category_ids: str = Form("", description="IDs separados por vírgula"),
    image: UploadFile = File(None),
    pdf: UploadFile   = File(None),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    img_url = save_upload(image, "reward_images") if image else None
    pdf_url = save_upload(pdf, "reward_pdfs") if pdf else None

    payload = RewardProductUpdate(
        name=name,
        sku=sku,
        points_cost=points_cost,
        short_desc=short_desc,
        long_desc=long_desc,
        category_ids=[UUID(cid) for cid in category_ids.split(",") if cid]
    )
    return update_product(db, product_id, payload, img_url, pdf_url)


@router.delete(
    "/admin/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Admin: Excluir produto"
)
def admin_delete_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    delete_product(db, product_id)
    return


# ─── Público: produtos ─────────────────────────────────────────────────────────

@router.get(
    "/products",
    response_model=PaginatedRewardProduct,
    summary="Listar produtos disponíveis (paginado)"
)
def read_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(RewardProduct)
    total = q.count()
    items = (
        q.order_by(RewardProduct.created_at.desc())
         .offset(skip)
         .limit(limit)
         .all()
    )
    return {"total": total, "skip": skip, "limit": limit, "items": items}


# ─── Usuário: criar e listar pedidos ────────────────────────────────────────────

@router.post(
    "/orders",
    response_model=RewardOrderRead,
    status_code=status.HTTP_201_CREATED,
    summary="Usuário: Criar pedido de recompensa"
)
def make_order(
    order_in: RewardOrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return create_order(db, str(current_user.id), order_in)


@router.get(
    "/orders",
    response_model=PaginatedRewardOrder,
    summary="Usuário: Listar meus pedidos (paginado)"
)
def my_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(RewardOrder).filter_by(user_id=str(current_user.id))
    total = q.count()
    items = (
        q.order_by(RewardOrder.created_at.desc())
         .offset(skip)
         .limit(limit)
         .all()
    )
    return {"total": total, "skip": skip, "limit": limit, "items": items}


# ─── Admin: gerenciar pedidos ──────────────────────────────────────────────────

@router.get(
    "/admin/orders",
    response_model=PaginatedRewardOrder,
    summary="Admin: Listar pedidos (paginado)"
)
def admin_orders(
    status: Optional[OrderStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    q = db.query(RewardOrder)
    if status is not None:
        q = q.filter_by(status=status)
    total = q.count()
    items = (
        q.order_by(RewardOrder.created_at.desc())
         .offset(skip)
         .limit(limit)
         .all()
    )
    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.post(
    "/admin/orders/{order_id}/approve",
    response_model=RewardOrderRead,
    summary="Admin: Aprovar pedido"
)
def approve_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    return admin_update_order_status(db, order_id, approve=True, msg=None)


@router.post(
    "/admin/orders/{order_id}/refuse",
    response_model=RewardOrderRead,
    summary="Admin: Recusar pedido"
)
def refuse_order(
    order_id: UUID,
    reason: str = Form(..., description="Motivo da recusa"),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    return admin_update_order_status(db, order_id, approve=False, msg=reason)
