# backend/app/api/v1/endpoints/auth.py

from fastapi import APIRouter, Depends, Response, BackgroundTasks, HTTPException, status
import app.api.deps as deps
from pydantic import EmailStr  
from jose import jwt
from datetime import datetime
import secrets
from app.models.user import User
from app.models.company import Company 
from ....schemas.user import UserCreate, LeadCreate
from ....schemas.token import Token
from ....services import user_service, auth_service, lead_service
from ....services.sms_service import send_phone_code, verify_phone_code
from ....core.config import settings
from ....core.email_utils import send_email

router = APIRouter(tags=["auth"])

@router.post("/pre-register", status_code=202)
def pre_register(
    *,
    payload: LeadCreate,
    db=Depends(deps.get_db),
):
    """
    Cria ou atualiza um pré-cadastro com telefone.
    """
    lead_service.create_or_update_lead(db, payload)
    return {"msg": "Pré-cadastro recebido"}

@router.get("/pre-registered", status_code=200)
def is_pre_registered(
    *,
    email: EmailStr | None = None,
    phone: str | None = None,
    company_id: str,
    db=Depends(deps.get_db),
):
    """
    Verifica se já existe pré-cadastro (lead) para este email/phone E esta empresa.
    """
    from sqlalchemy import and_
    q = db.query(User).join(User.companies)
    if email:
        q = q.filter(User.email == email.lower())
    elif phone:
        q = q.filter(User.phone == phone)
    q = q.filter(Company.id == company_id, User.pre_registered == True)
    exists = db.query(q.exists()).scalar()
    return {"pre_registered": exists}

@router.post("/register", response_model=Token, status_code=201)
def register(
    *,
    payload: UserCreate,
    response: Response,
    background: BackgroundTasks,
    db=Depends(deps.get_db),
):
    """
    Registra um usuário completo, exige aceite de termos.
    Envia e-mail de verificação e retorna um JWT via cookie.
    """
    user = user_service.create(db, payload)
    token = auth_service.create_access_token(str(user.id))

    # envia e-mail de verificação em background
    verify_url = f"{settings.BACKEND_CORS_ORIGINS[0]}/verify?token={token}"
    background.add_task(
        send_email,
        to=user.email,
        subject="Confirme seu cadastro",
        html=f"<p>Confirme seu cadastro <a href='{verify_url}'>clicando aqui</a></p>",
    )

    # seta cookie de autenticação
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"access_token": token}

@router.post("/login", response_model=Token)
def login(
    *,
    response: Response,
    credentials: dict,
    db=Depends(deps.get_db),
):
    """
    Autentica usuário via e-mail ou telefone e senha.
    Retorna JWT + cookie de sessão.
    """
    identifier = credentials.get("identifier")
    password = credentials.get("password")
    if not identifier or not password:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "identifier e password são obrigatórios",
        )
    token, _user = auth_service.authenticate(db, identifier, password)
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
def forgot_password(
    *,
    email: str,
    background: BackgroundTasks,
    db=Depends(deps.get_db),
):
    """
    Envia link para redefinição de senha, se o e-mail existir.
    """
    user = user_service.get_by_email(db, email.lower())
    if user:
        token, _ = auth_service.authenticate(db, user.email, user.hashed_password)
        reset_url = f"{settings.BACKEND_CORS_ORIGINS[0]}/reset-password?token={token}"
        background.add_task(
            send_email,
            to=user.email,
            subject="Redefinição de senha",
            html=f"<p>Redefina sua senha <a href='{reset_url}'>clicando aqui</a></p>",
        )
    return {"msg": "Se o e-mail existir, enviaremos instruções"}

@router.get("/verify", status_code=200)
def verify_email(
    *,
    token: str,
    db=Depends(deps.get_db),
):
    """
    Verifica e marca e-mail como confirmado.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Token inválido")

    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuário não encontrado")

    user.email_verified_at = datetime.utcnow()
    db.commit()
    return {"msg": "E-mail verificado com sucesso"}

@router.post("/request-phone-code", status_code=202)
def request_phone_code(
    *,
    phone: str,
    background: BackgroundTasks,
    db=Depends(deps.get_db),
):
    """
    Gera e envia um código de verificação por SMS usando Twilio Verify.
    """
    background.add_task(send_phone_code, phone)
    return {"msg": "Código enviado por SMS"}

@router.post("/verify-phone-code", response_model=Token)
def verify_phone_code_endpoint(
    *,
    phone: str,
    code: str,
    response: Response,
    db=Depends(deps.get_db),
):
    """
    Verifica o código de SMS via Twilio Verify e autentica o usuário.
    """
    verify_phone_code(phone, code)

    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuário não encontrado")

    user.phone_verified_at = datetime.utcnow()
    db.commit()

    token = auth_service.create_access_token(str(user.id))
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"access_token": token}
