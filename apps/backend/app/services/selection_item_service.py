from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.selection_item import SelectionItem, SelectionType

def create_selection(db: Session, type: SelectionType, item_id: str):
    # se for categoria, sobrescreve o único registro existente
    if type == SelectionType.category:
        existing = db.query(SelectionItem).filter_by(type=type).first()
        if existing:
            existing.item_id = item_id
            db.commit()
            db.refresh(existing)
            return existing
    # para produtos, não permite duplicados
    else:
        if db.query(SelectionItem).filter_by(type=type, item_id=item_id).first():
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="Produto já está selecionado"
            )
    sel = SelectionItem(type=type, item_id=item_id)
    db.add(sel)
    db.commit()
    db.refresh(sel)
    return sel

def delete_selection(db: Session, type: SelectionType, item_id: str | None = None):
    q = db.query(SelectionItem).filter_by(type=type)
    if type == SelectionType.product:
        if not item_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="item_id obrigatório para produtos")
        q = q.filter_by(item_id=item_id)
    sel = q.first()
    if not sel:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Seleção não encontrada")
    db.delete(sel)
    db.commit()

def get_category_selection(db: Session):
    sel = db.query(SelectionItem).filter_by(type=SelectionType.category).first()
    if not sel:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Nenhuma categoria selecionada")
    return sel

def list_product_selections(db: Session):
    return db.query(SelectionItem).filter_by(type=SelectionType.product).all()
