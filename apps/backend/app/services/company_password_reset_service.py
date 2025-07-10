# app/services/company_password_reset_service.py
import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.company_password_reset_code import CompanyPasswordResetCode
from app.models.company import Company

def _gen_code() -> str:
    return f"{secrets.randbelow(10**6):06d}"     # “000000”-“999999”

def create_code(db: Session, company: Company, minutes: int = 30) -> str:
    code = _gen_code()
    db.add(
        CompanyPasswordResetCode(
            company_id=company.id,
            code=code,
            expires_at=datetime.utcnow() + timedelta(minutes=minutes),
        )
    )
    db.commit()
    return code

def verify_and_consume(db: Session, code: str) -> Company | None:
    row = (
        db.query(CompanyPasswordResetCode)
          .filter(
              CompanyPasswordResetCode.code == code,
              CompanyPasswordResetCode.used == False,
              CompanyPasswordResetCode.expires_at > datetime.utcnow(),
          )
          .first()
    )
    if not row:
        return None
    row.used = True
    db.commit()
    return db.query(Company).get(row.company_id)
