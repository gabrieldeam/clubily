import logging
from datetime import datetime
from decimal import Decimal
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models.company_payment import CompanyPayment, PaymentStatus
from app.models.company import Company
from app.services.asaas_client import AsaasClient
from app.services.commission_service import credit_for_payment
from app.services.wallet_service import credit_wallet

logger = logging.getLogger(__name__)
gateway = AsaasClient()

STATUS_MAP = {
    "PENDING":           PaymentStatus.PENDING,
    "PAYMENT_PENDING":   PaymentStatus.PENDING,
    "OVERDUE":           PaymentStatus.PENDING,
    "PAYMENT_OVERDUE":   PaymentStatus.PENDING,

    "RECEIVED":          PaymentStatus.PAID,
    "PAYMENT_RECEIVED":  PaymentStatus.PAID,
    "CONFIRMED":         PaymentStatus.PAID,
    "PAYMENT_CONFIRMED": PaymentStatus.PAID,

    "DELETED":           PaymentStatus.CANCELLED,
    "PAYMENT_DELETED":   PaymentStatus.CANCELLED,
    "REFUNDED":          PaymentStatus.CANCELLED,
    "PAYMENT_REFUNDED":  PaymentStatus.CANCELLED,
    "REJECTED":          PaymentStatus.FAILED,
}

def create_charge(db: Session, company_id: str, amount: float) -> CompanyPayment:
    """
    Cria uma cobrança PIX na Asaas e grava o registro em CompanyPayment.
    """
    company = db.get(Company, company_id)
    if not company:
        raise ValueError("Empresa não encontrada")

    # delega a criação ao client unificado
    qr_info = gateway.create_payment(
        db,
        company_id,
        amount,
        f"Crédito para {company.name}"
    )

    payment = CompanyPayment(
        company_id=company_id,
        amount=Decimal(str(amount)),
        asaas_id=qr_info["asaas_id"],
        pix_qr_code=qr_info["pix_qr_code"],
        pix_copy_paste_code=qr_info["pix_copy_paste_code"],
        status=PaymentStatus.PENDING,
    )

    # se veio expirationDate, converte para datetime
    if exp := qr_info.get("pix_expires_at"):
        payment.pix_expires_at = datetime.strptime(exp, "%Y-%m-%d %H:%M:%S")

    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

def refresh_payment_status(db: Session, asaas_id: str) -> CompanyPayment | None:
    """
    Reconsulta o status no Asaas, atualiza o registro local e,
    se mudou para PAID, credita na carteira da empresa e na de comissão.
    """
    # 1) busca status atual na Asaas
    resp = gateway.get_payment(asaas_id)  # supondo que _get_payment retorne o JSON
    raw_status = resp.get("status", "").upper()

    # 2) converte para nosso enum
    mapped = STATUS_MAP.get(raw_status)
    if mapped is None:
        return None

    # 3) atualiza o registro local
    payment = db.query(CompanyPayment).filter_by(asaas_id=asaas_id).first()
    if not payment:
        return None

    previous = payment.status
    payment.status = mapped
    db.commit()
    db.refresh(payment)


    # 4) se acabou de virar PAID, credita na carteira
    if previous != PaymentStatus.PAID and mapped == PaymentStatus.PAID:
        credit_wallet(db, str(payment.company_id), Decimal(payment.amount))
        credit_for_payment(db, payment)

    return payment

def list_payments(
    db: Session,
    company_id: str,
    skip: int,
    limit: int,
    status: PaymentStatus = None,
    date_from: datetime = None,
    date_to: datetime = None
) -> tuple[int, list[CompanyPayment]]:
    """
    Lista as cobranças de uma empresa, com paginação e filtros opcionais.
    """
    q = db.query(CompanyPayment).filter(CompanyPayment.company_id == company_id)
    if status:
        q = q.filter(CompanyPayment.status == status)
    if date_from:
        q = q.filter(CompanyPayment.created_at >= date_from)
    if date_to:
        q = q.filter(CompanyPayment.created_at <= date_to)

    total = q.count()
    items = (
        q.order_by(CompanyPayment.created_at.desc())
         .offset(skip).limit(limit)
         .all()
    )
    return total, items

def get_balance(db: Session, company_id: str) -> float:
    """
    Retorna o total já recebido (status=PAID) pela empresa.
    """
    paid = (
        db.query(CompanyPayment)
          .filter(
              CompanyPayment.company_id == company_id,
              CompanyPayment.status == PaymentStatus.PAID
           )
          .with_entities(func.coalesce(func.sum(CompanyPayment.amount), 0))
          .scalar()
    ) or 0.0
    return float(paid)

def get_charge(db: Session, company_id: str, payment_id: str) -> CompanyPayment | None:
    """
    Retorna uma cobrança específica, garantindo que pertença à empresa.
    """
    return (
        db.query(CompanyPayment)
          .filter(
              CompanyPayment.id == payment_id,
              CompanyPayment.company_id == company_id
          )
          .first()
    )

def list_all_company_payments(
    db: Session,
    skip: int,
    limit: int,
    status: PaymentStatus = None,
    date_from: datetime = None,
    date_to: datetime = None
) -> tuple[int, list[CompanyPayment]]:
    """
    Endpoint admin: lista todas as cobranças de todas as empresas.
    """
    q = db.query(CompanyPayment).options(joinedload(CompanyPayment.company))
    if status:
        q = q.filter(CompanyPayment.status == status)
    if date_from:
        q = q.filter(CompanyPayment.created_at >= date_from)
    if date_to:
        q = q.filter(CompanyPayment.created_at <= date_to)

    total = q.count()
    items = (
        q.order_by(CompanyPayment.created_at.desc())
         .offset(skip).limit(limit)
         .all()
    )
    return total, items
