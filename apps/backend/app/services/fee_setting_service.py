from sqlalchemy.orm import Session
from decimal import Decimal
from app.models.fee_setting import FeeSetting, SettingTypeEnum

DEFAULT_FEE = Decimal("0.10")


def get_fee_setting(db: Session, company_id: str, setting_type: SettingTypeEnum) -> FeeSetting | None:
    return (
        db.query(FeeSetting)
          .filter_by(company_id=company_id, setting_type=setting_type)
          .first()
    )

def get_effective_fee(db: Session, company_id: str, setting_type: SettingTypeEnum) -> Decimal:
    fs = get_fee_setting(db, company_id, setting_type)
    return fs.fee_amount if fs is not None else DEFAULT_FEE

def list_fee_settings(db: Session, company_id: str):
    return (
        db.query(FeeSetting)
          .filter_by(company_id=company_id)
          .all()
    )

def create_fee_setting(db: Session, company_id: str, obj_in) -> FeeSetting:
    existing = get_fee_setting(db, company_id, obj_in.setting_type)
    if existing:
        raise ValueError("Já existe configuração para este tipo")
    fs = FeeSetting(company_id=company_id, **obj_in.dict())
    db.add(fs)
    db.commit()
    db.refresh(fs)
    return fs


def upsert_fee_setting(
    db: Session,
    company_id: str,
    setting_type: str,
    fee_amount: Decimal | None
) -> FeeSetting:
    """
    Cria ou atualiza a FeeSetting; se fee_amount for None, não altera o existente.
    """
    fs = (
        db.query(FeeSetting)
          .filter_by(company_id=company_id, setting_type=setting_type)
          .first()
    )
    if fs is None:
        fs = FeeSetting(
            company_id=company_id,
            setting_type=setting_type,
            fee_amount=(fee_amount if fee_amount is not None else DEFAULT_FEE)
        )
        db.add(fs)
    else:
        if fee_amount is not None:
            fs.fee_amount = fee_amount
    db.commit()
    db.refresh(fs)
    return fs