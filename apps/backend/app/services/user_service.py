# backend/app/services/user_service.py

from sqlalchemy.orm import Session
from ..models.user import User
from ..core.security import hash_password
from ..schemas.user import UserCreate

def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def create(db: Session, obj_in: UserCreate) -> User:
    user = db.query(User).filter(User.email == obj_in.email.lower()).first()
    if not user:
        user = User(email=obj_in.email.lower())
    # atualiza campos básicos
    user.name = obj_in.name
    user.hashed_password = hash_password(obj_in.password)
    user.phone = obj_in.phone
    user.accepted_terms = obj_in.accepted_terms
    user.pre_registered = False

    # vincula multiplas empresas
    if obj_in.company_ids:
        # buscar cada Company e anexar
        from app.models.company import Company
        valid_ids = {c.id for c in user.companies}
        for cid in obj_in.company_ids:
            if cid not in valid_ids:
                comp = db.get(Company, cid)
                if comp:
                    user.companies.append(comp)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user
