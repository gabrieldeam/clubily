# backend/app/services/user_service.py

from sqlalchemy.orm import Session
from ..models.user import User
from ..core.security import hash_password
from ..schemas.user import UserCreate

def get_by_email_or_phone(db: Session, email: str, phone: str) -> User | None:
    return (
        db.query(User)
        .filter(
            # busca lead pré-cadastrado (pre_registered=True) OU usuário já completo
            ((User.email == email.lower()) | (User.phone == phone))
            & (User.pre_registered == True)
        )
        .first()
    )

def create(db: Session, obj_in: UserCreate) -> User:
    """
    Cria um usuário completo, mas antes tenta reaproveitar
    um lead pré-cadastrado pelo telefone ou e-mail.
    """
    # 1) Tenta encontrar lead pré-cadastrado
    user = get_by_email_or_phone(db, obj_in.email, obj_in.phone or "")
    if not user:
        # se não existir nenhum lead, cria o usuário do zero
        user = User(
            email=obj_in.email.lower(),
            phone=obj_in.phone,
        )
    # 2) Atualiza todos os campos do usuário
    user.name = obj_in.name
    user.hashed_password = hash_password(obj_in.password)
    user.email = obj_in.email.lower()
    user.phone = obj_in.phone
    user.accepted_terms = obj_in.accepted_terms
    user.pre_registered = False

    # 3) (Opcional) vincula múltiplas empresas
    if obj_in.company_ids:
        from app.models.company import Company
        # lista de IDs já vinculados
        current_ids = {c.id for c in user.companies}
        for cid in obj_in.company_ids:
            if cid not in current_ids:
                comp = db.get(Company, cid)
                if comp:
                    user.companies.append(comp)

    # 4) Persiste
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
