# backend/app/services/user_service.py

from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..models.user import User
from ..core.security import hash_password
from ..schemas.user import UserCreate

# importe seus modelos de relações
from ..models.address import Address
from ..models.cashback import Cashback
from ..models.referral import Referral  # ou como você nomeou essa tabela

def create(db: Session, obj_in: UserCreate) -> User:
    """
    Cria um usuário completo.
    Se existirem leads (pre_registered=True) via e-mail, telefone ou CPF,
    faz merge mantendo:
      - companies
      - addresses
      - cashbacks
      - indicações/referrals
    Senão, cria do zero.
    """
    # 1) Normaliza identificadores
    email_lower = obj_in.email.lower()
    phone_norm  = obj_in.phone
    cpf_norm    = obj_in.cpf

    # 2) Busca todos os leads pré-cadastrados que casem em e-mail, phone ou cpf
    leads = (
        db.query(User)
          .filter(User.pre_registered == True)
          .filter(
              or_(
                  User.email == email_lower,
                  User.phone == phone_norm if phone_norm else False,
                  User.cpf   == cpf_norm   if cpf_norm   else False,
              )
          )
          .all()
    )

    if leads:
        # 3) Merge de leads: escolhe o primeiro como primário
        primary = leads[0]
        for dup in leads[1:]:
            # 3.1) Transfere empresas
            for comp in dup.companies:
                if comp not in primary.companies:
                    primary.companies.append(comp)

            # 3.2) Transfere endereços
            db.query(Address) \
              .filter(Address.user_id == dup.id) \
              .update({ "user_id": primary.id })

            # 3.3) Transfere cashbacks
            db.query(Cashback) \
              .filter(Cashback.user_id == dup.id) \
              .update({ "user_id": primary.id })

            # 3.4) Transfere referrals
            db.query(Referral) \
              .filter(Referral.referrer_id == dup.id) \
              .update({ "referrer_id": primary.id })

            # 3.5) Exclui o lead duplicado
            db.delete(dup)

        db.commit()
        db.refresh(primary)
        user = primary
    else:
        # 4) Não há leads: crie novo usuário já completo
        user = User(
            name            = obj_in.name,
            email           = email_lower,
            hashed_password = hash_password(obj_in.password),
            phone           = phone_norm,
            cpf             = cpf_norm,
            accepted_terms  = obj_in.accepted_terms,
            pre_registered  = False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 5) Atualiza campos obrigatórios (no caso de merge, ou simples criação)
    user.name            = obj_in.name
    user.hashed_password = hash_password(obj_in.password)
    user.email           = email_lower
    user.phone           = phone_norm
    user.cpf             = cpf_norm
    user.accepted_terms  = obj_in.accepted_terms
    user.pre_registered  = False

    # 6) Vincula empresas (se fornecidas)
    if obj_in.company_ids:
        from app.models.company import Company
        existing_ids = {c.id for c in user.companies}
        for cid in obj_in.company_ids:
            if cid not in existing_ids:
                comp = db.get(Company, cid)
                if comp:
                    user.companies.append(comp)

    # 7) Persiste as alterações finais
    db.add(user)
    db.commit()
    db.refresh(user)
    return user