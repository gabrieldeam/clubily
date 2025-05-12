# backend/app/services/company_service.py

from typing import Optional
from sqlalchemy.orm import Session
from ..core.security import hash_password, verify_password
from ..models.company import Company
from ..schemas.company import CompanyCreate


def get_by_identifier(db: Session, ident: str) -> Optional[Company]:
    """
    Busca uma empresa pelo email (minusculizado) ou telefone.
    """
    return db.query(Company).filter(
        (Company.email == ident.lower()) | (Company.phone == ident)
    ).first()


def create(db: Session, obj_in: CompanyCreate) -> Company:
    """
    Cria uma nova empresa com dados validados e senha criptografada,
    incluindo CNPJ, endereço e descrição.
    """
    company = Company(
        name=obj_in.name,
        email=obj_in.email.lower(),
        phone=obj_in.phone,
        cnpj=obj_in.cnpj,
        street=obj_in.street,
        city=obj_in.city,
        state=obj_in.state,
        postal_code=obj_in.postal_code,
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
    if not company or not verify_password(password, company.hashed_password):
        return None
    return company
