# backend/app/services/auth_service.py

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..core.security import verify_password, create_access_token
from .user_service import User

def get_by_identifier(db: Session, ident: str):
    # tenta e‑mail, telefone, CPF
    from ..core.security import encrypt_cpf
    return (
        db.query(User)
        .filter(
            (User.email == ident.lower()) |
            (User.phone == ident) |
            (User.cpf_enc == encrypt_cpf(ident))
        )
        .first()
    )

def authenticate(db: Session, identifier: str, password: str):
    user = get_by_identifier(db, identifier)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Conta não verificada por e‑mail")
    return create_access_token(str(user.id)), user
