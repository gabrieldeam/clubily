# backend/app/api/v1/endpoints/companies.py

from typing import List, Optional
import os, uuid
from fastapi import APIRouter, Depends, Response, BackgroundTasks, HTTPException, status, UploadFile, File, Query
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate as sqlalchemy_paginate
from app.db.session import SessionLocal
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime
from sqlalchemy import or_, and_
from ....schemas.company import CompanyCreate, CompanyRead, CompanyLogin, CompanyUpdate, CompanyReadWithService
from ....schemas.token import Token
from ....services.company_service import create, authenticate
from ....core.config import settings
from ....core.email_utils import send_email, send_templated_email
from jose import jwt
from app.core.security import create_access_token 
from app.models.user import User
from app.models.company import Company
from ....schemas.user import UserRead
from app.models.category import Category
from ...deps import get_current_company, get_db, require_admin
from app.models.association import user_companies
from ....schemas.referral import ReferralRedeem, ReferralRead
from ....services.referral_service import redeem_referral_code
from ....services import company_password_reset_service as comp_reset

router = APIRouter(tags=["companies"])

@router.post(
    "/register",
    response_model=Token,  # agora devolve Token (access_token)
    status_code=status.HTTP_201_CREATED,
)
def register_company(
    payload: CompanyCreate,
    background: BackgroundTasks,
    response: Response,           # para setar o cookie
    db: Session = Depends(get_db),
):
    """
    Registra uma nova empresa e, logo após, gera e devolve um JWT no cookie e no JSON.
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

    # 6) Gera o JWT de sessão e seta no cookie
    token = create_access_token(str(company.id))
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.FRONTEND_ORIGINS[0].startswith("https://"),
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    # 7) envia e-mail de boas-vindas + verificação
    verify_url = f"{settings.FRONTEND_ORIGINS[0]}/verify-email?token={token}"

    background.add_task(
        send_templated_email,
        to=company.email,
        subject="Bem-vindo ao Clubily – Confirme seu e-mail",
        template_name="welcome_company.html",
        company_name=company.name,
        verify_url=verify_url,
        logo_url=f"{settings.FRONTEND_ORIGINS[0]}/static/logo.png",  # opcional
    )


    # 8) Retorna o token no JSON
    return {"access_token": token}

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
def forgot_password_company(
    email: str,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Envia código de 6 dígitos para o e-mail cadastrado da empresa.
    """
    comp = db.query(Company).filter(Company.email == email.lower()).first()
    if comp:
        code = comp_reset.create_code(db, comp, minutes=30)
        html = f"""
        <p>Use o código abaixo para redefinir a senha da sua empresa (válido por 30 min):</p>
        <h2 style="font-family:monospace;">{code}</h2>
        """
        background.add_task(
            send_email,
            to=comp.email,
            subject="Código para redefinição de senha empresarial",
            html=html,
        )
    return {"msg": "Se o e-mail existir, enviaremos instruções."}

