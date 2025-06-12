from sqlalchemy.orm import Session
from app.models.cashback_program import CashbackProgram
from ..schemas.cashback_program import CashbackProgramCreate

def create_program(db: Session, company_id: str, obj_in: CashbackProgramCreate) -> CashbackProgram:
    program = CashbackProgram(
        company_id=company_id,
        name =obj_in.name,
        description=obj_in.description,
        percent=obj_in.percent,
        validity_days=obj_in.validity_days,
        is_active=obj_in.is_active,
        is_visible=obj_in.is_visible,
    )
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


def get_programs_by_company(db: Session, company_id: str):
    return db.query(CashbackProgram).filter(CashbackProgram.company_id == company_id).all()


def get_program(db: Session, program_id: str):
    return db.get(CashbackProgram, program_id)


def update_program(db: Session, program: CashbackProgram, data: dict):
    for field, val in data.items():
        setattr(program, field, val)
    db.commit()
    db.refresh(program)
    return program


def delete_program(db: Session, program: CashbackProgram):
    db.delete(program)
    db.commit()