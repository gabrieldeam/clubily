# backend/app/api/v1/endpoints/categories.py

import os
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
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
    save_dir = os.path.join(os.getcwd(), "app", "static", "categories")
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

@router.patch(
    "/{category_id}",
    response_model=CategoryRead,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_admin)],
    summary="Edita nome e/ou imagem de uma categoria (admin)"
)
async def update_category(
    category_id: str,
    name: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    # 1) busca a categoria
    cat = db.get(Category, category_id)
    if not cat:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")

    # 2) atualiza nome, se fornecido
    if name is not None:
        cat.name = name

    # 3) atualiza imagem, se fornecida
    if image is not None:
        if not image.content_type.startswith("image/"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Envie um arquivo de imagem válido")

        # exclui arquivo antigo
        if cat.image_url:
            old_file = os.path.basename(cat.image_url)
            old_path = os.path.join(os.getcwd(), "app", "static", "categories", old_file)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except OSError:
                    pass

        # salva novo arquivo
        save_dir = os.path.join(os.getcwd(), "app", "static", "categories")
        os.makedirs(save_dir, exist_ok=True)
        ext = os.path.splitext(image.filename)[1]
        new_filename = f"{uuid.uuid4()}{ext}"
        new_path = os.path.join(save_dir, new_filename)
        content = await image.read()
        with open(new_path, "wb") as f:
            f.write(content)
        cat.image_url = f"/static/categories/{new_filename}"

    # 4) persiste e retorna
    db.commit()
    db.refresh(cat)
    return cat


@router.get(
    "/used",
    response_model=List[CategoryRead],
    status_code=status.HTTP_200_OK,
    summary="Categorias com pelo menos uma empresa, filtradas por localização"
)
def read_used_categories(
    city: Optional[str] = Query(None, description="Filtrar por parte do nome da cidade"),
    state: Optional[str] = Query(None, description="Filtrar por parte do nome do estado"),
    postal_code: Optional[str] = Query(None, description="Filtrar por CEP exato"),
    db: Session = Depends(get_db),
):
    """
    Retorna categorias que têm pelo menos uma empresa associada,
    opcionalmente filtrando empresas por cidade, estado e/ou CEP.
    """
    q = db.query(Category).join(Category.companies)
    if city:
        q = q.filter(Company.city.ilike(f"%{city}%"))
    if state:
        q = q.filter(Company.state.ilike(f"%{state}%"))
    if postal_code:
        q = q.filter(Company.postal_code == postal_code)
    q = q.distinct()
    return q.all()