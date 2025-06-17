import requests, re, logging
from sqlalchemy.orm import Session
from app.models.company_payment import CompanyPayment, PaymentStatus
from app.models.company import Company
from app.core.config import settings
from datetime import datetime
from sqlalchemy import func

logger = logging.getLogger(__name__)

HEADERS_POST = {
    "access_token": settings.ASAAS_API_KEY,
    "Content-Type": "application/json",
}
HEADERS_GET = {
    "access_token": settings.ASAAS_API_KEY,
    "accept":       "application/json",
}

def ensure_customer_exists(db: Session, company: Company) -> None:
    if company.customer_id:
        return

    payload = {
        "name":    company.name,
        "email":   company.email,
        "cpfCnpj": re.sub(r"\D", "", company.document or ""),
        "phone":   re.sub(r"\D", "", company.phone or ""),
    }
    resp = requests.post(
        f"{settings.ASAAS_BASE_URL}/customers",
        headers=HEADERS_POST,
        json=payload,
        timeout=10,
    )
    resp.raise_for_status()
    company.customer_id = resp.json()["id"]
    db.commit()
    db.refresh(company)

def create_charge(db: Session, company_id: str, amount: float) -> CompanyPayment:
    company = db.get(Company, company_id)
    if not company:
        raise ValueError("Empresa não encontrada")

    # garante customer
    ensure_customer_exists(db, company)

    # 1) cria cobrança
    payload = {
        "customer":    company.customer_id,
        "billingType": "PIX",
        "dueDate":     datetime.utcnow().strftime("%Y-%m-%d"),
        "value":       float(amount),
        "description": f"Crédito para {company.name}",
        "pix":         {"pixType": "DYNAMIC"},
    }
    resp = requests.post(
        f"{settings.ASAAS_BASE_URL}/payments",
        headers=HEADERS_POST,
        json=payload,
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()

    # 2) salva registro inicial
    payment = CompanyPayment(
        company_id  = company_id,
        amount      = amount,
        asaas_id    = data["id"],
        pix_qr_code = data.get("pixQrCode"),  # às vezes já vem aqui
        status      = PaymentStatus.PENDING,
    )
    db.add(payment); db.commit(); db.refresh(payment)

    # logger.info("Buscando QR-Code Pix em %s/payments/%s/pixQrCode",
    #         settings.ASAAS_BASE_URL, payment.asaas_id)
    # print("Buscando QR-Code Pix em", f"{settings.ASAAS_BASE_URL}/payments/{payment.asaas_id}/pixQrCode")

    # 3) busca o QR-Code & copy-paste via endpoint dedicado
    qr_resp = requests.get(
        f"{settings.ASAAS_BASE_URL}/payments/{payment.asaas_id}/pixQrCode",
        headers=HEADERS_GET,
        timeout=10,
    )
    qr_resp.raise_for_status()
    qrj = qr_resp.json()

    # logger.debug("Asaas pixQrCode response: %s", qrj)
    # logger.info(">>> Asaas pixQrCode response: %s", qrj)
    # print(">>> Asaas pixQrCode response:", qrj)

    # 4) atualiza o registro
    payment.pix_qr_code = qrj.get("encodedImage")
    payment.pix_copy_paste_code = qrj.get("payload")
    if exp_str := qrj.get("expirationDate"):
        # exp_str: "2026-06-17 23:59:59"
        payment.pix_expires_at = datetime.strptime(exp_str, "%Y-%m-%d %H:%M:%S")

    db.commit()
    return payment

def refresh_payment_status(db: Session, asaas_id: str) -> CompanyPayment:
    # consulta Asaas
    resp = requests.get(
        f"{settings.ASAAS_BASE_URL}/payments/{asaas_id}",
        headers=HEADERS_GET,
        timeout=10
    )
    resp.raise_for_status()
    d = resp.json()
    # atualiza status
    payment = db.query(CompanyPayment).filter_by(asaas_id=asaas_id).first()
    payment.status = PaymentStatus(d["status"])
    db.commit()
    db.refresh(payment)
    return payment

def list_payments(
    db: Session, company_id: str,
    skip: int, limit: int,
    status: PaymentStatus=None,
    date_from: datetime=None,
    date_to:   datetime=None
):
    q = db.query(CompanyPayment).filter(CompanyPayment.company_id == company_id)
    if status:    q = q.filter(CompanyPayment.status == status)
    if date_from: q = q.filter(CompanyPayment.created_at >= date_from)
    if date_to:   q = q.filter(CompanyPayment.created_at <= date_to)
    total = q.count()
    items = q.order_by(CompanyPayment.created_at.desc()).offset(skip).limit(limit).all()
    return total, items

def get_balance(db: Session, company_id: str) -> float:
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


def get_charge(
    db: Session,
    company_id: str,
    payment_id: str
) -> CompanyPayment | None:
    """
    Retorna a cobrança (CompanyPayment) pelo seu ID, 
    garantindo que ela pertença à company_id.
    """
    return (
        db.query(CompanyPayment)
          .filter(
              CompanyPayment.id       == payment_id,
              CompanyPayment.company_id == company_id
          )
          .first()
    )