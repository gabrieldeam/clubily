# backend/app/services/address_service.py

from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID as UUID_TYPE

from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate

def create_address(db: Session, user_id: str, payload: AddressCreate) -> Address:
    """
    Cria um novo Address para o user_id informado, 
    definindo street, number, neighborhood, complement, city, state, postal_code, country, is_selected.
    """
    # Se for marcar este endereço como “selecionado”, desmarca todos os outros do usuário
    if payload.is_selected:
        (
            db.query(Address)
            .filter(Address.user_id == user_id, Address.is_selected == True)
            .update({"is_selected": False})
        )

    addr = Address(
        user_id=user_id,
        street=payload.street,
        number=payload.number,
        neighborhood=payload.neighborhood,
        complement=payload.complement,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        country=payload.country,
        is_selected=payload.is_selected,
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr

def list_addresses(db: Session, user_id: str) -> List[Address]:
    """
    Lista todos os endereços de um usuário, ordenados por data de criação decrescente.
    """
    return (
        db.query(Address)
        .filter(Address.user_id == user_id)
        .order_by(Address.created_at.desc())
        .all()
    )

def get_address(db: Session, address_id: str) -> Optional[Address]:
    """
    Retorna um Address pelo seu ID (string).
    """
    return db.query(Address).get(address_id)

def delete_address(db: Session, address_id: str) -> None:
    """
    Exclui o endereço pelo ID.
    """
    addr = db.query(Address).get(address_id)
    if addr:
        db.delete(addr)
        db.commit()

def update_address(db: Session, addr: Address, payload: AddressUpdate) -> Address:
    """
    Atualiza parcialmente um endereço (Address) já carregado na sessão.
    Permite mudar street, number, neighborhood, complement, city, state, postal_code, country, is_selected.
    Se marcar is_selected=True, desmarca todos os outros endereços do usuário antes de marcar este.
    """
    data = payload.model_dump(exclude_unset=True)

    # Se o novo payload pede para marcar “is_selected=True”, desmarque os outros
    if data.get("is_selected") is True:
        (
            db.query(Address)
            .filter(
                Address.user_id == str(addr.user_id),
                Address.is_selected == True
            )
            .update({"is_selected": False})
        )

    # Atualiza cada campo enviado
    for field, value in data.items():
        setattr(addr, field, value)

    db.commit()
    db.refresh(addr)
    return addr
