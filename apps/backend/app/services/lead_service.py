# backend/app/services/lead_service.py

import secrets
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.company import Company
from ..core.security import hash_password
from ..schemas.user import LeadCreate

def create_or_update_lead(db: Session, obj: LeadCreate) -> User:
    if not obj.phone:
        raise ValueError("O campo 'phone' é obrigatório no pré-cadastro.")

    # 1) tenta achar pelo telefone
    user = db.query(User).filter(User.phone == obj.phone).first()

    # 2) se não existe, cria um pre-cadastro “mínimo”
    if not user:
        # gera e-mail único apenas para satisfazer a coluna NOT NULL + UNIQUE
        fake_email = f"lead_{obj.phone}@example.com"
        # senha aleatória só para armazenar (não será usada)
        tmp_pwd = secrets.token_urlsafe(16)
        user = User(
            name=f"Lead {obj.phone}",
            email=fake_email,
            hashed_password=hash_password(tmp_pwd),
            phone=obj.phone,
            accepted_terms=False,
            pre_registered=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 3) vincula a empresa, se não estiver linkado
    if obj.company_id and obj.company_id not in [c.id for c in user.companies]:
        company = db.get(Company, obj.company_id)
        if company:
            user.companies.append(company)
            db.commit()

    return user
