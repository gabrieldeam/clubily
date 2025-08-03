from sqlalchemy.orm import Session, selectinload
from app.models.category import Category
from app.schemas.category import CategoryCreate

def get_category_by_name(db: Session, name: str) -> Category | None:
    return db.query(Category).filter(Category.name == name).first()

def create_category(db: Session, data: CategoryCreate) -> Category:
    category = Category(
        name=data.name,
        parent_id=data.parent_id,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

def get_category(db: Session, category_id: str) -> Category | None:
    return db.query(Category).filter(Category.id == category_id).first()

def update_category(db: Session, category_id: str, data: CategoryCreate) -> Category | None:
    category = get_category(db, category_id)
    if not category:
        return None
    category.name = data.name
    category.parent_id = data.parent_id
    db.commit()
    db.refresh(category)
    return category

def delete_category(db: Session, category_id: str) -> Category | None:
    category = get_category(db, category_id)
    if category:
        db.delete(category)
        db.commit()
    return category

def list_categories(db: Session) -> list[Category]:
    return (
        db.query(Category)
          .options(selectinload(Category.children))
          .all()
    )