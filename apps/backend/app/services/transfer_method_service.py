# app/services/transfer_method_service.py

from sqlalchemy.orm import Session
from app.models.transfer_method import TransferMethod
from app.schemas.transfer_method import TransferMethodCreate
from uuid import UUID

def create_transfer_method(
    db: Session, user_id: str, obj_in: TransferMethodCreate
) -> TransferMethod:
    tm = TransferMethod(
        user_id=user_id,
        name=obj_in.name,
        key_type=obj_in.key_type,
        key_value=obj_in.key_value,
    )
    db.add(tm)
    db.commit()
    db.refresh(tm)
    return tm

def list_transfer_methods(db: Session, user_id: str) -> list[TransferMethod]:
    return (
        db.query(TransferMethod)
          .filter_by(user_id=user_id)
          .order_by(TransferMethod.created_at.desc())
          .all()
    )

def get_transfer_method(db: Session, user_id: str, method_id: str):
    return (
        db.query(TransferMethod)
          .filter_by(user_id=user_id, id=method_id)
          .first()
    )

def delete_transfer_method(db: Session, user_id: str, method_id: str):
    tm = get_transfer_method(db, user_id, method_id)
    if tm:
        db.delete(tm)
        db.commit()
    return tm
