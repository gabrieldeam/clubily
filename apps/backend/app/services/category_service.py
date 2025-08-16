from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import CategoryCreate
from typing import Tuple, List, Optional

def create_category(db: Session, obj_in: CategoryCreate) -> Category:
    cat = Category(
        name=obj_in.name,
        image_url=obj_in.image_url,
        commission_percent=obj_in.commission_percent
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

def list_categories(db: Session) -> list[Category]:
    return db.query(Category).all()


def list_categories_paginated(
    db: Session,
    page: int = 1,
    size: int = 20,
    q: Optional[str] = None,
) -> Tuple[List[Category], int]:
    query = db.query(Category)

    if q:
        # busca simples por nome (case-insensitive)
        query = query.filter(Category.name.ilike(f"%{q}%"))

    total = query.count()
    items = (
        query.order_by(Category.name.asc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return items, total