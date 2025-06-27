# backend/app/api/v1/endpoints/transfer_methods.py

from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, get_current_user
from app.services.transfer_method_service import (
    create_transfer_method, list_transfer_methods,
    get_transfer_method, delete_transfer_method
)
from app.schemas.transfer_method import (
    TransferMethodCreate, TransferMethodRead
)

router = APIRouter(tags=["transfer_methods"])

@router.post(
    "/",
    response_model=TransferMethodRead,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastra nova chave PIX"
)
def create_method(
    payload: TransferMethodCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return create_transfer_method(db, str(user.id), payload)

@router.get(
    "/",
    response_model=List[TransferMethodRead],
    summary="Lista chaves PIX do usuário"
)
def read_methods(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return list_transfer_methods(db, str(user.id))

@router.delete(
    "/{method_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove uma chave PIX"
)
def delete_method(
    method_id: str = Path(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    tm = delete_transfer_method(db, str(user.id), method_id)
    if not tm:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Método não encontrado")
