# backend/app/services/sms_service.py

from fastapi import HTTPException, status
from twilio.rest import Client
from ..core.config import settings

client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
SERVICE_SID = settings.TWILIO_VERIFY_SERVICE_SID

def send_phone_code(phone: str) -> None:
    """
    Dispara um SMS de verificação via Twilio Verify.
    """
    try:
        client.verify.v2.services(SERVICE_SID).verifications.create(
            to=phone,
            channel="sms"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Não foi possível enviar SMS de verificação."
        )

def verify_phone_code(phone: str, code: str) -> None:
    """
    Confere o código enviado. Se inválido, levanta HTTPException.
    """
    try:
        check = client.verify.v2.services(SERVICE_SID).verification_checks.create(
            to=phone,
            code=code
        )
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Código inválido ou expirado")
    if check.status != "approved":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Código incorreto")
