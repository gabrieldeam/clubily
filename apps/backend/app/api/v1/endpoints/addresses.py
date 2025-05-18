# backend/app/api/v1/endpoints/addresses.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_user
from app.schemas.address import AddressCreate, AddressRead
from app.services.address_service import create_address, list_addresses, get_address, delete_address

router = APIRouter(tags=["addresses"])

@router.post("/", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
def create_user_address(
    payload: AddressCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return create_address(db, str(current_user.id), payload)

@router.get("/", response_model=List[AddressRead])
def read_user_addresses(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return list_addresses(db, str(current_user.id))

@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_address(
    address_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    addr = get_address(db, address_id)
    if not addr or str(addr.user_id) != str(current_user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Endereço não encontrado")
    delete_address(db, address_id)
    return

@router.get(
    "/{address_id}",
    response_model=AddressRead,
    status_code=status.HTTP_200_OK,
    summary="Retorna um endereço pelo ID (do usuário logado)"
)
def read_user_address(
    address_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # 1) Busca o endereço
    addr = get_address(db, address_id)
    # 2) Verifica existência + pertence ao usuário
    if not addr or str(addr.user_id) != str(current_user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Endereço não encontrado")
    # 3) Devolve
    return addr
