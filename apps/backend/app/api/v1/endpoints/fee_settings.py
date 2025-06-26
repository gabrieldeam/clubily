from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, require_admin
from app.schemas.fee_setting import (
    FeeSettingCreate, FeeSettingRead, FeeSettingUpdate
)
from app.services.fee_setting_service import (
    create_fee_setting, upsert_fee_setting,
    list_fee_settings,
)
from app.models.fee_setting import SettingTypeEnum

router = APIRouter(tags=["fee_settings"], dependencies=[Depends(require_admin)])

@router.get(
    "/{company_id}",
    response_model=List[FeeSettingRead],
    summary="Lista todas as configurações de taxa de uma empresa",
)
def read_fee_settings(
    company_id: str = Path(..., description="UUID da empresa alvo"),
    db: Session = Depends(get_db),
):
    return list_fee_settings(db, company_id)

@router.post(
    "/{company_id}",
    response_model=FeeSettingRead,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma configuração de taxa para um tipo",
)
def create_fs(
    company_id: str,
    payload: FeeSettingCreate,
    db: Session = Depends(get_db),
):
    try:
        return create_fee_setting(db, company_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch(
    "/{company_id}/{setting_type}",
    response_model=FeeSettingRead,
    summary="Ajusta apenas a taxa de um tipo para esta empresa"
)
def patch_fee_setting(
    company_id: str = Path(..., description="UUID da empresa"),
    setting_type: SettingTypeEnum = Path(..., description="Tipo de taxa"),
    payload: FeeSettingUpdate = Body(...),
    db: Session = Depends(get_db),
):
    try:
        fs = upsert_fee_setting(db, company_id, setting_type, payload.fee_amount)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return fs