# ---------- RESET COM CÓDIGO ----------
@router.post("/reset-password", status_code=200)
def reset_password_company(
    code: str,
    new_password: str,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Reseta a senha da empresa usando o código de verificação de 6 dígitos.
    """
    comp = comp_reset.verify_and_consume(db, code)
    if not comp:
        raise HTTPException(400, "Código inválido ou expirado")

    from app.core.security import hash_password
    comp.hashed_password = hash_password(new_password)
    db.commit()

    # já autentica a empresa
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


@router.get(
    "/clients",
    response_model=List[UserRead],
    summary="Lista paginada de clientes de uma empresa",
)
def list_company_clients(
    skip: int = Query(0, ge=0, description="Quantos registros pular"),
    limit: int = Query(10, ge=1, le=100, description="Máximo de registros a retornar"),
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    """
    Retorna todos os usuários vinculados a esta empresa, com paginação.
    """
    # Faz join na tabela de associação para paginar diretamente no banco
    q = (
        db.query(User)
        .join(user_companies, user_companies.c.user_id == User.id)
        .filter(user_companies.c.company_id == current_company.id)
    )
    users = q.offset(skip).limit(limit).all()
    return users


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
















@router.get("/searchAdmin", response_model=Page[CompanyRead])
def search_companies(
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    postal_code: Optional[str] = Query(None),
    params: Params = Depends(),          # 👈 injeta page & size
    db: Session = Depends(get_db),
):
    """
    Filtra empresas pela combinação de city, state e/ou postal_code.
    Se nenhum parâmetro for passado, retorna todas, paginadas.
    """
    q = db.query(Company)
    if city:
        q = q.filter(Company.city.ilike(f"%{city}%"))
    if state:
        q = q.filter(Company.state.ilike(f"%{state}%"))
    if postal_code:
        q = q.filter(Company.postal_code == postal_code)

    # passa o params para inicializar a paginação corretamente
    return sqlalchemy_paginate(q, params)

@router.get("/search", response_model=List[CompanyRead])
def search_companies(
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    postal_code: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Filtra empresas ativas pela combinação de city, state e/ou postal_code.
    Sempre inclui também as empresas com only_online=True.
    Se nenhum parâmetro for passado, retorna todas as empresas ativas.
    """
    q = db.query(Company).filter(Company.is_active == True)

    # só monta o OR extra se vier AO MENOS um filtro
    if city or state or postal_code:
        conds = []
        if city:
            conds.append(Company.city.ilike(f"%{city}%"))
        if state:
            conds.append(Company.state.ilike(f"%{state}%"))
        if postal_code:
            conds.append(Company.postal_code == postal_code)

        q = q.filter(
            or_(
                Company.only_online == True,
                and_(*conds)
            )
        )

    return q.all()


@router.get(
    "/search-by-category",
    response_model=List[CompanyRead],
    status_code=status.HTTP_200_OK,
    summary="Busca empresas ativas por localização e categoria"
)
def search_companies_by_category(
    category_id: str = Query(..., description="ID da categoria para filtrar"),
    city: Optional[str] = Query(None, description="Parte do nome da cidade"),
    state: Optional[str] = Query(None, description="Parte do nome do estado"),
    postal_code: Optional[str] = Query(None, description="CEP exato"),
    db: Session = Depends(get_db),
):
    """
    Retorna empresas ativas que pertencem à `category_id` e opcionalmente
    filtradas por cidade, estado e/ou CEP. Sempre inclui também as only_online.
    """
    # 1) só ativas e na categoria
    q = (
        db.query(Company)
        .filter(Company.is_active == True)
        .join(Company.categories)
        .filter(Category.id == category_id)
    )

    # 2) aplica OR(only_online, AND(filtros de localização))
    if city or state or postal_code:
        conds = []
        if city:
            conds.append(Company.city.ilike(f"%{city}%"))
        if state:
            conds.append(Company.state.ilike(f"%{state}%"))
        if postal_code:
            conds.append(Company.postal_code == postal_code)

        q = q.filter(
            or_(
                Company.only_online == True,
                and_(*conds)
            )
        )

    return q.distinct().all()

@router.get(
    "/search-by-name",
    response_model=List[CompanyReadWithService],
    status_code=status.HTTP_200_OK,
    summary="Busca empresas ativas por nome e indica se servem o endereço dado"
)
def search_companies_by_name(
    name: str = Query(..., description="Termo de busca no nome da empresa"),
    city: Optional[str] = Query(None, description="Cidade para verificar atendimento"),
    street: Optional[str] = Query(None, description="Rua para verificar atendimento"),
    postal_code: Optional[str] = Query(None, description="CEP para verificar atendimento"),
    db: Session = Depends(get_db),
):
    """
    Procura empresas ativas cujo nome contenha 'name'.
    Se vier endereço (city/street/cep), aplica o mesmo OR para only_online.
    Depois devolve o campo `serves_address` indicando se atende.
    """
    # 1) base: só ativas + nome LIKE
    q = db.query(Company).filter(
        Company.is_active == True,
        Company.name.ilike(f"%{name}%")
    )

    # 2) se vier endereço, aplica OR(only_online, AND(endereço bate))
    if city or street or postal_code:
        conds = []
        if city:
            conds.append(Company.city.ilike(f"%{city}%"))
        if street:
            conds.append(Company.street.ilike(f"%{street}%"))
        if postal_code:
            conds.append(Company.postal_code == postal_code)

        q = q.filter(
            or_(
                Company.only_online == True,
                and_(*conds)
            )
        )

    companies = q.all()
    results: list[dict] = []
    for comp in companies:
        # 3) calcula o flag serves_address
        served = True
        if city and comp.city.lower() != city.lower():
            served = False
        if street and comp.street.lower() != street.lower():
            served = False
        if postal_code and comp.postal_code != postal_code:
            served = False

        # 4) monta o dict com o computed field
        comp_dict = CompanyRead.model_validate(comp).model_dump()
        comp_dict["serves_address"] = served
        results.append(comp_dict)

    return results
























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

    # Se alterou e-mail, trata verificação igual antes...
    if "email" in data:
        new_email = data.pop("email").lower()
        if new_email != company.email:
            company.email = new_email
            company.email_verified_at = None
            token = jwt.encode({"sub": str(company.id)}, settings.SECRET_KEY, algorithm="HS256")
            verify_url = f"{settings.FRONTEND_ORIGINS[0]}/companies/verify-email?token={token}"
            background.add_task(
                send_email,
                to=new_email,
                subject="Verifique seu novo e-mail",
                html=f"<p>Você alterou seu e-mail. Clique <a href='{verify_url}'>aqui</a> para confirmar.</p>",
            )

    # Se vier category_ids, já estava correto...
    if "category_ids" in data:
        ids = data.pop("category_ids")
        cats_result = db.scalars(
            select(Category).where(Category.id.in_(ids))
        )
        cats = cats_result.unique().all()
        company.categories = cats

    # Antes de fazer setattr para todos os campos, pego online_url para converter
    if "online_url" in data:
        # Converte o HttpUrl (ou Url) para string pura
        raw_url = data.pop("online_url")
        company.online_url = str(raw_url)

    # Agora aplica os demais campos diretamente
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
        secure=False,
        samesite="lax",
        path="/",
    )
    return


