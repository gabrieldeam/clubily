# backend/app/api/v1/endpoints/companies.py

from typing import List, Optional
import os, uuid
from fastapi import APIRouter, Depends, Response, BackgroundTasks, HTTPException, status, UploadFile, File, Query
from app.db.session import SessionLocal
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime

from ....schemas.company import CompanyCreate, CompanyRead, CompanyLogin, CompanyUpdate
from ....schemas.token import Token
from ....services.company_service import create, authenticate
from ....core.config import settings
from ....core.email_utils import send_email
from jose import jwt
from app.models.company import Company
from ....schemas.user import UserRead
from app.models.category import Category
from ...deps import get_current_company, get_db, require_admin

router = APIRouter(tags=["companies"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post(
    "/register",
    response_model=CompanyRead,
    status_code=status.HTTP_201_CREATED,
)
def register_company(
    payload: CompanyCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Registra uma nova empresa.
    Verifica:
    - aceitação dos termos (accepted_terms deve ser True)
    - unicidade de email, telefone e CNPJ
    Envia um e-mail de confirmação após criar.
    """
    # 1) Checa aceitação dos termos
    if not payload.accepted_terms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você precisa aceitar os termos de uso para se registrar.",
        )

    # 2) Verifica unicidade de email
    if db.query(Company).filter(Company.email == payload.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma empresa cadastrada com esse e-mail.",
        )

    # 3) Verifica unicidade de telefone
    if db.query(Company).filter(Company.phone == payload.phone).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma empresa cadastrada com esse telefone.",
        )

    # 4) Verifica unicidade de CNPJ
    if db.query(Company).filter(Company.cnpj == payload.cnpj).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma empresa cadastrada com esse CNPJ.",
        )

    # 5) Cria a empresa
    company = create(db, payload)

    # 6) Dispara envio de e-mail de verificação em background
    token = jwt.encode({"sub": str(company.id)}, settings.SECRET_KEY, algorithm="HS256")
    verify_url = f"{settings.BACKEND_CORS_ORIGINS[0]}/companies/verify-email?token={token}"
    background.add_task(
        send_email,
        to=company.email,
        subject="Confirme sua conta empresarial",
        html=f"<p>Clique <a href='{verify_url}'>aqui</a> para confirmar sua conta.</p>",
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
        secure=False,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"access_token": token}

@router.get(
    "/me",
    response_model=CompanyRead,
    status_code=status.HTTP_200_OK,
    summary="Dados da empresa autenticada",
)
def read_current_company(
    current_company: Company = Depends(get_current_company),
):
    """
    Retorna os dados da empresa logada com base no cookie de sessão.
    Se o cookie for inválido ou ausente, devolve 401.
    """
    return current_company

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
        secure=False,
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


@router.post(
    "/{company_id}/activate",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)]
)
def activate_company(
    company_id: str,
    db: Session = Depends(get_db),
):
    comp = db.get(Company, company_id)
    if not comp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa não encontrada")
    comp.is_active = True
    db.commit()
    return

@router.post(
    "/{company_id}/deactivate",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)]
)
def deactivate_company(
    company_id: str,
    db: Session = Depends(get_db),
):
    comp = db.get(Company, company_id)
    if not comp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa não encontrada")
    comp.is_active = False
    db.commit()
    return


@router.post(
    "/logo",
    status_code=status.HTTP_200_OK,
    response_model=dict[str, str],
)
async def upload_company_logo(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    # 1) Valida imagem
    if not image.content_type.startswith("image/"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Envie um arquivo de imagem válido")

    # 2) Define diretório e garante existência
    save_dir = os.path.join(os.getcwd(), "app", "static", "companies")
    os.makedirs(save_dir, exist_ok=True)

    # 3) Se já existia uma logo, apaga o arquivo antigo
    if current_company.logo_url:
        old_filename = os.path.basename(current_company.logo_url)
        old_path = os.path.join(save_dir, old_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                # se falhar, apenas ignore
                pass

    # 4) Gera nome único e salva a nova imagem
    ext = os.path.splitext(image.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    new_path = os.path.join(save_dir, filename)
    content = await image.read()
    with open(new_path, "wb") as f:
        f.write(content)

    # 5) Atualiza logo_url no banco usando a sessão `db`
    public_url = f"/static/companies/{filename}"
    company = db.get(Company, current_company.id)
    if not company:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa não encontrada")
    company.logo_url = public_url

    db.commit()
    db.refresh(company)

    return {"logo_url": public_url}




@router.get("/search", response_model=List[CompanyRead])
def search_companies(
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    postal_code: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Filtra empresas pela combinação de city, state e/ou postal_code.
    Se nenhum parâmetro for passado, retorna todas.
    """
    q = db.query(Company)
    if city:
        q = q.filter(Company.city.ilike(f"%{city}%"))
    if state:
        q = q.filter(Company.state.ilike(f"%{state}%"))
    if postal_code:
        q = q.filter(Company.postal_code == postal_code)
    return q.all()

@router.get(
    "/search-by-category",
    response_model=List[CompanyRead],
    status_code=status.HTTP_200_OK,
    summary="Busca empresas por localização e categoria"
)
def search_companies_by_category(
    category_id: str = Query(..., description="ID da categoria para filtrar"),
    city: Optional[str] = Query(None, description="Parte do nome da cidade"),
    state: Optional[str] = Query(None, description="Parte do nome do estado"),
    postal_code: Optional[str] = Query(None, description="CEP exato"),
    db: Session = Depends(get_db),
):
    """
    Retorna empresas que pertencem à `category_id` e opcionalmente filtradas
    por cidade, estado e/ou CEP.
    """
    q = db.query(Company)
    if city:
        q = q.filter(Company.city.ilike(f"%{city}%"))
    if state:
        q = q.filter(Company.state.ilike(f"%{state}%"))
    if postal_code:
        q = q.filter(Company.postal_code == postal_code)

    # junta com categorias e filtra pela escolhida
    q = q.join(Company.categories).filter(Category.id == category_id)
    q = q.distinct()
    return q.all()

@router.get(
    "/{company_id}/status",
    response_model=dict[str, bool],
    status_code=status.HTTP_200_OK,
    summary="Cheque se a empresa está ativa"
)
def get_company_status(
    company_id: str,
    db: Session = Depends(get_db),
):
    comp = db.get(Company, company_id)
    if not comp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa não encontrada")
    return {"is_active": comp.is_active}

from app.schemas.company import CompanyRead

@router.get(
    "/{company_id}/info",
    response_model=CompanyRead,
    status_code=status.HTTP_200_OK,
    summary="Dados públicos da empresa (logo, categorias, status)"
)
def get_company_info(
    company_id: str,
    db: Session = Depends(get_db),
):
    comp = db.get(Company, company_id)
    if not comp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa não encontrada")
    return comp


@router.patch(
    "/{company_id}",
    response_model=CompanyRead,
    status_code=status.HTTP_200_OK,
    summary="Atualiza campos da empresa (parcial)"
)
def update_company(
    company_id: str,
    payload: CompanyUpdate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    if str(current_company.id) != company_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Permissão negada")

    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa não encontrada")

    data = payload.model_dump(exclude_unset=True)

    # trata mudança de e-mail
    if "email" in data:
        new_email = data.pop("email").lower()
        if new_email != company.email:
            company.email = new_email
            company.email_verified_at = None
            token = jwt.encode({"sub": str(company.id)}, settings.SECRET_KEY, algorithm="HS256")
            verify_url = f"{settings.BACKEND_CORS_ORIGINS[0]}/companies/verify-email?token={token}"
            background.add_task(
                send_email,
                to=new_email,
                subject="Verifique seu novo e-mail",
                html=f"<p>Você alterou seu e-mail. Clique <a href='{verify_url}'>aqui</a> para confirmar.</p>",
            )

    # trata categorias
    if "category_ids" in data:
        ids = data.pop("category_ids")

        # busca categorias e elimina duplicatas por causa de joined eager loads
        cats_result = db.scalars(
            select(Category).where(Category.id.in_(ids))
        )
        cats = cats_result.unique().all()

        company.categories = cats

    # trata logo_url
    if "logo_url" in data:
        company.logo_url = data.pop("logo_url")

    # aplica demais campos
    for field, value in data.items():
        setattr(company, field, value)

    db.commit()
    db.refresh(company)
    return company


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Encerra sessão de empresa (limpa cookie)"
)
def logout_company(
    response: Response,
    current_company: Company = Depends(get_current_company),
):
    """
    Limpa o cookie de autenticação, encerrando a sessão.
    """
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        httponly=True,
        secure=False,      # em prod, coloque True se usar HTTPS
        samesite="lax",
        path="/",
    )
    return
