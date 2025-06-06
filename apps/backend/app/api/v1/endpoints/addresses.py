# backend/app/api/v1/endpoints/addresses.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.schemas.address import AddressCreate, AddressRead, AddressUpdate
from app.services.address_service import (
    create_address,
    list_addresses,
    get_address,
    delete_address,
    update_address
)

router = APIRouter(tags=["addresses"])

@router.post("/", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
def create_user_address(
    payload: AddressCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Cria um novo endereço para o usuário logado, com todos os campos:
    street, number, neighborhood, complement (opcional), city, state, postal_code, country e is_selected.
    """
    return create_address(db, str(current_user.id), payload)

@router.get("/", response_model=List[AddressRead])
def read_user_addresses(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Retorna todos os endereços do usuário logado (incluindo o is_selected, se houver).
    """
    return list_addresses(db, str(current_user.id))

@router.get("/{address_id}", response_model=AddressRead)
def read_single_address(
    address_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Retorna um único endereço pelo ID, apenas se pertencer ao usuário autenticado.
    """
    addr = get_address(db, str(address_id))
    if not addr or str(addr.user_id) != str(current_user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Endereço não encontrado")
    return addr

@router.patch("/{address_id}", response_model=AddressRead)
def update_user_address(
    address_id: UUID,
    payload: AddressUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Atualiza parcialmente os campos de um endereço específico do usuário logado.
    Permite alterar qualquer campo: street, number, neighborhood, complement, city, state, postal_code, country, is_selected.
    """
    addr = get_address(db, str(address_id))
    if not addr or str(addr.user_id) != str(current_user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Endereço não encontrado")

    return update_address(db, addr, payload)

@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_address(
    address_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Remove um endereço do usuário. Só funciona se o endereço pertencer ao usuário autenticado.
    """
    addr = get_address(db, str(address_id))
    if not addr or str(addr.user_id) != str(current_user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Endereço não encontrado")
    delete_address(db, str(address_id))
    return
