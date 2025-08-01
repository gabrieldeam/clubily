from sqlalchemy.orm import Session
from app.models.post import Post, post_categories
from app.models.block import Block
from app.schemas.post import PostCreate, PostUpdate
from uuid import uuid4
import re

def create_post(db: Session, data: PostCreate) -> Post:
    # 1) Cria a instância e adiciona ao session
    post = Post(
        title=data.title,
        slug=data.slug,
        author_id=data.author_id,
        thumbnail_url=data.thumbnail_url
    )
    db.add(post)
    # 2) Flush para SQLAlchemy atribuir post.id
    db.flush()

    # 3) Agora sim podemos usar post.id ao inserir na tabela associativa
    for cat_id in data.category_ids:
        db.execute(
            post_categories.insert().values(
                post_id=post.id,
                category_id=cat_id
            )
        )

    # 4) Cria os blocos
    for blk in data.blocks:
        db.add(Block(
            id=uuid4(),
            post_id=post.id,
            position=blk.position,
            type=blk.type.value,
            content=blk.content
        ))

    # 5) Commit final
    db.commit()
    db.refresh(post)
    return post

def get_post_by_slug(db: Session, slug: str) -> Post | None:
    return db.query(Post).filter(Post.slug == slug).first()

def generate_unique_slug(db: Session, base_slug: str) -> str:
    """
    Gera um slug único a partir de base_slug.
    Se 'meu-post' já existir, tenta 'meu-post-1', depois 'meu-post-2', etc.
    """
    # normaliza (tira espaços, caracteres inválidos…)
    slug = re.sub(r"[^\w\-]+", "-", base_slug.strip().lower())
    candidate = slug
    idx = 1

    # Enquanto existir um post com esse slug, incrementa
    while get_post_by_slug(db, candidate):
        candidate = f"{slug}-{idx}"
        idx += 1

    return candidate

def get_post(db: Session, post_id):
    return db.query(Post).filter(Post.id == post_id).first()

from sqlalchemy.orm import Session
from app.models.post import Post, post_categories
from app.models.block import Block
from app.schemas.post import PostUpdate
from uuid import uuid4

def update_post(db: Session, post_id: str, data: PostUpdate) -> Post | None:
    post = get_post(db, post_id)
    if not post:
        return None

    # 1) Campos simples
    if data.title is not None:
        post.title = data.title
    if data.slug is not None:
        post.slug = data.slug
    if data.author_id is not None:
        post.author_id = data.author_id
    if data.thumbnail_url is not None:
        post.thumbnail_url = data.thumbnail_url

    # 2) Categorias (N:M)
    if data.category_ids is not None:
        # remove todas as antigas
        db.execute(
            post_categories.delete().where(
                post_categories.c.post_id == post.id
            )
        )
        # adiciona as novas
        for cid in data.category_ids:
            db.execute(
                post_categories.insert().values(
                    post_id=post.id,
                    category_id=cid
                )
            )

    # 3) Blocos
    if data.blocks is not None:
        # apaga todos os blocos antigos
        db.query(Block).filter(Block.post_id == post.id).delete()
        # adiciona cada novo bloco
        for blk in data.blocks:
            db.add(
                Block(
                    id=uuid4(),
                    post_id=post.id,
                    position=blk.position,
                    type=blk.type.value,
                    content=blk.content
                )
            )

    # 4) Persiste tudo
    db.commit()
    db.refresh(post)
    return post


def delete_post(db: Session, post_id):
    post = get_post(db, post_id)
    if post:
        db.delete(post)
        db.commit()
    return post

def search_posts(
    db: Session,
    author_id=None,
    category_id=None,
    q=None,
    page: int = 1,
    page_size: int = 10,
):
    query = db.query(Post)

    if author_id:
        query = query.filter(Post.author_id == author_id)
    if category_id:
        query = query.join(post_categories).filter(
            post_categories.c.category_id == category_id
        )
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(Post.title.ilike(like))

    query = query.order_by(Post.created_at.desc())

    return (
        query.offset((page - 1) * page_size)
             .limit(page_size)
             .all()
    )
