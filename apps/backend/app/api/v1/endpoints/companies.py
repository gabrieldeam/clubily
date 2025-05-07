# backend/app/api/v1/endpoints/companies.py

from typing import List
from fastapi import APIRouter, Depends, Response, BackgroundTasks, HTTPException, status
from app.db.session import SessionLocal
from sqlalchemy.orm import Session
from datetime import datetime

from ....schemas.company import CompanyCreate, CompanyRead, CompanyLogin
from ....schemas.token import Token
from ....services.company_service import create, authenticate
from ....core.config import settings
from ....core.email_utils import send_email
from jose import jwt
from app.models.company import Company
from ....schemas.user import UserRead
from ...deps import get_current_company, get_db

router = APIRouter(prefix="/companies", tags=["companies"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=CompanyRead, status_code=201)
def register_company(
    payload: CompanyCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Registra uma nova empresa.
    """
    company = create(db, payload)
    # enviar email de verificação
    token = jwt.encode({"sub": str(company.id)}, settings.SECRET_KEY, algorithm="HS256")
    verify_url = f"{settings.BACKEND_CORS_ORIGINS[0]}/companies/verify-email?token={token}"
    background.add_task(
        send_email,
        to=company.email,
        subject="Confirme sua conta empresarial",
        html=f"<p>Clique <a href='{verify_url}'>aqui</a> para confirmar.</p>",
    )
    return company

@router.get("/verify-email", status_code=200)
def verify_email_company(token: str, db: Session = Depends(get_db)):
    """
    Endpoint que a empresa chama ao clicar no link de verificação.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        comp_id = payload.get("sub")
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Token inválido")
    company = db.query(Company).get(comp_id)
    if not company:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa não encontrada")
    company.email_verified_at = datetime.utcnow()
    db.commit()
    return {"msg": "E-mail verificado com sucesso."}

@router.post("/login", response_model=Token)
def login_company(
    credentials: CompanyLogin,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Login de empresa via e-mail ou telefone + senha.
    """
    comp = authenticate(db, credentials.identifier, credentials.password)
    if not comp:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciais inválidas")
    token = jwt.encode({"sub": str(comp.id)}, settings.SECRET_KEY, algorithm="HS256")
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"access_token": token}

@router.post("/forgot-password", status_code=202)
def forgot_password_company(email: str, background: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Envia link de reset de senha para e-mail cadastrado.
    """
    comp = db.query(Company).filter(Company.email == email.lower()).first()
    if comp:
        token = jwt.encode({"sub": str(comp.id)}, settings.SECRET_KEY, algorithm="HS256")
        reset_url = f"{settings.BACKEND_CORS_ORIGINS[0]}/companies/reset-password?token={token}"
        background.add_task(
            send_email,
            to=comp.email,
            subject="Redefinição de senha empresarial",
            html=f"<p>Clique <a href='{reset_url}'>aqui</a> para redefinir sua senha.</p>",
        )
    return {"msg": "Se o e-mail existir, enviaremos instruções."}

@router.post("/reset-password", status_code=200)
def reset_password_company(token: str, new_password: str, response: Response, db: Session = Depends(get_db)):
    """
    Reseta a senha da empresa usando token de reset.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        comp_id = payload.get("sub")
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Token inválido")
    comp = db.query(Company).get(comp_id)
    if not comp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa não encontrada")
    from app.core.security import hash_password
    comp.hashed_password = hash_password(new_password)
    db.commit()
    # opcional: já autenticar e devolver token
    new_token = jwt.encode({"sub": str(comp.id)}, settings.SECRET_KEY, algorithm="HS256")
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=new_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"access_token": new_token}


@router.get("/clients", response_model=List[UserRead])
def list_company_clients(
    current_company: Company = Depends(get_current_company),
):
    """
    Retorna todos os usuários (incluindo pre-registrados) vinculados a esta empresa.
    """
    # como usamos relationship(secondary=user_companies), current_company.users já vem populado
    return current_company.users