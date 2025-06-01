# backend/app/api/v1/endpoints/users.py

from fastapi import APIRouter, Depends, Query, status, BackgroundTasks, HTTPException
from sqlalchemy import select
from typing import List
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from jose import jwt
from app.core.config import settings
from app.core.email_utils import send_email
from app.core.security import hash_password
from app.models.company import Company
from ....schemas.company import CompanyRead
from ....models.user import User
from ....schemas.user import UserRead, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch(
    "/me",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    summary="Atualiza dados parciais do usuário",
)
def update_me(
    payload: UserUpdate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Atualiza apenas os campos enviados do usuário logado.
    Se o e-mail mudar, zera a verificação e envia novo e-mail.
    """
    # 1) Recarrega instância na sessão do DB
    user = db.get(User, current_user.id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuário não encontrado")

    data = payload.model_dump(exclude_unset=True)

    # 2) Se mudou o e-mail, zera verificação e dispara e-mail novo
    if "email" in data:
        new_email = data.pop("email").lower()
        if new_email != user.email:
            user.email = new_email
            user.email_verified_at = None
            token = jwt.encode({"sub": str(user.id)}, settings.SECRET_KEY, algorithm="HS256")
            verify_url = f"{settings.FRONTEND_ORIGINS[0]}/verify?token={token}"
            background.add_task(
                send_email,
                to=new_email,
                subject="Confirme seu novo e-mail",
                html=f"<p>Clique <a href='{verify_url}'>aqui</a> para confirmar seu novo e-mail.</p>",
            )

    # 3) Se veio senha, hash e atualiza
    if "password" in data:
        user.hashed_password = hash_password(data.pop("password"))

    # 4) Se vier company_ids, busca e atualiza relacionamentos
    if "company_ids" in data:
        ids = data.pop("company_ids")
        comps = db.scalars(select(Company).where(Company.id.in_(ids))).all()
        user.companies = comps

    # 5) Aplica os demais campos (name, phone)
    for field, value in data.items():
        setattr(user, field, value)

    # 6) Persiste e retorna
    db.commit()
    db.refresh(user)
    return user



@router.get(
    "/me/companies",
    response_model=List[CompanyRead],
    summary="Lista paginada de empresas do usuário",
)
def read_my_companies(
    page: int = Query(1, ge=1, description="Número da página"),
    page_size: int = Query(10, ge=1, le=100, description="Tamanho da página"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna uma página de empresas (CompanyRead) às quais
    o usuário autenticado está vinculado.
    """
    # cálculo de offset
    skip = (page - 1) * page_size

    # consulta paginada diretamente no banco (mais eficiente que fatiar a lista já carregada)
    companies = (
        db.query(Company)
          .join(User.companies)
          .filter(User.id == current_user.id)
          .offset(skip)
          .limit(page_size)
          .all()
    )

    if not companies and page != 1:
        # opcional: avisa se página fora do alcance
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            f"Página {page} não contém resultados."
        )

    return companies

@router.post(
    "/me/delete-request",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Envia solicitação de exclusão de conta do usuário"
)
def request_user_deletion(
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    O usuário autenticado solicita a exclusão de sua conta.
    Envia um e-mail para o endereço de suporte (settings.EMAIL_FROM)
    contendo as informações básicas do usuário.
    """
    # 1) Monta o corpo do e-mail
    subject = "Solicitação de Exclusão de Conta – Usuário"
    # colete todas as empresas associadas (IDs e nomes) para incluir no e-mail
    empresas = [
        f"{c.id} – {c.name}"
        for c in current_user.companies
    ]
    empresas_str = "<br>".join(empresas) if empresas else "Nenhuma empresa associada"

    html = f"""
    <p>O usuário abaixo solicitou a exclusão de sua conta:</p>
    <ul>
        <li><b>ID:</b> {current_user.id}</li>
        <li><b>Nome:</b> {current_user.name or '(não informado)'}</li>
        <li><b>E-mail:</b> {current_user.email or '(não informado)'}</li>
        <li><b>Telefone:</b> {current_user.phone or '(não informado)'}</li>
        <li><b>Empresas associadas:</b><br>{empresas_str}</li>
        <li><b>Data de cadastro:</b> {current_user.created_at.strftime('%Y-%m-%d %H:%M:%S')}</li>
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

    return {"msg": "Solicitação de exclusão de conta enviada. Em breve entraremos em contato."}