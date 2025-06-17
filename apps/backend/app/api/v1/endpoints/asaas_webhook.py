
from fastapi import APIRouter, Request, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.company_payment_service import refresh_payment_status
from app.core.config import settings

router = APIRouter(tags=["webhooks"])


@router.post("/asaas", status_code=status.HTTP_204_NO_CONTENT)
async def asaas_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Recebe qualquer webhook do Asaas (sem validação de HMAC) e só
    dispara nosso processamento de mudança de status.
    """
    payload = await request.json()

    event = payload.get("event", "").upper()
    if event == "PAYMENT_CHANGE_STATUS" or event == "payment.changeStatus":
        asaas_id = payload["payment"]["id"]
        refresh_payment_status(db, asaas_id)

    return  # 204 No Content
