# app/services/geocode_service.py

import time
import re
import requests
import logging

from redis import Redis
from sqlalchemy import func
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.company import Company

# Configura o logger para exibir informações detalhadas
logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s %(message)s", level=logging.DEBUG
)
logger = logging.getLogger(__name__)


class GeocodeService:
    """
    Geocoding via AwesomeAPI + cache Redis + rate_limit 1 req/s.
    Fallback to Nominatim API (structured + textual), then Google Maps API.
    """

    _last_call = 0.0
    _min_interval = 1.0  # segundos mínimos entre chamadas externas

    def __init__(self, redis: Redis):
        self.redis = redis

    def _rate_limit(self):
        """
        Garante um intervalo mínimo entre chamadas externas.
        """
        elapsed = time.time() - GeocodeService._last_call
        if elapsed < GeocodeService._min_interval:
            wait = GeocodeService._min_interval - elapsed
            logger.debug("Rate limiting: sleeping %.2f seconds", wait)
            time.sleep(wait)

    def geocode_postal_code(self, postal_code: str) -> tuple[float, float]:
        logger.info("Iniciando geocoding para CEP=%r", postal_code)

        # 1) Normaliza o CEP: mantém apenas dígitos
        cep = re.sub(r"\D", "", postal_code or "")
        logger.debug("CEP normalizado: %s", cep)
        if len(cep) != 8:
            logger.error("CEP inválido após limpeza: %r → %s", postal_code, cep)
            raise ValueError(f"CEP inválido após limpeza: {postal_code!r} → {cep}")

        # 2) Verifica cache Redis
        key = f"geocode:{cep}"
        cached = self.redis.get(key)
        if cached:
            lat_str, lon_str = cached.split(",")
            logger.info("Cache HIT para %s → %s,%s", cep, lat_str, lon_str)
            return float(lat_str), float(lon_str)
        logger.info("Cache MISS para %s", cep)

        # 3) Chamada ao AwesomeAPI
        self._rate_limit()
        awesome_url = f"https://cep.awesomeapi.com.br/json/{cep}"
        logger.info("Chamando AwesomeAPI para CEP %s", cep)
        try:
            resp0 = requests.get(awesome_url)
            GeocodeService._last_call = time.time()
            if resp0.status_code == 200:
                data0 = resp0.json()
                lat = data0.get("lat")
                lon = data0.get("lng")
                if lat is not None and lon is not None:
                    logger.info("AwesomeAPI mapeou %s → %s,%s", cep, lat, lon)
                    self.redis.set(key, f"{lat},{lon}", ex=60 * 60 * 24 * 30)
                    return float(lat), float(lon)
                logger.info("AwesomeAPI não retornou lat/lng para CEP %s", cep)
            else:
                logger.error("AwesomeAPI retornou status %s para CEP %s", resp0.status_code, cep)
        except Exception as e:
            logger.error("Erro ao chamar AwesomeAPI para CEP %s: %s", cep, e)

        # 4) Nominatim estruturado
        headers = {"User-Agent": settings.NOMINATIM_USER_AGENT}
        self._rate_limit()
        params_nom = {"postalcode": cep, "countrycodes": "br", "format": "json", "limit": 1}
        logger.info("Chamando Nominatim estruturado para CEP %s", cep)
        resp = requests.get(settings.NOMINATIM_URL, params=params_nom, headers=headers)
        GeocodeService._last_call = time.time()
        try:
            data = resp.json()
        except Exception as e:
            logger.error("Resposta inválida do Nominatim para CEP %s: %s", cep, e)
            data = []
        logger.info("Nominatim estruturado retornou %d resultados", len(data))

        # 5) Nominatim textual
        if not data:
            self._rate_limit()
            params_fb = {"q": f"{cep}, Brasil", "format": "json", "limit": 1}
            logger.info("Fallback textual Nominatim para CEP %s", cep)
            resp2 = requests.get(settings.NOMINATIM_URL, params=params_fb, headers=headers)
            GeocodeService._last_call = time.time()
            try:
                data = resp2.json()
            except Exception as e:
                logger.error("Resposta inválida do fallback Nominatim para CEP %s: %s", cep, e)
                data = []
            logger.info("Nominatim fallback retornou %d resultados", len(data))

        # 6) Google Maps API
        if not data:
            logger.info("Tentando Google Maps API para CEP %s", cep)
            api_key = settings.GOOGLE_MAPS_API_KEY
            if not api_key:
                logger.error("Google Maps API key não configurada")
                raise ValueError(f"Nenhum resultado para CEP {cep}")

            self._rate_limit()
            google_url = "https://maps.googleapis.com/maps/api/geocode/json"
            params_google = {"address": f"{cep}, Brasil", "key": api_key}
            resp3 = requests.get(google_url, params=params_google)
            GeocodeService._last_call = time.time()
            try:
                result = resp3.json()
            except Exception as e:
                logger.error("Resposta inválida do Google para CEP %s: %s", cep, e)
                result = {}

            status = result.get("status")
            count = len(result.get("results", []))
            logger.info("Google Maps API status=%s retornou %d resultados", status, count)

            if status != "OK" or not result.get("results"):
                logger.error("Google Maps API não encontrou CEP %s", cep)
                raise ValueError(f"Nenhum resultado para CEP {cep}")

            loc = result["results"][0]["geometry"]["location"]
            lat, lon = float(loc["lat"]), float(loc["lng"])
            logger.info("Google Maps API mapeou %s → %s,%s", cep, lat, lon)
        else:
            # Usa Nominatim
            lat, lon = float(data[0]["lat"]), float(data[0]["lon"])
            logger.info("Usando Nominatim para CEP %s → %s,%s", cep, lat, lon)

        # 7) Cache e retorno
        self.redis.set(key, f"{lat},{lon}", ex=60 * 60 * 24 * 30)
        logger.info("Cache gravado para CEP %s → %s,%s", cep, lat, lon)
        return lat, lon


def geocode_and_save(company_id: str, postal_code: str, redis_url: str):
    """
    Background task para:
    1) Conectar no DB e Redis
    2) Chamar GeocodeService
    3) Salvar company.location
    """
    db = SessionLocal()
    redis = Redis.from_url(redis_url, decode_responses=True)
    geocoder = GeocodeService(redis)

    try:
        lat, lon = geocoder.geocode_postal_code(postal_code)
        company = db.get(Company, company_id)
        if company:
            company.location = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
            db.commit()
    except Exception:
        pass
    finally:
        db.close()
