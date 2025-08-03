from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.schemas.post import PostCreate, PostRead, PostUpdate
from app.services.post_service import (
    create_post, get_post, get_post_by_slug, update_post, delete_post, search_posts, generate_unique_slug,
)
from app.db.deps import get_db
from fastapi import UploadFile, File, Form
from app.utils.file_utils import save_file, delete_file_by_url
import json

router = APIRouter(prefix="/posts", tags=["posts"])

@router.post("/", response_model=PostRead, status_code=status.HTTP_201_CREATED)
def create_post_endpoint(
    title: str = Form(...),
    slug: str = Form(...),
    author_id: str = Form(...),
    category_ids: str = Form(...),  # json list
    blocks: str = Form(...),        # json list
    thumbnail: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    unique_slug = generate_unique_slug(db, slug)
    thumbnail_url = save_file(thumbnail, "posts") if thumbnail else None

    post_data = PostCreate(
        title=title,
        slug=unique_slug,
        author_id=author_id,
        category_ids=json.loads(category_ids),
        blocks=json.loads(blocks),
        thumbnail_url=thumbnail_url,
    )

    return create_post(db, post_data)


@router.get("/{post_id}", response_model=PostRead)
def read(post_id: str, db: Session = Depends(get_db)):
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(404, "Post não encontrado")
    return post

@router.put("/{post_id}", response_model=PostRead)
def update_post_endpoint(
    post_id: str,
    title: str = Form(...),
    slug: str = Form(...),
    author_id: str = Form(...),
    category_ids: str = Form(...),  # JSON string como '["id1","id2"]'
    blocks: str = Form(...),        # JSON string dos blocos
    thumbnail: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    # 1) Busca o post existente
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post não encontrado"
        )

    # 2) Gera um slug único se o usuário tiver modificado
    if slug and slug != post.slug:
        unique_slug = generate_unique_slug(db, slug)
    else:
        unique_slug = post.slug

    # 3) Gerencia o thumbnail: deleta o antigo se houver e recebemos um novo
    thumbnail_url = post.thumbnail_url
    if thumbnail:
        if thumbnail_url:
            delete_file_by_url(thumbnail_url)
        thumbnail_url = save_file(thumbnail, "posts")

    # 4) Prepara os dados de atualização
    update_data = PostUpdate(
        title=title,
        slug=unique_slug,
        author_id=author_id,
        category_ids=json.loads(category_ids),
        blocks=json.loads(blocks),
        thumbnail_url=thumbnail_url,
    )

    # 5) Executa o update via service
    updated = update_post(db, post_id, update_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Falha ao atualizar o post"
        )
    return updated


@router.delete("/{post_id}", response_model=PostRead)
def delete_post_endpoint(post_id: str, db: Session = Depends(get_db)):
    post = get_post(db, post_id)
    if not post:
        raise HTTPException(404, "Post não encontrado")

    # deletar thumbnail
    if post.thumbnail_url:
        delete_file_by_url(post.thumbnail_url)

    return delete_post(db, post_id)

@router.get("/", response_model=list[PostRead])
def list_all(
    author_id: str | None = Query(None),
    category_id: str | None = Query(None),
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return search_posts(db, author_id, category_id, q, page, page_size)

@router.get("/slug/{slug}", response_model=PostRead, status_code=status.HTTP_200_OK)
def read_by_slug(slug: str, db: Session = Depends(get_db)):
    """
    Busca um post pelo seu slug amigável.
    Exemplo: GET /posts/slug/como-usar-fastapi
    """
    post = get_post_by_slug(db, slug)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with slug '{slug}' not found"
        )
    return post