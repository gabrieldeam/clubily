# backend/app/services/wallet_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.wallet import Wallet
from decimal import Decimal
from app.models.wallet import UserCashbackWallet

def get_or_create_wallet(db: Session, company_id: str) -> Wallet:
    w = db.query(Wallet).filter_by(company_id=company_id).first()
    if not w:
        w = Wallet(company_id=company_id, balance=Decimal(0))
        db.add(w)
        db.commit()
        db.refresh(w)
    return w

def credit_wallet(db: Session, company_id: str, amount: Decimal) -> Wallet:
    w = get_or_create_wallet(db, company_id)
    w.balance += amount
    db.commit()
    db.refresh(w)
    return w


def get_wallet_balance(db: Session, company_id: str) -> Decimal:
    """
    Retorna o saldo atual da carteira da empresa.
    """
    w = db.query(Wallet).filter_by(company_id=company_id).first()
    return w.balance if w else Decimal("0.00")

def debit_wallet(db: Session, company_id: str, amount: Decimal) -> None:
    """
    Debita `amount` do saldo da carteira da empresa, lançando erro se saldo insuficiente.
    """
    w = (
        db.query(Wallet)
          .filter_by(company_id=company_id)
          .with_for_update()
          .first()
    )
    if not w or w.balance < amount:
        raise ValueError("Saldo insuficiente na carteira da empresa")
    w.balance -= amount
    db.commit()

def get_or_create_user_wallet(
    db: Session, user_id: str, company_id: str
) -> UserCashbackWallet:
    w = (
        db.query(UserCashbackWallet)
          .filter_by(user_id=user_id, company_id=company_id)
          .first()
    )
    if not w:
        w = UserCashbackWallet(
            user_id=user_id,
            company_id=company_id,
            balance=Decimal("0.00")
        )
        db.add(w)
        db.commit()
        db.refresh(w)
    return w

def deposit_to_user_wallet(
    db: Session, user_id: str, company_id: str, amount: float | Decimal
) -> UserCashbackWallet:
    # 1) garante que a carteira existe
    w = get_or_create_user_wallet(db, user_id, company_id)

    # 2) converte amount pra Decimal
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))

    # 3) expira créditos vencidos (se você tiver essa função)
    # expire_overdue_cashbacks(db)

    # 4) verifica saldo
    if w.balance < amount:
        raise ValueError(f"Saldo insuficiente: {w.balance:.2f} disponível, exigido {amount:.2f}")

    # 5) debita normalmente
    if w.balance < amount:
        w.balance = Decimal("0.00")
    else:
        w.balance -= amount

    db.commit()
    db.refresh(w)
    return w

def get_user_wallet(
    db: Session, user_id: str, company_id: str
) -> UserCashbackWallet | None:
    return (
        db.query(UserCashbackWallet)
          .filter_by(user_id=user_id, company_id=company_id)
          .first()
    )

def list_user_wallets(db: Session, user_id: str) -> list[UserCashbackWallet]:
    return (
        db.query(UserCashbackWallet)
          .filter_by(user_id=user_id)
          .all()
    )

def get_user_wallet_summary(db: Session, user_id: str) -> dict:
    """
    Retorna o total de saldo de todas as carteiras do user_id
    e quantas carteiras ele possui.
    """
    total = db.query(func.coalesce(func.sum(UserCashbackWallet.balance), 0))\
              .filter(UserCashbackWallet.user_id == user_id)\
              .scalar() or 0.0
    count = db.query(func.count(UserCashbackWallet.id))\
              .filter(UserCashbackWallet.user_id == user_id)\
              .scalar() or 0
    return {"total_balance": float(total), "wallet_count": int(count)}

def withdraw_user_wallet(
    db: Session,
    user_id: str,
    company_id: str,
    amount: Decimal | float,
) -> UserCashbackWallet:
    """
    Debita `amount` da carteira de cashback do usuário para a empresa.
    Lança ValueError se não houver saldo suficiente.
    """
    # 1) pega ou cria carteira
    w = get_or_create_user_wallet(db, user_id, company_id)

    # 2) converte amount pra Decimal
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))

    # 3) verifica saldo
    if w.balance < amount:
        raise ValueError(f"Saldo insuficiente na carteira do usuário: disponível {w.balance:.2f}, exigido {amount:.2f}")

    # 4) debita
    w.balance -= amount
    db.commit()
    db.refresh(w)
    return w