@router.post(
    "/me/delete-request",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Envia solicitação de exclusão de conta da empresa"
)
def request_company_deletion(
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    current_company: Company = Depends(get_current_company),
):
    """
    A empresa autenticada solicita a exclusão de sua conta.
    Envia um e-mail para o endereço de suporte (settings.EMAIL_FROM)
    contendo as informações básicas da empresa.
    """
    # 1) Monta o corpo do e-mail
    subject = "Solicitação de Exclusão de Conta – Empresa"
    # colete todos os usuários associados (IDs e nomes) para incluir no e-mail
    usuarios = [
        f"{u.id} – {u.name or '(sem nome)'}"
        for u in current_company.users
    ]
    usuarios_str = "<br>".join(usuarios) if usuarios else "Nenhum usuário associado"

    # colete todas as categorias associadas (IDs e nomes) para incluir no e-mail
    categorias = [
        f"{c.id} – {c.name}"
        for c in current_company.categories
    ]
    categorias_str = "<br>".join(categorias) if categorias else "Nenhuma categoria associada"

    html = f"""
    <p>A empresa abaixo solicitou a exclusão de sua conta:</p>
    <ul>
        <li><b>ID:</b> {current_company.id}</li>
        <li><b>Nome:</b> {current_company.name}</li>
        <li><b>E-mail:</b> {current_company.email}</li>
        <li><b>Telefone:</b> {current_company.phone}</li>
        <li><b>CNPJ:</b> {current_company.cnpj}</li>
        <li><b>Endereço:</b> {current_company.street}, {current_company.city} – {current_company.state}, CEP {current_company.postal_code}</li>
        <li><b>Descrição:</b> {current_company.description or '(não informada)'}</li>
        <li><b>Status de Ativação:</b> {"Ativa" if current_company.is_active else "Inativa"}</li>
        <li><b>Usuários associados:</b><br>{usuarios_str}</li>
        <li><b>Categorias associadas:</b><br>{categorias_str}</li>
        <li><b>Data de criação:</b> {current_company.created_at.strftime('%Y-%m-%d %H:%M:%S')}</li>
    </ul>
    <p>Por favor, prossiga com o processo de exclusão conforme as políticas internas.</p>
    """

    # 2) Envia o e-mail em background para o suporte/admin
    background.add_task(
        send_email,
        to=settings.EMAIL_FROM,
        subject=subject,
        html=html,
    )

    return {"msg": "Solicitação de exclusão de conta empresarial enviada. Em breve entraremos em contato."}

@router.post("/redeem-referral", response_model=ReferralRead, status_code=status.HTTP_201_CREATED)
def redeem_referral(
    payload: ReferralRedeem,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    try:
        referral = redeem_referral_code(db, current_company.id, payload.referral_code)
        return referral
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))