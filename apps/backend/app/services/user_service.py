# backend/app/services/user_service.py

from sqlalchemy.orm import Session
from ..models.user import User
from ..core.security import hash_password
from ..schemas.user import UserCreate
from sqlalchemy import or_

def create(db: Session, obj_in: UserCreate) -> User:
    """
    Cria um usuário completo. Se existir um ou mais leads (pre_registered=True)
    via e-mail, telefone ou CPF, faz o merge desses leads em um único registro,
    reaproveitando-o. Senão, cria um novo usuário do zero.

    - Se encontrar múltiplos leads correspondentes, escolhe o primeiro como "primário",
      transfere para ele todas as empresas dos demais e exclui os duplicados.
    - Depois faz update dos campos obrigatórios (nome, senha, e-mail, telefone, CPF, accepted_terms)
      e marca pre_registered=False.
    - Retorna o registro final (novo ou lead transformado).
    """
    # 1) Normalizar identificadores para busca
    email_lower = obj_in.email.lower()
    phone_norm  = obj_in.phone
    cpf_norm    = obj_in.cpf

    # 2) Buscar todos os leads (pre_registered=True) que casem em e-mail OU telefone OU CPF
    leads_query = (
        db.query(User)
          .filter(User.pre_registered == True)
          .filter(
              or_(
                  User.email == email_lower,
                  User.phone == phone_norm if phone_norm else False,
                  User.cpf   == cpf_norm   if cpf_norm   else False,
              )
          )
    )
    leads: list[User] = leads_query.all()

    if leads:
        # 3) Se houver pelo menos um lead, faça merge
        primary = leads[0]  # vamos reaproveitar este
        # 3.1) Para cada lead extra, transfira empresas e depois exclua
        for duplicate in leads[1:]:
            # transfere empresas que ainda não existam em `primary.companies`
            primary_company_ids = {c.id for c in primary.companies}
            for comp in duplicate.companies:
                if comp.id not in primary_company_ids:
                    primary.companies.append(comp)

            # exclui o usuário duplicado da sessão/banco
            db.delete(duplicate)

        db.commit()
        db.refresh(primary)
        user = primary
    else:
        # 4) Não encontrou lead algum: crie um novo registro mínimo
        user = User(
            email=obj_in.email.lower(),
            phone=obj_in.phone,
            cpf=obj_in.cpf,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 5) Agora `user` é ou o lead unificado ou o novo registro em branco.
    #    Atualize todos os campos que vieram no payload:
    user.name            = obj_in.name
    user.hashed_password = hash_password(obj_in.password)
    user.email           = email_lower
    user.phone           = phone_norm
    user.cpf             = cpf_norm
    user.accepted_terms  = obj_in.accepted_terms
    user.pre_registered  = False  # agora é usuário completo

    # 6) Vincular empresas (se vierem no payload)
    if obj_in.company_ids:
        from app.models.company import Company
        current_ids = {c.id for c in user.companies}
        for cid in obj_in.company_ids:
            if cid not in current_ids:
                comp = db.get(Company, cid)
                if comp:
                    user.companies.append(comp)

    # 7) Persistir as alterações (o `user` já estava no DB)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
