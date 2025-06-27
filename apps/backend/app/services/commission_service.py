# app/services/commission_service.py

from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from app.models.commission import (
    CommissionWallet, CommissionTransaction,
    CommissionTransactionType, CommissionWithdrawal, CommissionWithdrawalStatus
)
from app.models.referral import Referral
from app.models.company_payment import CompanyPayment
from app.models.user import User

COMMISSION_RATE = Decimal("0.03")  # 3%

def get_or_create_commission_wallet(db: Session, user_id: str) -> CommissionWallet:
    w = db.query(CommissionWallet).filter_by(user_id=user_id).first()
    if not w:
        w = CommissionWallet(user_id=user_id, balance=Decimal("0.00"))
        db.add(w); db.commit(); db.refresh(w)
    return w

def record_commission_transaction(
    db: Session, wallet: CommissionWallet,
    tx_type: CommissionTransactionType,
    amount: Decimal, description: str = None
) -> CommissionTransaction:
    tx = CommissionTransaction(
        wallet_id=wallet.id, type=tx_type,
        amount=amount, description=description
    )
    db.add(tx)
    # ajusta saldo
    wallet.balance += amount if tx_type == CommissionTransactionType.credit else -amount
    db.commit(); db.refresh(tx); db.refresh(wallet)
    return tx

def credit_for_payment(db: Session, payment: CompanyPayment):
    # encontra quem indicou esta empresa
    ref = db.query(Referral).filter_by(company_id=str(payment.company_id)).first()
    if not ref:
        return
    commission = (Decimal(payment.amount) * COMMISSION_RATE).quantize(Decimal("0.01"))
    wallet = get_or_create_commission_wallet(db, str(ref.user_id))
    record_commission_transaction(
        db, wallet, CommissionTransactionType.credit,
        commission,
        f"3% de comissão sobre pagamento {payment.asaas_id}"
    )

def get_commission_balance(db: Session, user_id: str) -> Decimal:
    w = db.query(CommissionWallet).filter_by(user_id=user_id).first()
    return w.balance if w else Decimal("0.00")

def list_commission_transactions(
    db: Session, user_id: str, skip: int, limit: int
):
    wallet = get_or_create_commission_wallet(db, user_id)
    total = db.query(CommissionTransaction).filter_by(wallet_id=wallet.id).count()
    items = (
        db.query(CommissionTransaction)
          .filter_by(wallet_id=wallet.id)
          .order_by(CommissionTransaction.created_at.desc())
          .offset(skip).limit(limit).all()
    )
    return total, items

def request_commission_withdrawal(
    db: Session, user_id: str, amount: Decimal, transfer_method_id: str
) -> CommissionWithdrawal:
    wallet = get_or_create_commission_wallet(db, user_id)
    if wallet.balance < amount:
        raise ValueError("Saldo insuficiente para saque")
    # registra débito
    record_commission_transaction(
         db, wallet, CommissionTransactionType.debit,
         amount, "Solicitação de saque"
    )
    wr = CommissionWithdrawal(
        wallet_id=wallet.id,
        amount=amount,
        transfer_method_id=transfer_method_id
    )
    db.add(wr); db.commit(); db.refresh(wr)
    return wr

def list_withdrawals(db: Session, skip: int, limit: int):
    total = db.query(CommissionWithdrawal).count()
    items = (
        db.query(CommissionWithdrawal)
          .options(
            # carrega wallet → user
            joinedload(CommissionWithdrawal.wallet)
              .joinedload(CommissionWallet.user),
            # carrega transfer_method
            joinedload(CommissionWithdrawal.transfer_method),
          )
          .order_by(CommissionWithdrawal.created_at.desc())
          .offset(skip).limit(limit)
          .all()
    )
    return total, items

def change_withdrawal_status(
    db: Session, withdrawal_id: str, approve: bool
) -> CommissionWithdrawal:
    wr = db.query(CommissionWithdrawal).get(withdrawal_id)
    if not wr or wr.status != CommissionWithdrawalStatus.pending:
        raise ValueError("Solicitação inválida")
    wr.status = CommissionWithdrawalStatus.approved if approve else CommissionWithdrawalStatus.rejected
    db.commit(); db.refresh(wr)
    return wr

def list_withdrawals_for_user(db: Session, user_id: str) -> list[CommissionWithdrawal]:
    wallet = get_or_create_commission_wallet(db, user_id)
    return (
        db.query(CommissionWithdrawal)
          .options(
            joinedload(CommissionWithdrawal.wallet)
              .joinedload(CommissionWallet.user),
            joinedload(CommissionWithdrawal.transfer_method),
          )
          .filter_by(wallet_id=wallet.id)
          .order_by(CommissionWithdrawal.created_at.desc())
          .all()
    )
