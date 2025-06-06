# backend/app/services/lead_service.py

import secrets
import re
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.company import Company
from ..core.security import hash_password
from ..schemas.user import LeadCreate

def _generate_dummy_cpf_from_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) >= 11:
        return digits[-11:]
    return digits.zfill(11)

def create_or_update_lead(db: Session, obj: LeadCreate) -> User:
    """
    Cria ou atualiza um usuário com pre_registered=True,
    usando TELEFONE e/ou CPF + company_id.

    - Se encontrar usuário cujo pre_registered=False, NÃO altera esse flag.
    - Se não encontrar nenhum usuário, cria um novo lead:
        • Gera email fake no domínio example.com
        • Gera cpf fake (a partir de phone, se tiver; senão 11 dígitos aleatórios)
        • Marca pre_registered=True
    - Em todos os casos, vincula a empresa a esse usuário (se existir e não já estiver vinculado).
    """

    # DEBUG: imprima os valores de entrada
    print(f"[lead_service] Entrou em create_or_update_lead: phone={obj.phone!r}, cpf={obj.cpf!r}, company_id={obj.company_id!r}")

    # 1) Validação redundante (Pydantic já faz, mas mantemos)
    if not obj.phone and not obj.cpf:
        raise ValueError("É necessário fornecer telefone ou CPF no pré‐cadastro.")

    # 2) Tenta encontrar usuário existente pelo telefone ou CPF
    user = None
    if obj.phone:
        user = db.query(User).filter(User.phone == obj.phone).first()
    if not user and obj.cpf:
        user = db.query(User).filter(User.cpf == obj.cpf).first()

    # 3) Se não existir, cria um novo lead mínimo
    if not user:
        # 3.1) Determina dummy_cpf
        if obj.cpf:
            dummy_cpf = obj.cpf
        elif obj.phone:
            dummy_cpf = _generate_dummy_cpf_from_phone(obj.phone)
        else:
            dummy_cpf = secrets.token_hex(6)[:11]

        # 3.2) Determina fake_email
        if obj.phone:
            base = re.sub(r"\D", "", obj.phone)
        else:
            base = dummy_cpf
        fake_email = f"lead_{base}@example.com"

        # 3.3) Gera senha temporária
        tmp_pwd = secrets.token_urlsafe(16)

        user = User(
            name = f"Lead {base}",
            email = fake_email,
            hashed_password = hash_password(tmp_pwd),
            phone = obj.phone,
            cpf = dummy_cpf,
            accepted_terms = False,
            pre_registered = True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"[lead_service] Novo lead criado: id={user.id}, email={user.email}, cpf={user.cpf}, phone={user.phone}")

    # 4) Vincula a empresa, se informado e ainda não estiver vinculado
    if obj.company_id:
        vinculadas = {c.id for c in user.companies}
        if obj.company_id not in vinculadas:
            company = db.get(Company, obj.company_id)
            if company:
                user.companies.append(company)
                db.commit()
                db.refresh(user)
                print(f"[lead_service] Vinculado lead (id={user.id}) à empresa {obj.company_id}")

    return user
