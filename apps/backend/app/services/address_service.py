from sqlalchemy.orm import Session
from app.models.address import Address
from app.schemas.address import AddressCreate

def create_address(db: Session, user_id: str, obj_in: AddressCreate) -> Address:
    addr = Address(user_id=user_id, **obj_in.model_dump())
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr

def list_addresses(db: Session, user_id: str) -> list[Address]:
    return db.query(Address).filter(Address.user_id == user_id).all()

def get_address(db: Session, address_id: str) -> Address | None:
    return db.get(Address, address_id)

def delete_address(db: Session, address_id: str) -> None:
    addr = db.get(Address, address_id)
    if addr:
        db.delete(addr)
        db.commit()
