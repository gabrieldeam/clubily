from fastapi import APIRouter, Request, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.company_payment import CompanyPayment
from app.models.company_point_purchase import CompanyPointPurchase
from app.services.company_payment_service import refresh_payment_status
from app.services.point_purchase_service import refresh_point_purchase_status

router = APIRouter(tags=["webhooks"])

@router.post("/asaas", status_code=status.HTTP_204_NO_CONTENT)
async def asaas_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    payload = await request.json()
    event = payload.get("event", "").upper()

    if event.startswith("PAYMENT_") and "payment" in payload:
        asaas_id = payload["payment"]["id"]
        # verifique primeiro se é uma cobrança de créditos
        if db.query(CompanyPayment).filter_by(asaas_id=asaas_id).first():
            refresh_payment_status(db, asaas_id)
        # senão, pode ser compra de pontos
        elif db.query(CompanyPointPurchase).filter_by(asaas_id=asaas_id).first():
            refresh_point_purchase_status(db, asaas_id)

    return
