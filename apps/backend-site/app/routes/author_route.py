from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.author import AuthorCreate, AuthorRead
from app.services.author_service import (
    create_author, get_author, update_author,
    delete_author, list_authors
)
from app.db.deps import get_db
from fastapi import UploadFile, File, Form
from app.utils.file_utils import save_file, delete_file_by_url

router = APIRouter(prefix="/authors", tags=["authors"])

@router.post("/", response_model=AuthorRead, status_code=status.HTTP_201_CREATED)
def create_author_endpoint(
    name: str = Form(...),
    bio: str = Form(None),
    avatar: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    avatar_url = save_file(avatar, "authors") if avatar else None

    author_in = AuthorCreate(
        name=name,
        bio=bio,
        avatar_url=avatar_url,
    )
    return create_author(db, author_in)

@router.get("/{author_id}", response_model=AuthorRead)
def read_author(
    author_id: str,
    db: Session = Depends(get_db),
):
    author = get_author(db, author_id)
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return author

@router.put("/{author_id}", response_model=AuthorRead)
def update_author_endpoint(
    author_id: str,
    name: str = Form(...),
    bio: str = Form(None),
    avatar: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    author = get_author(db, author_id)
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")

    avatar_url = author.avatar_url
    if avatar:
        if avatar_url:
            delete_file_by_url(avatar_url)
        avatar_url = save_file(avatar, "authors")

    author_in = AuthorCreate(
        name=name,
        bio=bio,
        avatar_url=avatar_url,
    )
    return update_author(db, author_id, author_in)

@router.delete("/{author_id}", response_model=AuthorRead)
def delete_author_endpoint(
    author_id: str,
    db: Session = Depends(get_db),
):
    author = get_author(db, author_id)
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")

    # Remove o avatar físico
    if author.avatar_url:
        delete_file_by_url(author.avatar_url)

    return delete_author(db, author_id)


@router.get("/", response_model=list[AuthorRead])
def list_authors_endpoint(db: Session = Depends(get_db)):
    return list_authors(db)
