# backend/app/api/deps.py

from fastapi import Depends, Request, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from ..core.config import settings
from ..db.session import SessionLocal
from ..models.user import User, Role
from ..models.company import Company

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(settings.COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sem credenciais")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin apenas")
    return current_user

def get_current_company(request: Request, db: Session = Depends(get_db)) -> Company:
    token = request.cookies.get(settings.COOKIE_NAME)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sem credenciais de empresa")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        comp_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido")

    company = db.query(Company).get(comp_id)
    if not company:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Empresa não encontrada")
    return company