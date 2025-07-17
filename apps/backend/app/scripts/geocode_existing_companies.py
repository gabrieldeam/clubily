# apps/backend/app/scripts/geocode_existing_companies.py

from app.db.session import SessionLocal
from app.services.geocode_service import GeocodeService
from redis import Redis
from app.core.config import settings
from sqlalchemy import select, func
from app.models.company import Company

def run():
    db = SessionLocal()
    redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    geocoder = GeocodeService(redis)

    # 1) todas as empresas sem location
    empresas = (
        db.query(Company)
        .filter(Company.location == None)
        .all()
    )

    # 2) geocode e salva
    for emp in empresas:
        try:
            lat, lon = geocoder.geocode_postal_code(emp.postal_code)
            emp.location = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
            print(f"Geocoded {emp.id} → ({lat}, {lon})")
        except Exception as e:
            print(f"Falha ao geocodificar {emp.id}: {e}")

    db.commit()
    db.close()

if __name__ == "__main__":
    run()
