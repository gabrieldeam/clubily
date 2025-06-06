# backend/app/api/v1/endpoints/auth.py

from fastapi import APIRouter, Depends, Query, Response, BackgroundTasks, HTTPException, status
from jose import jwt, JWTError
import re
import app.api.deps as deps
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from ....core.phone_utils import normalize_phone
from ....core.cpf_utils import normalize_cpf
from app.core.security import hash_password, create_access_token  # ← importar create_access_token aqui
from ....schemas.user import UserCreate, LeadCreate, UserRead
from ....schemas.token import Token
from ....services import user_service, auth_service, lead_service
from ....services.sms_service import send_phone_code, verify_phone_code
from ....core.config import settings
from ....core.email_utils import send_email
from app.models.user import User
from app.models.company import Company
from datetime import datetime
from ....services.lead_service import create_or_update_lead

router = APIRouter(tags=["auth"])


@router.post(
    "/pre-register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def pre_register(
    *,
    payload: LeadCreate,
    db: Session = Depends(get_db),
):
    """
    Cria ou atualiza um pré-cadastro (lead) usando telefone ou CPF + company_id.
    Retorna o User (lead) recém-criado ou atualizado.
    """
    # 1) Normaliza telefone e/ou CPF
    if payload.phone:
        payload.phone = normalize_phone(payload.phone)
    if payload.cpf:
        payload.cpf = normalize_cpf(payload.cpf)

    # 2) Chama o serviço que grava/atualiza o lead
    user = create_or_update_lead(db, payload)

    # 3) Retorna o usuário (lead) criado ou atualizado
    return user



@router.get(
    "/pre-registered",
    status_code=status.HTTP_200_OK,
    summary="Verifica se já existe pré-cadastro de telefone/CPF para uma empresa"
)
def is_pre_registered(
    *,
    phone: str | None = Query(None, description="Telefone do lead"),
    cpf: str | None = Query(None, description="CPF do lead"),
    company_id: str = Query(..., description="UUID da empresa"),
    db: Session = Depends(get_db),
):
    """
    Retorna {"pre_registered": true/false} indicando
    se já existe um lead (pre_registered=True) com esse
    telefone OU CPF para a empresa informada.
    """
    if not phone and not cpf:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="É necessário fornecer phone ou cpf para verificar pré‐cadastro"
        )

    # 1) Normaliza
    normalized_phone = None
    normalized_cpf = None
    if phone:
        try:
            normalized_phone = normalize_phone(phone)
        except ValueError:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="Telefone inválido"
            )
    if cpf:
        try:
            normalized_cpf = normalize_cpf(cpf)
        except ValueError:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="CPF inválido"
            )

    # 2) Monta a query
    from sqlalchemy import or_
    q = (
        db.query(User)
          .join(User.companies)
          .filter(
              Company.id == company_id,
              User.pre_registered == True,
              or_(
                  *( [User.phone == normalized_phone] if normalized_phone else [] ),
                  *( [User.cpf == normalized_cpf] if normalized_cpf else [] )
              )
          )
    )

    exists = db.query(q.exists()).scalar()
    return {"pre_registered": exists}


@router.post("/register", response_model=Token, status_code=201)
def register(
    *,
    payload: UserCreate,
    response: Response,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Registra um usuário completo (exige cpf + senha + accepted_terms).
    Reaproveita lead (pre_registered) se existir via phone/cpf/email.
    Retorna JWT no cookie e no JSON.
    """

    # 1) Normaliza telefone e CPF
    payload.phone = normalize_phone(payload.phone) if payload.phone else None
    payload.cpf = normalize_cpf(payload.cpf)

    # 2) Verifica duplicidade de e-mail
    if db.query(User).filter(User.email == payload.email.lower(), User.pre_registered == False).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E‐mail já cadastrado",
        )

    # 3) Verifica duplicidade de telefone (se informado)
    if payload.phone:
        if db.query(User).filter(User.phone == payload.phone, User.pre_registered == False).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Telefone já cadastrado",
            )

    # 4) Verifica duplicidade de CPF
    if db.query(User).filter(User.cpf == payload.cpf, User.pre_registered == False).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF já cadastrado",
        )

    # 5) Tudo certo: cria (ou reaproveita lead) e gera token
    user = user_service.create(db, payload)
    token = create_access_token(str(user.id))

    # 6) Envia e‐mail de verificação em background
    verify_url = f"{settings.FRONTEND_ORIGINS[0]}/verify?token={token}"
    background.add_task(
        send_email,
        to=user.email,
        subject="Confirme seu cadastro",
        html=f"<p>Confirme seu cadastro <a href='{verify_url}'>clicando aqui</a></p>",
    )

    # 7) Seta cookie de autenticação
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.FRONTEND_ORIGINS[0].startswith("https://"),
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {"access_token": token}



@router.post("/login", response_model=Token)
def login(
    *,
    response: Response,
    credentials: dict,
    db: Session = Depends(get_db),
):
    """
    Autentica usuário via e-mail OU telefone OU CPF + senha.
    Retorna JWT no cookie e no JSON.
    """
    identifier = credentials.get("identifier")
    password = credentials.get("password")
    if not identifier or not password:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "identifier e password são obrigatórios",
        )

    token, user = auth_service.authenticate(db, identifier, password)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciais inválidas")

    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"access_token": token}


@router.post("/forgot-password", status_code=202)
def forgot_password(
    *,
    email: str,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Envia link para redefinição de senha, se o e-mail existir.
    """
    user = user_service.get_by_email(db, email.lower())
    if user:
        token, _ = auth_service.authenticate(db, user.email, user.hashed_password)
        reset_url = f"{settings.FRONTEND_ORIGINS[0]}/reset-password?token={token}"
        background.add_task(
            send_email,
            to=user.email,
            subject="Redefinição de senha",
            html=f"<p>Redefina sua senha <a href='{reset_url}'>clicando aqui</a></p>",
        )
    return {"msg": "Se o e-mail existir, enviaremos instruções"}


@router.post(
    "/reset-password",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Reseta a senha do usuário via token enviado por e-mail",
)
def reset_password_user(
    *,
    token: str,
    new_password: str,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Valida o JWT de reset e atualiza o hash da nova senha.
    Em seguida gera um novo access_token e o seta no cookie.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Token inválido")

    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuário não encontrado")

    user.hashed_password = hash_password(new_password)
    db.commit()

    new_token = create_access_token(str(user.id))
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=new_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"access_token": new_token}


@router.get("/verify", status_code=200)
def verify_email(
    *,
    token: str,
    db: Session = Depends(deps.get_db),
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
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
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

    token = create_access_token(str(user.id))
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"access_token": token}


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Encerra sessão do usuário (limpa cookie)"
)
def logout_user(
    response: Response,
    current_user: User = Depends(get_current_user),
):
    """
    Faz logout do usuário limpando o cookie de autenticação.
    """
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
    )
    return
