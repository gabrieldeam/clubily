from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..core.security import verify_password, create_access_token
from .user_service import get_by_email

def authenticate(db: Session, email: str, password: str):
    user = get_by_email(db, email.lower())
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Conta não verificada por e‑mail")
    return create_access_token(str(user.id)), user
