from fastapi import APIRouter, Request, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.company_payment_service import refresh_payment_status
from app.core.config import settings

router = APIRouter(tags=["webhooks"])

@router.post("/asaas")
async def asaas_webhook(
    request: Request,
    x_asaas_key: str = Header(None),
    db: Session = Depends(get_db)
):
    if x_asaas_key != settings.ASAAS_WEBHOOK_KEY:
        raise HTTPException(status_code=403, detail="Invalid signature")
    payload = await request.json()
    # evento de mudança de payment
    if payload.get("event") == "payment.changeStatus":
        asaas_id = payload["payment"]["id"]
        refresh_payment_status(db, asaas_id)
    return {"ok": True}
