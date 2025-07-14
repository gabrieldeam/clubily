# backend/app/services/wallet_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.wallet import Wallet
from decimal import Decimal
from app.models.wallet import UserCashbackWallet
from app.models.wallet_transaction import WalletTransaction
from app.models.credits_wallet_transaction import CreditsWalletTransaction, CreditTxType


def get_or_create_wallet(db: Session, company_id: str) -> Wallet:
    w = db.query(Wallet).filter_by(company_id=company_id).first()
    if not w:
        w = Wallet(company_id=company_id, balance=Decimal(0))
        db.add(w)
        db.commit()
        db.refresh(w)
    return w


def get_wallet_balance(db: Session, company_id: str) -> Decimal:
    """
    Retorna o saldo atual da carteira da empresa.
    """
    w = db.query(Wallet).filter_by(company_id=company_id).first()
    return w.balance if w else Decimal("0.00")

def credit_wallet(
    db: Session,
    company_id: str,
    amount: Decimal,
    description: str | None = None
) -> Wallet:
    w = get_or_create_wallet(db, company_id)
    w.balance += amount

    tx = CreditsWalletTransaction(
        wallet_id=w.id,
        company_id=company_id,
        type=CreditTxType.CREDIT,
        amount=amount,
        description=description,
    )
    db.add(tx)
    db.commit()
    db.refresh(w)
    return w


def debit_wallet(
    db: Session,
    company_id: str,
    amount: Decimal,
    description: str | None = None
) -> Wallet:
    w = (
        db.query(Wallet)
          .filter_by(company_id=company_id)
          .with_for_update()
          .first()
    )
    if not w or w.balance < amount:
        raise ValueError("Saldo insuficiente na carteira da empresa")

    w.balance -= amount
    tx = CreditsWalletTransaction(
        wallet_id=w.id,
        company_id=company_id,
        type=CreditTxType.DEBIT,
        amount=amount,
        description=description,
    )
    db.add(tx)
    db.commit()
    db.refresh(w)
    return w



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
    db: Session,
    user_id: str,
    company_id: str,
    amount: float | Decimal
) -> UserCashbackWallet:
    """
    Credita `amount` na carteira de cashback do usuário (para aquela empresa)
    e grava uma transação de crédito.
    """
    # 1) garante que a carteira existe
    w = get_or_create_user_wallet(db, user_id, company_id)

    # 2) converte amount pra Decimal
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))

    # 3) atualiza saldo
    w.balance += amount
    db.commit()
    db.refresh(w)

    # 4) grava histórico
    record_wallet_transaction(
        db=db,
        user_id=user_id,
        company_id=company_id,
        tx_type="credit",
        amount=amount,
        description="Recebimento de cashback"
    )

    return w

def withdraw_user_wallet(
    db: Session,
    user_id: str,
    company_id: str,
    amount: float | Decimal,
    description: str = "Uso de cashback",
) -> UserCashbackWallet:
    """
    Debita `amount` da carteira de cashback do usuário para a empresa,
    grava uma transação de débito com a descrição informada,
    usando lock para evitar condições de corrida.
    """
    # 1) tranca (row-level lock) a carteira do usuário+empresa
    w = (
        db.query(UserCashbackWallet)
          .filter_by(user_id=user_id, company_id=company_id)
          .with_for_update()
          .first()
    )
    if not w:
        # se não existir, cria (sem lock), comita, e depois relock
        w = UserCashbackWallet(
            user_id=user_id,
            company_id=company_id,
            balance=Decimal("0.00")
        )
        db.add(w)
        db.commit()
        db.refresh(w)
        w = (
            db.query(UserCashbackWallet)
              .filter_by(user_id=user_id, company_id=company_id)
              .with_for_update()
              .first()
        )

    # 2) converte amount para Decimal
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))

    # 3) valida saldo
    if w.balance < amount:
        raise ValueError(
            f"Saldo insuficiente na carteira do usuário: disponível {w.balance:.2f}, exigido {amount:.2f}"
        )

    # 4) debita e comita
    w.balance -= amount
    db.commit()
    db.refresh(w)

    # 5) registra transação com a descrição passada
    record_wallet_transaction(
        db=db,
        user_id=user_id,
        company_id=company_id,
        tx_type="debit",
        amount=-amount,
        description=description,
    )

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



def record_wallet_transaction(
    db: Session,
    user_id: str,
    company_id: str,
    tx_type: str,      
    amount: Decimal,
    description: str = None
) -> WalletTransaction:
    tx = WalletTransaction(
        user_id    = user_id,
        company_id = company_id,
        type       = tx_type,
        amount     = amount,
        description= description,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx