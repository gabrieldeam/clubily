# backend/app/core/security.py

from datetime import datetime, timedelta
from jose import jwt
from argon2 import PasswordHasher
from cryptography.fernet import Fernet
from .config import settings

ph = PasswordHasher()
fernet = Fernet(settings.FERNET_KEY.encode())

ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return ph.verify(hashed, password)

def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
