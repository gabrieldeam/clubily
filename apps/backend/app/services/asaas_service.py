# backend/app/services/asaas_service.py
import requests
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.company import Company

HEADERS = {
    "access_token": settings.ASAAS_API_KEY,
    "Content-Type": "application/json"
}

def create_asaas_customer(db: Session, company_id: str, data: dict) -> Company:
    """
    Cria um customer no Asaas e grava o customer_id em Company.customer_id.
    """
    company = db.get(Company, company_id)
    if not company:
        raise ValueError("Empresa não encontrada")
    if company.customer_id:
        raise ValueError("Esta empresa já possui um customer_id cadastrado")

    # 1) POST /customers no Asaas
    resp = requests.post(
        f"{settings.ASAAS_BASE_URL}/customers",
        headers=HEADERS,
        json=data,
        timeout=10
    )
    resp.raise_for_status()
    payload = resp.json()

    # 2) grava no banco
    company.customer_id = payload["id"]
    db.commit()
    db.refresh(company)
    return company
