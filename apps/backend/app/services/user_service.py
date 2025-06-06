# backend/app/services/user_service.py

from sqlalchemy.orm import Session
from ..models.user import User
from ..core.security import hash_password
from ..schemas.user import UserCreate
from sqlalchemy import or_

def get_by_email_or_phone_or_cpf(db: Session, email: str, phone: str, cpf: str) -> User | None:
    """
    Tenta encontrar um lead (pre_registered=True) via e-mail OU telefone OU cpf.
    """
    query = db.query(User).filter(
        User.pre_registered == True,
        or_(
            User.email == email.lower() if email else False,
            User.phone == phone if phone else False,
            User.cpf == cpf if cpf else False,
        )
    )
    return query.first()

def create(db: Session, obj_in: UserCreate) -> User:
    """
    Cria um usuário completo. Se existir lead (pre_registered=True) via email/phone/cpf,
    reaproveita esse registro; senão, cria do zero.
    """
    # 1) Normalizar campos de busca
    email_lower = obj_in.email.lower()
    phone_norm = obj_in.phone
    cpf_norm = obj_in.cpf

    # 2) Tenta reaproveitar lead pré‐cadastrado
    user = get_by_email_or_phone_or_cpf(db, email_lower, phone_norm or "", cpf_norm or "")
    if not user:
        # cria "do zero"
        user = User(
            email=email_lower,
            phone=phone_norm,
            cpf=cpf_norm,
        )

    # 3) Atualiza todos os campos do usuário
    user.name = obj_in.name
    user.hashed_password = hash_password(obj_in.password)
    user.email = email_lower
    user.phone = phone_norm
    user.cpf = cpf_norm
    user.accepted_terms = obj_in.accepted_terms
    user.pre_registered = False

    # 4) (Opcional) vincula múltiplas empresas
    if obj_in.company_ids:
        from app.models.company import Company
        current_ids = {c.id for c in user.companies}
        for cid in obj_in.company_ids:
            if cid not in current_ids:
                comp = db.get(Company, cid)
                if comp:
                    user.companies.append(comp)

    # 5) Persiste
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
