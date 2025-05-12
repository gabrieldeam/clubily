from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import CategoryCreate

def create_category(db: Session, obj_in: CategoryCreate) -> Category:
    cat = Category(name=obj_in.name, image_url=obj_in.image_url)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

def list_categories(db: Session) -> list[Category]:
    return db.query(Category).all()
