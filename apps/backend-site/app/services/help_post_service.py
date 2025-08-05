from sqlalchemy.orm import Session
from uuid import uuid4
import re
from app.models.help_post import HelpPost, help_post_categories
from app.models.help_block import HelpBlock
from app.schemas.help_post import HelpPostCreate, HelpPostUpdate
from app.models.help_category import HelpCategory
from uuid import UUID
from typing import List

def generate_unique_slug_help(db: Session, base_slug: str) -> str:
    slug = re.sub(r"[^\w\-]+","-", base_slug.strip().lower())
    candidate, idx = slug, 1
    while db.query(HelpPost).filter(HelpPost.slug == candidate).first():
        candidate = f"{slug}-{idx}"
        idx += 1
    return candidate

def create_help_post(db: Session, data: HelpPostCreate) -> HelpPost:
    post = HelpPost(title=data.title, slug=data.slug)
    db.add(post)
    db.flush()
    for cid in data.category_ids:
        db.execute(help_post_categories.insert().values(post_id=post.id, category_id=cid))
    for blk in data.blocks:
        db.add(HelpBlock(
            id=uuid4(),
            post_id=post.id,
            position=blk.position,
            type=blk.type.value,
            content=blk.content
        ))
    db.commit()
    db.refresh(post)
    return post

def get_help_post(db: Session, post_id: UUID) -> HelpPost | None:
    return db.query(HelpPost).filter(HelpPost.id == post_id).first()

def get_help_post_by_slug(db: Session, slug: str) -> HelpPost | None:
    return db.query(HelpPost).filter(HelpPost.slug == slug).first()

def update_help_post(db: Session, post_id: UUID, data: HelpPostUpdate) -> HelpPost | None:
    post = get_help_post(db, post_id)
    if not post:
        return None
    if data.title is not None: post.title = data.title
    if data.slug is not None:  post.slug = data.slug
    if data.category_ids is not None:
        db.execute(help_post_categories.delete().where(help_post_categories.c.post_id == post.id))
        for cid in data.category_ids:
            db.execute(help_post_categories.insert().values(post_id=post.id, category_id=cid))
    if data.blocks is not None:
        db.query(HelpBlock).filter(HelpBlock.post_id == post.id).delete()
        for blk in data.blocks:
            db.add(HelpBlock(
                id=uuid4(), post_id=post.id,
                position=blk.position, type=blk.type.value, content=blk.content
            ))
    db.commit()
    db.refresh(post)
    return post

def delete_help_post(db: Session, post_id: UUID) -> HelpPost | None:
    post = get_help_post(db, post_id)
    if post:
        db.delete(post)
        db.commit()
    return post

def search_help_posts(
    db: Session,
    category_id: UUID | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 10,
):
    query = db.query(HelpPost)
    if category_id:
        query = query.join(help_post_categories).filter(help_post_categories.c.category_id == category_id)
    if q:
        query = query.filter(HelpPost.title.ilike(f"%{q.lower()}%"))
    return (
        query.order_by(HelpPost.created_at.desc())
             .offset((page-1)*page_size).limit(page_size)
             .all()
    )


def get_posts_for_category_tree(
    db: Session,
    category_id: str,
    limit: int = 5
) -> List[HelpPost]:
    # 1) carrega os filhos diretos
    child_ids = (
        db.query(HelpCategory.id)
          .filter(HelpCategory.parent_id == category_id)
          .all()
    )
    # child_ids vira lista de tuples [(UUID,), ...], extrai só os valores
    child_ids = [str(c[0]) for c in child_ids]

    # 2) monta lista de categorias a buscar
    cat_ids = [category_id] + child_ids

    # 3) busca posts que estejam em qualquer uma dessas categorias
    posts = (
        db.query(HelpPost)
          .join(help_post_categories, HelpPost.id == help_post_categories.c.post_id)
          .filter(help_post_categories.c.category_id.in_(cat_ids))
          .order_by(HelpPost.created_at.desc())
          .limit(limit)
          .all()
    )
    return posts