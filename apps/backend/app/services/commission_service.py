# app/services/commission_service.py

from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm import Session, joinedload
from app.models.commission import (
    CommissionWallet, CommissionTransaction,
    CommissionTransactionType, CommissionWithdrawal, CommissionWithdrawalStatus
)
from app.models.referral import Referral
from app.models.company_payment import CompanyPayment
from app.models.company import Company  # ✅ vamos carregar a empresa + categoria principal
from app.models.user import User

DEFAULT_COMMISSION_RATE = Decimal("0.03")  # 3% (fallback padrão)

def get_or_create_commission_wallet(db: Session, user_id: str) -> CommissionWallet:
    w = db.query(CommissionWallet).filter_by(user_id=user_id).first()
    if not w:
        w = CommissionWallet(user_id=user_id, balance=Decimal("0.00"))
        db.add(w); db.commit(); db.refresh(w)
    return w

def record_commission_transaction(
    db: Session, wallet: CommissionWallet,
    tx_type: CommissionTransactionType,
    amount: Decimal, description: str | None = None
) -> CommissionTransaction:
    tx = CommissionTransaction(
        wallet_id=wallet.id, type=tx_type,
        amount=amount, description=description
    )
    db.add(tx)
    wallet.balance += amount if tx_type == CommissionTransactionType.credit else -amount
    db.commit(); db.refresh(tx); db.refresh(wallet)
    return tx

def _get_company_and_rate(db: Session, company_id: str) -> tuple[Company | None, Decimal, Decimal, str | None]:
    """
    Retorna:
      - company (com primary_category carregada)
      - rate (0..1) usado no cálculo
      - pct_display (0..100) para exibir na descrição
      - category_name (ou None)
    Regras:
      - Se existir categoria principal e commission_percent NÃO for None,
        usa esse valor (inclusive 0); caso contrário, usa DEFAULT_COMMISSION_RATE (3%).
    """
    company = (
        db.query(Company)
          .options(joinedload(Company.primary_category))
          .get(company_id)
    )

    if company and company.primary_category and company.primary_category.commission_percent is not None:
        # commission_percent vem em pontos percentuais (ex.: 12.50)
        pct = Decimal(company.primary_category.commission_percent)  # já é Decimal no Postgres
        rate = (pct / Decimal("100"))
        pct_display = pct  # para exibir em %, com duas casas
        category_name = company.primary_category.name
        return company, rate, pct_display, category_name

    # Fallback 3%
    pct_fallback = (DEFAULT_COMMISSION_RATE * Decimal("100")).quantize(Decimal("0.01"))
    return company, DEFAULT_COMMISSION_RATE, pct_fallback, None

def credit_for_payment(db: Session, payment: CompanyPayment):
    # 1) encontra quem indicou esta empresa
    ref = db.query(Referral).filter_by(company_id=str(payment.company_id)).first()
    if not ref:
        return

    # 2) pega empresa + taxa aplicável (da categoria principal ou 3%)
    company, rate, pct_display, category_name = _get_company_and_rate(db, str(payment.company_id))

    # 3) calcula comissão: amount * rate (2 casas decimais, HALF_UP)
    amount_dec = Decimal(payment.amount)  # Numeric -> Decimal
    commission = (amount_dec * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # 4) texto amigável
    if category_name:
        desc = f"{pct_display}% de comissão (categoria {category_name}) sobre pagamento {payment.asaas_id}"
    else:
        desc = f"{pct_display}% de comissão (padrão) sobre pagamento {payment.asaas_id}"

    # 5) credita na carteira do usuário que indicou
    wallet = get_or_create_commission_wallet(db, str(ref.user_id))
    record_commission_transaction(
        db, wallet, CommissionTransactionType.credit,
        commission, desc
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
            joinedload(CommissionWithdrawal.wallet)
              .joinedload(CommissionWallet.user),
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
