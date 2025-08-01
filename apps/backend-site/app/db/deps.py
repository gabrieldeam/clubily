# app/db/deps.py

from .session import SessionLocal

def get_db():
    """
    Dependência do FastAPI para obter uma sessão SQLAlchemy.
    Usa yield para que a sessão seja fechada automaticamente.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
