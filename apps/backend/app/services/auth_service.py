# backend/app/services/auth_service.py

from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password, hash_password
from sqlalchemy import or_
import re

def get_by_identifier(db: Session, identifier: str) -> User | None:
    """
    Tenta encontrar um usuário pelo IDENTIFIER, que pode ser:
    - e-mail (contém '@')
    - telefone (dígitos ou com '+55…')
    - cpf (11 dígitos)
    """
    id_norm = identifier.strip()

    # 1) Se tiver '@', considera e-mail
    if "@" in id_norm:
        return db.query(User).filter(User.email == id_norm.lower()).first()

    # 2) Se for 11 dígitos numéricos, considera CPF
    digits = re.sub(r"\D", "", id_norm)
    if len(digits) == 11:
        return db.query(User).filter(User.cpf == digits).first()

    # 3) Senão, considera telefone (já deve estar normalizado por quem chamou)
    return db.query(User).filter(User.phone == id_norm).first()

def authenticate(db: Session, identifier: str, password: str) -> tuple[str, User] | tuple[None, None]:
    """
    Autentica via IDENTIFIER (email/telefone/cpf) + senha.
    Retorna (token, user) em caso de sucesso, ou (None, None) em falha.
    """
    # normalizar candidate
    from app.core.cpf_utils import normalize_cpf  # criaremos essa função em breve
    from app.core.phone_utils import normalize_phone

    # 1) tenta identificar a que tipo pertence
    user = None
    if "@" in identifier:
        user = db.query(User).filter(User.email == identifier.lower()).first()
    else:
        # remove tudo que não for dígito
        digits = re.sub(r"\D", "", identifier)
        if len(digits) == 11:
            # CPF
            cpf_norm = normalize_cpf(digits)
            user = db.query(User).filter(User.cpf == cpf_norm).first()
        else:
            # telefone
            phone_norm = normalize_phone(identifier)
            user = db.query(User).filter(User.phone == phone_norm).first()

    if not user:
        return None, None

    # 2) verifica senha
    if not verify_password(user.hashed_password, password):
        return None, None

    # 3) tudo ok: cria JWT
    from app.core.security import create_access_token
    token = create_access_token(str(user.id))
    return token, user
