# backend/app/services/company_service.py

from typing import Optional
from sqlalchemy.orm import Session
from ..core.security import hash_password, verify_password
from ..models.company import Company
from ..schemas.company import CompanyCreate


def get_by_identifier(db: Session, ident: str) -> Optional[Company]:
    """
    Busca uma empresa pelo email (minúsculo) ou telefone.
    """
    return db.query(Company).filter(
        (Company.email == ident.lower()) | (Company.phone == ident)
    ).first()


def create(db: Session, obj_in: CompanyCreate) -> Company:
    """
    Cria uma nova empresa com todos os campos, incluindo:
    - endereço físico (street, number, neighborhood, complement, city, state, postal_code)
    - URL online (online_url) e flag only_online
    - aceita termos, descrição, senha criptografada etc.
    """
    company = Company(
        name=obj_in.name,
        email=obj_in.email.lower(),
        phone=obj_in.phone,
        cnpj=obj_in.cnpj,
        # Endereço completo:
        street=obj_in.street,
        number=obj_in.number,
        neighborhood=obj_in.neighborhood,
        complement=obj_in.complement,
        city=obj_in.city,
        state=obj_in.state,
        postal_code=obj_in.postal_code,

        # Converter o HttpUrl em string antes de salvar:
        online_url=str(obj_in.online_url) if obj_in.online_url else None,
        only_online=obj_in.only_online,

        accepted_terms=obj_in.accepted_terms,
        description=obj_in.description,
        hashed_password=hash_password(obj_in.password),
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def authenticate(db: Session, identifier: str, password: str) -> Optional[Company]:
    """
    Verifica credenciais de uma empresa (email ou telefone + senha).
    Retorna a instância de Company se válido, ou None.
    """
    company = get_by_identifier(db, identifier)
    if not company or not verify_password(company.hashed_password, password):
        return None
    return company
