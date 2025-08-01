from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, Form, File
from sqlalchemy.orm import Session
from app.schemas.banner import BannerRead
from app.services.banner_service import (
    create_banner, get_banner,
    update_banner, delete_banner,
    list_banners
)
from app.utils.file_utils import save_file, delete_file_by_url
from app.db.deps import get_db

router = APIRouter(prefix="/banners", tags=["banners"])

@router.post("/", response_model=BannerRead, status_code=status.HTTP_201_CREATED)
def create_banner_endpoint(
    title: str = Form(...),
    order: int = Form(0),
    link_url: str = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    image_url = save_file(image, "banners")
    return create_banner(db, title, image_url, link_url, order)

@router.get("/{banner_id}", response_model=BannerRead)
def read_banner(
    banner_id: str,
    db: Session = Depends(get_db),
):
    banner = get_banner(db, banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    return banner

@router.put("/{banner_id}", response_model=BannerRead)
def update_banner_endpoint(
    banner_id: str,
    title: str = Form(...),
    order: int = Form(0),
    link_url: str = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    banner = get_banner(db, banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    image_url = banner.image_url
    if image:
        delete_file_by_url(image_url)
        image_url = save_file(image, "banners")

    return update_banner(db, banner_id, title, image_url, link_url, order)

@router.delete("/{banner_id}", response_model=BannerRead)
def delete_banner_endpoint(
    banner_id: str,
    db: Session = Depends(get_db),
):
    banner = get_banner(db, banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    if banner.image_url:
        delete_file_by_url(banner.image_url)

    return delete_banner(db, banner_id)

@router.get("/", response_model=list[BannerRead])
def list_banners_endpoint(db: Session = Depends(get_db)):
    return list_banners(db)
