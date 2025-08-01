from sqlalchemy.orm import Session
from app.models.author import Author
from app.schemas.author import AuthorCreate

def create_author(db: Session, data: AuthorCreate) -> Author:
    author = Author(
        name=data.name,
        bio=data.bio,
        avatar_url=data.avatar_url,
    )
    db.add(author)
    db.commit()
    db.refresh(author)
    return author

def get_author(db: Session, author_id: str) -> Author | None:
    return db.query(Author).filter(Author.id == author_id).first()

def update_author(db: Session, author_id: str, data: AuthorCreate) -> Author | None:
    author = get_author(db, author_id)
    if not author:
        return None
    author.name = data.name
    author.bio = data.bio
    author.avatar_url = data.avatar_url
    db.commit()
    db.refresh(author)
    return author

def delete_author(db: Session, author_id: str) -> Author | None:
    author = get_author(db, author_id)
    if author:
        db.delete(author)
        db.commit()
    return author

def list_authors(db: Session) -> list[Author]:
    return db.query(Author).all()
