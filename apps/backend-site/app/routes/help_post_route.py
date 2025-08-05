from fastapi import APIRouter, Depends, HTTPException, status, Query, Form
from fastapi import UploadFile, File
from sqlalchemy.orm import Session
import json
from app.schemas.help_post import HelpPostCreate, HelpPostRead, HelpPostUpdate
from app.services.help_post_service import (
    create_help_post, get_help_post, get_help_post_by_slug,
    update_help_post, delete_help_post, search_help_posts,
    generate_unique_slug_help
)
from app.db.deps import get_db

router = APIRouter(prefix="/help/posts", tags=["help-posts"])

@router.post("/", response_model=HelpPostRead, status_code=status.HTTP_201_CREATED)
def create_post(
    title: str = Form(...),
    slug: str = Form(...),
    category_ids: str = Form(...),
    blocks: str = Form(...),
    db: Session = Depends(get_db),
):
    unique = generate_unique_slug_help(db, slug)
    data = HelpPostCreate(
        title=title,
        slug=unique,
        category_ids=json.loads(category_ids),
        blocks=json.loads(blocks),
    )
    return create_help_post(db, data)

@router.get("/{post_id}", response_model=HelpPostRead)
def read_post(post_id: str, db: Session = Depends(get_db)):
    p = get_help_post(db, post_id)
    if not p:
        raise HTTPException(404, "Post não encontrado")
    return p

@router.get("/slug/{slug}", response_model=HelpPostRead)
def read_post_by_slug(slug: str, db: Session = Depends(get_db)):
    p = get_help_post_by_slug(db, slug)
    if not p:
        raise HTTPException(404, f"Slug '{slug}' não encontrado")
    return p

@router.put("/{post_id}", response_model=HelpPostRead)
def update_post(
    post_id: str,
    title: str = Form(...),
    slug: str = Form(...),
    category_ids: str = Form(...),
    blocks: str = Form(...),
    db: Session = Depends(get_db),
):
    existing = get_help_post(db, post_id)
    if not existing:
        raise HTTPException(404, "Post não encontrado")
    unique = existing.slug if slug == existing.slug else generate_unique_slug_help(db, slug)
    data = HelpPostUpdate(
        title=title, slug=unique,
        category_ids=json.loads(category_ids),
        blocks=json.loads(blocks)
    )
    updated = update_help_post(db, post_id, data)
    return updated

@router.delete("/{post_id}", response_model=HelpPostRead)
def delete_post(post_id: str, db: Session = Depends(get_db)):
    p = get_help_post(db, post_id)
    if not p:
        raise HTTPException(404, "Post não encontrado")
    return delete_help_post(db, post_id)

@router.get("/", response_model=list[HelpPostRead])
def list_posts(
    category_id: str | None = Query(None),
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return search_help_posts(db, category_id, q, page, page_size)
