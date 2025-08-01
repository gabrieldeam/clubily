from sqlalchemy.orm import Session
from app.models.banner import Banner

def create_banner(db: Session, title: str, image_url: str, link_url: str | None, order: int) -> Banner:
    banner = Banner(
        title=title,
        image_url=image_url,
        link_url=link_url,
        order=order,
    )
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return banner

def update_banner(db: Session, banner_id: str, title: str, image_url: str, link_url: str | None, order: int) -> Banner | None:
    banner = get_banner(db, banner_id)
    if not banner:
        return None
    banner.title = title
    banner.image_url = image_url
    banner.link_url = link_url
    banner.order = order
    db.commit()
    db.refresh(banner)
    return banner

def get_banner(db: Session, banner_id: str) -> Banner | None:
    return db.query(Banner).filter(Banner.id == banner_id).first()

def delete_banner(db: Session, banner_id: str) -> Banner | None:
    banner = get_banner(db, banner_id)
    if banner:
        db.delete(banner)
        db.commit()
    return banner

def list_banners(db: Session) -> list[Banner]:
    return db.query(Banner).order_by(Banner.order).all()
