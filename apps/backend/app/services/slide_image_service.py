import os
from pathlib import Path
from fastapi import HTTPException

from app.models.slide_image import SlideImage
from app.db.base import Base  # se precisar, para construir path

STATIC_ROOT = Path(os.getcwd()) / "app" / "static" / "rewards" / "slides"

def create_slide(db, title, image_url, order, active):
    slide = SlideImage(title=title, image_url=image_url, order=order, active=active)
    db.add(slide); db.commit(); db.refresh(slide)
    return slide

def list_slides(db, skip, limit):
    return db.query(SlideImage).order_by(SlideImage.order).offset(skip).limit(limit).all()

def get_slide(db, slide_id):
    slide = db.get(SlideImage, slide_id)
    if not slide:
        raise HTTPException(status_code=404, detail="Slide não encontrado")
    return slide

def update_slide(db, slide_id, title, new_image_url, order, active):
    slide = get_slide(db, slide_id)

    # 1) se veio nova URL, apaga imagem antiga do disco
    if new_image_url and slide.image_url:
        # extrai só o nome do arquivo
        old_filename = slide.image_url.rsplit("/", 1)[-1]
        old_path = STATIC_ROOT / old_filename
        if old_path.exists():
            try:
                old_path.unlink()
            except OSError:
                pass  # logue se quiser

        slide.image_url = new_image_url

    slide.title  = title
    slide.order  = order
    slide.active = active

    db.commit(); db.refresh(slide)
    return slide

def delete_slide(db, slide_id):
    slide = get_slide(db, slide_id)

    # 2) antes de deletar do banco, apaga do disco
    if slide.image_url:
        filename = slide.image_url.rsplit("/", 1)[-1]
        path = STATIC_ROOT / filename
        if path.exists():
            try:
                path.unlink()
            except OSError:
                pass

    db.delete(slide)
    db.commit()
