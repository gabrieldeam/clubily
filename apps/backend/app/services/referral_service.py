# app/services/referral_service.py
import string, secrets
from typing import List
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from app.models.referral import Referral
from app.models.user import User
from app.models.company import Company
from typing import Optional
from fastapi import HTTPException, status

CODE_ALPHABET = string.ascii_uppercase + string.digits
CODE_LENGTH = 8

def generate_referral_code(db: Session, user: User) -> str:
    """
    Gera um código curto único para o user. Se já existir,
    tenta novamente até conseguir gravar.
    """
    while True:
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
        user.referral_code = code
        try:
            db.add(user)
            db.commit()
            return code
        except IntegrityError:
            db.rollback()
            # código colidiu, tenta outro

def get_referral_code(db: Session, user: User) -> Optional[str]:
    """Retorna o referral_code atual do usuário (ou None)."""
    fresh = db.get(User, user.id)
    return fresh.referral_code

def redeem_referral_code(db: Session, company_id: str, code: str) -> Referral:
    """
    A empresa resgata um código de indicação.
    Levanta erro se o código não existir, ou já tiver sido usado por esta empresa.
    """
    user = db.query(User).filter(User.referral_code == code).first()
    if not user:
        raise ValueError("Código de indicação inválido")

    # garante que a empresa existe
    comp = db.get(Company, company_id)
    if not comp:
        raise ValueError("Empresa não encontrada")

    # já existe associação?
    existing = (
        db.query(Referral)
          .filter(Referral.user_id == user.id, Referral.company_id == company_id)
          .first()
    )
    if existing:
        return existing

    # cria nova indicação
    referral = Referral(user_id=user.id, company_id=company_id)
    db.add(referral)
    db.commit()
    db.refresh(referral)
    return referral

def get_companies_by_referral_code(db: Session, code: str) -> List[Company]:
    """
    Dado um código de indicação, retorna todas as empresas
    que foram associadas (indicadas) por esse usuário.
    """
    # 1) busca o usuário que gerou esse código
    user = db.query(User).filter(User.referral_code == code).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código de indicação inválido"
        )

    # 2) busca todas as referências feitas por esse user
    #    e extrai as empresas
    companies = (
        db.query(Company)
          .join(Referral, Referral.company_id == Company.id)
          .filter(Referral.user_id == user.id)
          .all()
    )
    return companies


def list_companies_by_referral_code_paginated(
    db: Session, code: str, skip: int, limit: int
) -> tuple[int, list[Company]]:
    # 1) Localiza o usuário
    user = db.query(User).filter(User.referral_code == code).first()
    if not user:
        raise ValueError("Código de indicação inválido")

    # 2) Query base de Referral → Company
    q = (
        db.query(Referral)
          .options(joinedload(Referral.company))
          .filter(Referral.user_id == user.id)
    )
    total = q.count()

    # 3) Busca paginada e extrai as empresas
    refs = (
        q.order_by(Referral.created_at.desc())
         .offset(skip).limit(limit)
         .all()
    )
    companies = [r.company for r in refs]
    return total, companies