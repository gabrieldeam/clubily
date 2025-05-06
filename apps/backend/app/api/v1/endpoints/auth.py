from fastapi import APIRouter, Depends, Response, status, BackgroundTasks
import app.api.deps as deps
from ....schemas.user import UserCreate
from ....schemas.token import Token
from ....services import user_service, auth_service
from ....core.config import settings
from ....core.email_utils import send_email

router = APIRouter()

@router.post("/register", response_model=Token, status_code=201)
def register(
    *,
    payload: UserCreate,
    response: Response,
    background: BackgroundTasks,
    db=Depends(deps.get_db),
):
    user = user_service.create(db, payload)
    token = auth_service.create_access_token(str(user.id))
    # envia email de verificação
    verify_url = f"{settings.BACKEND_CORS_ORIGINS[0]}/verify?token={token}"
    background.add_task(
        send_email,
        to=user.email,
        subject="Confirme seu cadastro",
        html=f"<p>Confirme <a href='{verify_url}'>clicando aqui</a></p>",
    )
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
    form_data: dict,  # substitua por OAuth2PasswordRequestForm se preferir
    db=Depends(deps.get_db),
):
    token, _user = auth_service.authenticate(db, form_data["email"], form_data["password"])
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
def forgot_password(email: str, background: BackgroundTasks, db=Depends(deps.get_db)):
    user = user_service.get_by_email(db, email.lower())
    if user:
        token, _ = auth_service.authenticate(db, email, user.hashed_password)
        reset_url = f"{settings.BACKEND_CORS_ORIGINS[0]}/reset-password?token={token}"
        background.add_task(
            send_email,
            to=email,
            subject="Redefinição de senha",
            html=f"<p>Reset <a href='{reset_url}'>clicando aqui</a></p>",
        )
    return {"msg": "Se o e‑mail existir, enviaremos instruções"}
