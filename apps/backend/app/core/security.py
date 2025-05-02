from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt

from .config import settings

# Password Hashing Context (using bcrypt for CPF)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- CPF Hashing --- #

def verify_cpf(plain_cpf: str, hashed_cpf: str) -> bool:
    """Verifies a plain CPF against a stored hash."""
    try:
        return pwd_context.verify(plain_cpf, hashed_cpf)
    except Exception:
        return False

def get_cpf_hash(cpf: str) -> str:
    """Hashes a plain CPF using bcrypt."""
    return pwd_context.hash(cpf)

# --- JWT Token Handling (Example - Adapt if needed, Supabase handles primary auth) --- #

# SECRET_KEY = settings.SECRET_KEY
# ALGORITHM = settings.ALGORITHM
# ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.now(timezone.utc) + expires_delta
#     else:
#         expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt

# def verify_token(token: str, credentials_exception):
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         user_id: Optional[str] = payload.get("sub") # Adjust based on your payload structure
#         if user_id is None:
#             raise credentials_exception
#         # You might want to return a token data model here
#         return user_id
#     except JWTError:
#         raise credentials_exception

