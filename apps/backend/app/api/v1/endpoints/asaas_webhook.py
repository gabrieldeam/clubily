import hmac, hashlib, json
from fastapi import APIRouter, Request, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.company_payment_service import refresh_payment_status
from app.core.config import settings

router = APIRouter(tags=["webhooks"])

@router.post("/asaas", status_code=204)
async def asaas_webhook(
    request: Request,
    x_hook_signature: str = Header(..., alias="X-Hook-Signature"),
    db: Session = Depends(get_db),
):
    body_bytes = await request.body()

    # valida assinatura
    expected = hmac.new(
        settings.ASAAS_WEBHOOK_SECRET.encode(),
        body_bytes,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, x_hook_signature):
        raise HTTPException(status_code=403, detail="Invalid signature")

    payload = json.loads(body_bytes)

    # processa eventos relevantes
    if payload.get("event") == "PAYMENT_CREATED":
        pass  # opcional — não precisamos fazer nada agora
    elif payload.get("event") == "PAYMENT_CHANGE_STATUS":
        asaas_id = payload["payment"]["id"]
        refresh_payment_status(db, asaas_id)

    return  # 204 No Content
