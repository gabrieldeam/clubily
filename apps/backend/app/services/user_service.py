from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..models.user import User
from ..core.security import hash_password
from ..schemas.user import UserCreate

# importe seus modelos de relações
from ..models.address import Address
from ..models.cashback import Cashback
# import dinâmico do Referral (porque o nome da FK pode variar entre projetos)
# from ..models.referral import Referral  # veremos via helper

from datetime import datetime


def _move_referrals(db: Session, source_user_id: str, target_user_id: str) -> None:
    """
    Move relações de 'Referral' do usuário source -> target.
    Detecta dinamicamente se o modelo usa 'referrer_id' ou 'user_id'.
    """
    try:
        from app.models.referral import Referral
    except Exception:
        return

    if hasattr(Referral, "referrer_id"):
        (
            db.query(Referral)
              .filter(Referral.referrer_id == source_user_id)
              .update({"referrer_id": target_user_id})
        )
    elif hasattr(Referral, "user_id"):
        (
            db.query(Referral)
              .filter(Referral.user_id == source_user_id)
              .update({"user_id": target_user_id})
        )
    else:
        return

    db.flush()


def _merge_loyalty_cards(db: Session, primary: User, dup: User) -> None:
    """
    Junta os cartões de fidelidade do usuário 'dup' no 'primary',
    somando carimbos até o limite do template e eliminando instâncias duplicadas.
    Também move codes/redemptions para a instância mantida.
    """
    from app.models.loyalty_card import (
        LoyaltyCardInstance,
        LoyaltyCardTemplate,
        LoyaltyCardStamp,
    )

    # todas as instâncias do duplicado
    dup_insts = (
        db.query(LoyaltyCardInstance)
          .filter(LoyaltyCardInstance.user_id == dup.id)
          .all()
    )

    for other in dup_insts:
        # existe uma instância desse template já no primary?
        keep = (
            db.query(LoyaltyCardInstance)
              .filter(
                  LoyaltyCardInstance.user_id == primary.id,
                  LoyaltyCardInstance.template_id == other.template_id,
              )
              .first()
        )

        if not keep:
            # não existe: só transfere a instância inteira para o primary
            other.user_id = primary.id
            db.add(other)
            continue

        # existe instância no primary -> somar carimbos sem passar do limite
        tpl = keep.template
        if not tpl:
            tpl = db.query(LoyaltyCardTemplate).get(keep.template_id)

        already = keep.stamps_given or 0
        other_count = other.stamps_given or 0
        capacity = max(0, (tpl.stamp_total or 0) - already)
        to_add = max(0, min(capacity, other_count))

        # cria novos carimbos na instância 'keep' numerando na sequência
        for i in range(1, to_add + 1):
            seq = already + i
            db.add(
                LoyaltyCardStamp(
                    instance_id=keep.id,
                    stamp_no=seq,
                    given_by_id=None,  # opcional: não sabemos quem deu
                    # given_at = datetime.utcnow()  # se quiser cravar manual
                )
            )

        keep.stamps_given = already + to_add

        # se completou, marca completed_at (se ainda não estava)
        if tpl and keep.stamps_given >= tpl.stamp_total and not keep.completed_at:
            keep.completed_at = datetime.utcnow()

        # mover códigos de carimbo e resgates (se existirem) para a instância 'keep'
        for code in list(getattr(other, "codes", []) or []):
            code.instance_id = keep.id
            db.add(code)

        for rr in list(getattr(other, "redemptions", []) or []):
            rr.instance_id = keep.id
            db.add(rr)

        # elimina a instância duplicada
        db.delete(other)

    db.flush()


def create(db: Session, obj_in: UserCreate) -> User:
    """
    Cria um usuário completo.
    Se existirem leads (pre_registered=True) via e-mail, telefone ou CPF,
    faz merge mantendo:
      - companies
      - addresses
      - cashbacks
      - referrals
      - loyalty cards (somando carimbos até o limite)
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

            # 3.4) Transfere referrals (nome do campo pode variar)
            _move_referrals(db, source_user_id=str(dup.id), target_user_id=str(primary.id))

            # 3.5) Mescla cartões de fidelidade (soma carimbos até o limite)
            _merge_loyalty_cards(db, primary=primary, dup=dup)

            # 3.6) Exclui o lead duplicado
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
    if getattr(obj_in, "company_ids", None):
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


def get_by_email(db: Session, email: str) -> User | None:
    """Retorna o usuário ativo cujo e-mail corresponda (case-insensitive)."""
    return (
        db.query(User)
          .filter(User.email == email.lower(), User.pre_registered == False)
          .first()
    )
