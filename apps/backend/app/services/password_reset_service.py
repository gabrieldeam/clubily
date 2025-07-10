# app/services/password_reset_service.py
import secrets, string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.password_reset_code import PasswordResetCode
from app.models.user import User

ALPHABET = string.digits          # “000000”‒“999999”; troque por string.ascii_uppercase+digits p/ letras

def _generate_code() -> str:
    # garante 6 caracteres, preenchendo com zeros se for só números
    return f"{secrets.randbelow(10**6):06d}"        # “372918”

def create_code(db: Session, user: User, minutes: int = 30) -> str:
    code = _generate_code()

    db.add(
        PasswordResetCode(
            user_id=user.id,
            code=code,
            expires_at=datetime.utcnow() + timedelta(minutes=minutes),
        )
    )
    db.commit()
    return code

def verify_and_consume(db: Session, code: str) -> User | None:
    row = (
        db.query(PasswordResetCode)
          .filter(
              PasswordResetCode.code == code,
              PasswordResetCode.used == False,
              PasswordResetCode.expires_at > datetime.utcnow(),
          )
          .first()
    )
    if not row:
        return None

    row.used = True
    db.commit()
    return db.query(User).get(row.user_id)
