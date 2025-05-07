# backend/app/services/lead_service.py

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.company import Company
from app.models.association import user_companies
from ..schemas.user import LeadCreate

def create_or_update_lead(db: Session, obj: LeadCreate) -> User:
    user = None
    # busca por e-mail ou telefone
    if obj.email:
        user = db.query(User).filter(User.email == obj.email.lower()).first()
    elif obj.phone:
        user = db.query(User).filter(User.phone == obj.phone).first()

    if not user:
        user = User(email=obj.email.lower() if obj.email else None,
                    phone=obj.phone)
        db.add(user)
        db.commit()
        db.refresh(user)

    # vincula a empresa, se ainda não tiver
    if obj.company_id and obj.company_id not in [c.id for c in user.companies]:
        company = db.get(Company, obj.company_id)
        if company:
            user.companies.append(company)
            db.commit()

    return user