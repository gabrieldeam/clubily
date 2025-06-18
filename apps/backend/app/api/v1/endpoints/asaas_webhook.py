
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
    Recebe todos os webhooks do Asaas e, para qualquer evento
    de cobrança (qualquer event que comece com PAYMENT_), atualiza
    o status da nossa CompanyPayment.
    """
    payload = await request.json()
    event = payload.get("event", "").upper()

    # Se for qualquer coisa como "PAYMENT_*", puxa o id e atualiza
    if event.startswith("PAYMENT_") and "payment" in payload:
        asaas_id = payload["payment"]["id"]
        refresh_payment_status(db, asaas_id)

    # sempre devolve 204 para o Asaas (ele só reenvia se não for 2XX)
    return
