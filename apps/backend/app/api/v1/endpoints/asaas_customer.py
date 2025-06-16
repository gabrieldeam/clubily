# backend/app/api/v1/endpoints/asaas_customer.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_company
from app.schemas.asaas_customer import AsaasCustomerCreate, CompanyAsaasCustomerRead
from app.services.asaas_service import create_asaas_customer

router = APIRouter(tags=["asaas_customer"])

@router.post(
    "/companies/me/asaas-customer",
    response_model=CompanyAsaasCustomerRead,
    status_code=status.HTTP_201_CREATED,
    summary="Cria o customer Asaas para a empresa logada"
)
def make_asaas_customer(
    payload: AsaasCustomerCreate,
    db: Session = Depends(get_db),
    current_company=Depends(get_current_company),
):
    try:
        company = create_asaas_customer(db, str(current_company.id), payload.model_dump())
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
    return company
