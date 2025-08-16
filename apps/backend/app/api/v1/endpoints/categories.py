# backend/app/api/v1/endpoints/categories.py

import os
import uuid
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP 
from typing import List, Optional   
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_admin, get_current_company, get_redis
from app.services.geocode_service import GeocodeService
from app.models.category import Category
from app.models.company import Company
from app.schemas.category import CategoryRead, CategoryPage
from app.services.category_service import list_categories, list_categories_paginated
from sqlalchemy import or_, func
from geoalchemy2 import functions as geo_func
from redis import Redis

router = APIRouter(tags=["categories"])

def _parse_percent(raw: Optional[str]) -> Optional[Decimal]:
    """
    Aceita: None, '', 'null', '12', '12.5', '12,5'
    Retorna: Decimal('12.50') ou None
    """
    if raw is None:
        return None
    raw = raw.strip().lower()
    if raw in ("", "null", "none"):
        return None
    # suporta vírgula
    raw = raw.replace(",", ".")
    try:
        v = Decimal(raw)
    except (InvalidOperation, ValueError):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="commission_percent inválido")

    if v < 0 or v > 100:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="commission_percent deve estar entre 0 e 100")

    # fixa 2 casas decimais (ROUND_HALF_UP)
    return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

@router.post(
    "/",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_cat(
    name: str = Form(...),
    image: UploadFile = File(...),
    commission_percent: str | None = Form(None),   # ✅ era float | None
    db: Session = Depends(get_db),
):
    # parse/valida comissão
    cp = _parse_percent(commission_percent)         # ✅ Decimal ou None

    if not image.content_type.startswith("image/"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Envie um arquivo de imagem válido")

    save_dir = os.path.join(os.getcwd(), "app", "static", "categories")
    os.makedirs(save_dir, exist_ok=True)
    ext = os.path.splitext(image.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(save_dir, filename)

    content = await image.read()
    with open(file_path, "wb") as f:
        f.write(content)

    image_url = f"/static/categories/{filename}"
    cat = Category(name=name, image_url=image_url, commission_percent=cp)  # ✅ Decimal
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/", response_model=list[CategoryRead])
def read_cats(db: Session = Depends(get_db)):
    return list_categories(db)

@router.get(
    "/public",
    response_model=CategoryPage,
    status_code=status.HTTP_200_OK,
    summary="Lista pública de categorias (com comissão), paginada e com busca opcional",
)
def read_categories_public(
    page: int = Query(1, ge=1, description="Página (1-based)"),
    size: int = Query(20, ge=1, le=100, description="Itens por página (máx 100)"),
    q: Optional[str] = Query(None, description="Filtro por nome (contém)"),
    db: Session = Depends(get_db),
):
    """
    Endpoint **público** (não exige token).
    Retorna categorias com campos completos (inclui `commission_percent`),
    paginação e busca opcional por nome.
    """
    items, total = list_categories_paginated(db, page=page, size=size, q=q)
    return CategoryPage(items=items, total=total, page=page, size=size)

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
    summary="Edita nome, comissão e/ou imagem de uma categoria (admin)"
)
async def update_category(
    category_id: str,
    name: str | None = Form(None),
    image: UploadFile | None = File(None),
    commission_percent: str | None = Form(None),   # ✅ era float | None
    db: Session = Depends(get_db),
):
    cat = db.get(Category, category_id)
    if not cat:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")

    # Só parseia se veio no form (inclusive '' para limpar)
    if commission_percent is not None:
        cp = _parse_percent(commission_percent)     # ✅ Decimal ou None
        cat.commission_percent = cp

    if name is not None:
        cat.name = name

    if image is not None:
        if not image.content_type.startswith("image/"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Envie um arquivo de imagem válido")

        if cat.image_url:
            old_file = os.path.basename(cat.image_url)
            old_path = os.path.join(os.getcwd(), "app", "static", "categories", old_file)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except OSError:
                    pass

        save_dir = os.path.join(os.getcwd(), "app", "static", "categories")
        os.makedirs(save_dir, exist_ok=True)
        ext = os.path.splitext(image.filename)[1]
        new_filename = f"{uuid.uuid4()}{ext}"
        new_path = os.path.join(save_dir, new_filename)
        content = await image.read()
        with open(new_path, "wb") as f:
            f.write(content)
        cat.image_url = f"/static/categories/{new_filename}"

    db.commit()
    db.refresh(cat)
    return cat

@router.get(
    "/used",
    response_model=List[CategoryRead],
    status_code=status.HTTP_200_OK,
    summary="Categorias com pelo menos uma empresa ativa (OU only_online), filtradas por raio"
)
def read_used_categories(
    postal_code: str = Query(..., description="CEP (apenas dígitos) para busca geográfica"),
    radius_km: float = Query(..., description="Raio em quilômetros"),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """
    Retorna categorias que têm pelo menos uma empresa ATIVA associada
    dentro de `radius_km` km de `postal_code`, sempre incluindo as only_online.
    """
    # 1) Geocode + cache
    geocoder = GeocodeService(redis)
    lat, lon = geocoder.geocode_postal_code(postal_code)

    # 2) Constrói ponto de busca e distância em metros
    search_point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
    distance_m = radius_km * 1000

    # 3) Query espacial: join em Category→Company, filtra ativa e dentro do raio OU online
    q = (
        db.query(Category)
        .join(Category.companies)
        .filter(Company.is_active == True)
        .filter(
            or_(
                Company.only_online == True,
                geo_func.ST_DWithin(Company.location, search_point, distance_m)
            )
        )
        .distinct()
    )

    return q.all()

@router.get(
    "/{category_id}",
    response_model=CategoryRead,
    status_code=status.HTTP_200_OK,
    summary="Retorna uma categoria pelo seu ID"
)
def read_category_by_id(
    category_id: str,
    db: Session = Depends(get_db),
):
    """
    Busca uma categoria pelo seu ID.
    Se não existir, retorna 404.
    """
    cat = db.get(Category, category_id)
    if not cat:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")
    return cat


@router.post("/{category_id}/primary", status_code=status.HTTP_204_NO_CONTENT,
             summary="Marca uma categoria como principal para a empresa atual")
def set_primary_category_for_current_company(
    category_id: str,
    current_company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    cat = db.get(Category, category_id)
    if not cat:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Categoria não encontrada")

    # Se a empresa ainda não possui essa categoria associada, associe
    if cat not in current_company.categories:
        current_company.categories.append(cat)

    current_company.primary_category = cat
    db.commit()
    return


@router.delete("/primary", status_code=status.HTTP_204_NO_CONTENT,
               summary="Remove a categoria principal da empresa atual")
def unset_primary_category_for_current_company(
    current_company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    current_company.primary_category = None
    db.commit()
    return