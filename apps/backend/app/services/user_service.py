from sqlalchemy.orm import Session
from ..models.user import User
from ..core.security import hash_password, encrypt_cpf, decrypt_cpf
from ..schemas.user import UserCreate
from ..core.config import settings

def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def create(db: Session, obj_in: UserCreate) -> User:
    user = User(
        name=obj_in.name,
        email=obj_in.email.lower(),
        hashed_password=hash_password(obj_in.password),
        company_name=obj_in.company_name,
        phone=obj_in.phone,
        cpf_enc=encrypt_cpf(obj_in.cpf),
        role=obj_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
