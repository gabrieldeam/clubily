# app/services/asaas_client.py
import requests
from datetime import datetime
from decimal import Decimal
from app.core.config import settings
from app.models.company import Company
import re
import logging

logger = logging.getLogger(__name__)

class AsaasClient:
    HEADERS = {
      "access_token": settings.ASAAS_API_KEY,
      "Content-Type": "application/json",
      "accept":       "application/json"
    }

    def ensure_customer(self, db, company: Company):
        if company.customer_id:
            return
        payload = {
            "name":    company.name,
            "email":   company.email,
            "cpfCnpj": re.sub(r"\D", "", getattr(company, "cnpj", "") or "")
        }
        resp = requests.post(
            f"{settings.ASAAS_BASE_URL}/customers",
            headers=self.HEADERS, json=payload, timeout=10
        )
        try:
            resp.raise_for_status()
        except Exception:
            logger.error("Falha ao criar customer Asaas (%s): %s → %s",
                         resp.status_code, resp.text, payload)
            raise
        company.customer_id = resp.json()["id"]
        db.commit(); db.refresh(company)

    def create_payment(self, db, company_id: str, amount: float, descr: str):
        from app.models.company import Company
        company: Company = db.get(Company, company_id)
        if not company:
            raise ValueError("Empresa não encontrada")
        self.ensure_customer(db, company)

        payload = {
          "customer": company.customer_id,
          "billingType": "PIX",
          "dueDate": datetime.utcnow().strftime("%Y-%m-%d"),
          "value": float(amount),
          "description": descr,
          "pix": {"pixType":"DYNAMIC"},
        }
        resp = requests.post(
            f"{settings.ASAAS_BASE_URL}/payments",
            headers=self.HEADERS, json=payload, timeout=10
        )
        resp.raise_for_status()
        data = resp.json()

        # agora busca o QR-code
        qr = requests.get(
            f"{settings.ASAAS_BASE_URL}/payments/{data['id']}/pixQrCode",
            headers=self.HEADERS, timeout=10
        ).json()

        return {
            "asaas_id": data["id"],
            "pix_qr_code": qr.get("encodedImage"),
            "pix_copy_paste_code": qr.get("payload"),
            "pix_expires_at": qr.get("expirationDate"),
        }

    def get_payment(self, asaas_id: str) -> dict:
        resp = requests.get(
            f"{settings.ASAAS_BASE_URL}/payments/{asaas_id}",
            headers=self.HEADERS,
            timeout=10
        )
        resp.raise_for_status()
        return resp.json()
    
    