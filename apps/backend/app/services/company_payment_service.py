import requests
from sqlalchemy.orm import Session
from app.models.company_payment import CompanyPayment, PaymentStatus
from app.models.company import Company
from app.core.config import settings
from datetime import datetime
from sqlalchemy import func

HEADERS = {"access_token": settings.ASAAS_API_KEY}

def create_charge(db: Session, company_id: str, amount: float) -> CompanyPayment:
    # 1) busca customer_id armazenado em Company.customer_id (supondo que você o cadastre)
    company = db.get(Company, company_id)
    if not company or not company.customer_id:
        raise ValueError("Empresa sem customer_id Asaas")

    payload = {
        "customer": company.customer_id,
        "billingType": "PIX",
        "dueDate": datetime.utcnow().strftime("%Y-%m-%d"),
        "value": float(amount),
        "description": f"Crédito para {company.name}",
        "pix": {"pixType": "DYNAMIC"}
    }

    resp = requests.post(
        f"{settings.ASAAS_BASE_URL}/payments",
        headers=HEADERS,
        json=payload,
        timeout=10
    )
    resp.raise_for_status()
    data = resp.json()

    # 2) salva no banco
    payment = CompanyPayment(
        company_id = company_id,
        amount     = amount,
        asaas_id   = data["id"],
        pix_qr_code= data.get("pixQrCode", None),
        status     = PaymentStatus.PENDING
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

def refresh_payment_status(db: Session, asaas_id: str) -> CompanyPayment:
    # consulta Asaas
    resp = requests.get(
        f"{settings.ASAAS_BASE_URL}/payments/{asaas_id}",
        headers=HEADERS,
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
