# backend/app/api/v1/endpoints/categories.py

import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_admin, get_current_company
from app.models.category import Category
from app.models.company import Company
from app.schemas.category import CategoryRead
from app.services.category_service import list_categories

router = APIRouter(tags=["categories"])

@router.post(
    "/",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_cat(
    name: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # 1) valida tipo de arquivo
    if not image.content_type.startswith("image/"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Envie um arquivo de imagem válido")

    # 2) prepara pasta e nome único
    save_dir = os.path.join(os.getcwd(), "backend", "app", "static", "categories")
    os.makedirs(save_dir, exist_ok=True)
    ext = os.path.splitext(image.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(save_dir, filename)

    # 3) grava no disco
    content = await image.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # 4) persiste no banco
    image_url = f"/static/categories/{filename}"
    cat = Category(name=name, image_url=image_url)
    db.add(cat)
    db.commit()
    db.refresh(cat)

    return cat

@router.get("/", response_model=list[CategoryRead])
def read_cats(db: Session = Depends(get_db)):
    return list_categories(db)


@router.post("/{category_id}", status_code=204)
def add_category_to_company(
    category_id: str,
    current_company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    cat = db.get(Category, category_id)
    if not cat:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Categoria não encontrada")
    if cat not in current_company.categories:
        current_company.categories.append(cat)
        db.commit()
    return