from sqlalchemy.orm import Session, selectinload
from app.models.help_category import HelpCategory
from app.schemas.help_category import HelpCategoryCreate, HelpCategoryTree
from uuid import UUID
from app.models.help_post import HelpPost, help_post_categories
from typing import Optional

def list_help_categories(db: Session) -> list[HelpCategory]:
    return db.query(HelpCategory).options(selectinload(HelpCategory.children)).all()

def get_help_category(db: Session, category_id: UUID) -> HelpCategory | None:
    return db.query(HelpCategory).filter(HelpCategory.id == category_id).first()

def create_help_category(db: Session, data: HelpCategoryCreate) -> HelpCategory:
    cat = HelpCategory(name=data.name, parent_id=data.parent_id)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

def update_help_category(db: Session, category_id: UUID, data: HelpCategoryCreate) -> HelpCategory | None:
    cat = get_help_category(db, category_id)
    if not cat:
        return None
    cat.name = data.name
    cat.parent_id = data.parent_id
    db.commit()
    db.refresh(cat)
    return cat

def delete_help_category(db: Session, category_id: UUID) -> HelpCategory | None:
    cat = get_help_category(db, category_id)
    if cat:
        db.delete(cat)
        db.commit()
    return cat

def list_help_category_tree(db: Session) -> list[HelpCategory]:
    """
    Retorna apenas as categorias raiz (parent_id is NULL)
    com suas sub-categorias carregadas em .children
    """
    return (
        db.query(HelpCategory)
          .options(selectinload(HelpCategory.children))
          .filter(HelpCategory.parent_id == None)
          .all()
    )

def get_category_tree_with_posts(
    db: Session,
    category_id: str
) -> Optional[HelpCategoryTree]:
    # carrega recursivamente filhos imediatos
    root = (
        db.query(HelpCategory)
          .options(selectinload(HelpCategory.children))
          .filter(HelpCategory.id == category_id)
          .first()
    )
    if not root:
        return None

    def build(cat: HelpCategory) -> HelpCategoryTree:
        # carrega todos os posts desta categoria
        posts = (
            db.query(HelpPost)
              .join(help_post_categories, HelpPost.id == help_post_categories.c.post_id)
              .filter(help_post_categories.c.category_id == cat.id)
              .order_by(HelpPost.created_at.desc())
              .all()
        )
        node = HelpCategoryTree.from_orm(cat)
        node.posts = posts  # Pydantic vai converter via HelpPostRead
        # monta cada filho
        for child in cat.children:
            node.children.append(build(child))
        return node

    return build(root)