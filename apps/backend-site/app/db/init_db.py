# app/db/init_db.py
from .session import engine
from .base import Base

def init_db() -> None:
    # Cria todas as tabelas que ainda não existam
    Base.metadata.create_all(bind=engine)
