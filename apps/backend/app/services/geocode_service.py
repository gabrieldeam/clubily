# app/services/geocode_service.py

import time
import re
import requests
import logging
from typing import Optional

from redis import Redis
from sqlalchemy import func
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.company import Company

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s %(message)s", level=logging.DEBUG
)
logger = logging.getLogger(__name__)


def _normalize_cep(cep: Optional[str]) -> str:
    digits = re.sub(r"\D", "", cep or "")
    if len(digits) != 8:
        raise ValueError(f"CEP inválido após limpeza: {cep!r} → {digits}")
    return digits


def _addr_cache_key(
    street: Optional[str],
    number: Optional[str],
    neighborhood: Optional[str],
    city: Optional[str],
    state: Optional[str],
    postal_code: Optional[str],
) -> str:
    parts = [
        (street or "").strip().lower(),
        (number or "").strip().lower(),
        (neighborhood or "").strip().lower(),
        (city or "").strip().lower(),
        (state or "").strip().lower(),
        re.sub(r"\D", "", postal_code or ""),  # CEP só dígitos
        "brasil",
    ]
    joined = "|".join(parts)
    return f"geocode:addr:{joined}"


class GeocodeService:
    """
    Geocoding com:
      1) Nominatim estruturado (preferencial, mais preciso)
      2) Nominatim textual (fallback)
      3) AwesomeAPI por CEP (fallback)
      4) Google Maps (fallback final)
    Com cache no Redis e rate limit 1 req/s.
    """

    _last_call = 0.0
    _min_interval = 1.0  # segundos

    def __init__(self, redis: Redis):
        self.redis = redis

    def _rate_limit(self):
        elapsed = time.time() - GeocodeService._last_call
        if elapsed < GeocodeService._min_interval:
            wait = GeocodeService._min_interval - elapsed
            logger.debug("Rate limiting: sleeping %.2f seconds", wait)
            time.sleep(wait)

    # ========= MÉTODOS PÚBLICOS =========

    def geocode_postal_code(self, postal_code: str) -> tuple[float, float]:
        """
        Mantido por compatibilidade. Geocodifica por CEP apenas.
        """
        logger.info("Geocoding por CEP=%r", postal_code)
        cep = _normalize_cep(postal_code)

        # cache por CEP
        key = f"geocode:{cep}"
        cached = self.redis.get(key)
        if cached:
            lat_str, lon_str = cached.split(",")
            logger.info("Cache HIT para %s → %s,%s", cep, lat_str, lon_str)
            return float(lat_str), float(lon_str)

        # AwesomeAPI (precisa retornar lat/lng, às vezes é genérico por bairro/cidade)
        self._rate_limit()
        awesome_url = f"https://cep.awesomeapi.com.br/json/{cep}"
        try:
            resp0 = requests.get(awesome_url, timeout=10)
            GeocodeService._last_call = time.time()
            if resp0.status_code == 200:
                data0 = resp0.json()
                lat = data0.get("lat")
                lon = data0.get("lng")
                if lat is not None and lon is not None:
                    self.redis.set(key, f"{lat},{lon}", ex=60 * 60 * 24 * 30)
                    logger.info("AwesomeAPI mapeou %s → %s,%s", cep, lat, lon)
                    return float(lat), float(lon)
        except Exception as e:
            logger.error("Erro AwesomeAPI CEP %s: %s", cep, e)

        # Nominatim (textual com CEP)
        headers = {"User-Agent": settings.NOMINATIM_USER_AGENT}
        self._rate_limit()
        params_fb = {"q": f"{cep}, Brasil", "format": "json", "limit": 1}
        try:
            resp2 = requests.get(settings.NOMINATIM_URL, params=params_fb, headers=headers, timeout=10)
            GeocodeService._last_call = time.time()
            data = resp2.json()
            if data:
                lat, lon = float(data[0]["lat"]), float(data[0]["lon"])
                self.redis.set(key, f"{lat},{lon}", ex=60 * 60 * 24 * 30)
                logger.info("Nominatim fallback por CEP %s → %s,%s", cep, lat, lon)
                return lat, lon
        except Exception as e:
            logger.error("Erro Nominatim fallback CEP %s: %s", cep, e)

        # Google
        api_key = settings.GOOGLE_MAPS_API_KEY
        if api_key:
            self._rate_limit()
            google_url = "https://maps.googleapis.com/maps/api/geocode/json"
            try:
                resp3 = requests.get(google_url, params={"address": f"{cep}, Brasil", "key": api_key}, timeout=10)
                GeocodeService._last_call = time.time()
                result = resp3.json()
                if result.get("status") == "OK" and result.get("results"):
                    loc = result["results"][0]["geometry"]["location"]
                    lat, lon = float(loc["lat"]), float(loc["lng"])
                    self.redis.set(key, f"{lat},{lon}", ex=60 * 60 * 24 * 30)
                    logger.info("Google mapeou CEP %s → %s,%s", cep, lat, lon)
                    return lat, lon
            except Exception as e:
                logger.error("Erro Google CEP %s: %s", cep, e)

        raise ValueError(f"Nenhum resultado para CEP {cep}")

    def geocode_structured_address(
        self,
        *,
        street: Optional[str],
        number: Optional[str],
        neighborhood: Optional[str],
        city: Optional[str],
        state: Optional[str],
        postal_code: Optional[str],
    ) -> tuple[float, float]:
        """
        Geocodifica usando endereço completo (preferível para precisão).
        """
        cep = _normalize_cep(postal_code or "")
        key = _addr_cache_key(street, number, neighborhood, city, state, cep)

        # cache
        cached = self.redis.get(key)
        if cached:
            lat_str, lon_str = cached.split(",")
            logger.info("Cache HIT addr → %s,%s", lat_str, lon_str)
            return float(lat_str), float(lon_str)

        # 1) Nominatim estruturado
        headers = {"User-Agent": settings.NOMINATIM_USER_AGENT}
        street_line = " ".join(filter(None, [street or "", number or ""])).strip()
        params_nom = {
            "street": street_line,
            "neighbourhood": neighborhood or "",
            "city": city or "",
            "state": state or "",
            "postalcode": cep,
            "country": "Brasil",
            "format": "json",
            "limit": 1,
        }
        logger.info("Nominatim estruturado: %s", params_nom)
        try:
            self._rate_limit()
            resp = requests.get(settings.NOMINATIM_URL, params=params_nom, headers=headers, timeout=12)
            GeocodeService._last_call = time.time()
            data = resp.json()
        except Exception as e:
            logger.error("Erro Nominatim estruturado: %s", e)
            data = []

        # 2) Nominatim textual (fallback)
        if not data:
            q = ", ".join(
                filter(
                    None,
                    [
                        f"{street or ''} {number or ''}".strip(),
                        neighborhood,
                        f"{city or ''} - {state or ''}".strip(" -"),
                        cep,
                        "Brasil",
                    ],
                )
            )
            logger.info("Nominatim textual: %s", q)
            try:
                self._rate_limit()
                resp2 = requests.get(
                    settings.NOMINATIM_URL,
                    params={"q": q, "format": "json", "limit": 1},
                    headers=headers,
                    timeout=12,
                )
                GeocodeService._last_call = time.time()
                data = resp2.json()
            except Exception as e:
                logger.error("Erro Nominatim textual: %s", e)
                data = []

        # 3) AwesomeAPI por CEP (melhora ponto aproximado)
        if not data and cep:
            try:
                lat, lon = self.geocode_postal_code(cep)
                self.redis.set(key, f"{lat},{lon}", ex=60 * 60 * 24 * 30)
                logger.info("Usando AwesomeAPI/CEP como fallback do endereço")
                return lat, lon
            except Exception as e:
                logger.warning("Fallback CEP falhou: %s", e)

        # 4) Google por endereço completo
        api_key = settings.GOOGLE_MAPS_API_KEY
        if not data and api_key:
            addr_line = ", ".join(
                filter(
                    None,
                    [
                        f"{street or ''} {number or ''}".strip(),
                        neighborhood,
                        city,
                        state,
                        cep,
                        "Brasil",
                    ],
                )
            )
            google_url = "https://maps.googleapis.com/maps/api/geocode/json"
            logger.info("Google por endereço: %s", addr_line)
            try:
                self._rate_limit()
                resp3 = requests.get(google_url, params={"address": addr_line, "key": api_key}, timeout=12)
                GeocodeService._last_call = time.time()
                result = resp3.json()
                if result.get("status") == "OK" and result.get("results"):
                    loc = result["results"][0]["geometry"]["location"]
                    lat, lon = float(loc["lat"]), float(loc["lng"])
                    self.redis.set(key, f"{lat},{lon}", ex=60 * 60 * 24 * 30)
                    return lat, lon
            except Exception as e:
                logger.error("Erro Google (endereço): %s", e)

        if not data:
            raise ValueError("Nenhum resultado para o endereço informado")

        # Achou em Nominatim
        lat, lon = float(data[0]["lat"]), float(data[0]["lon"])
        self.redis.set(key, f"{lat},{lon}", ex=60 * 60 * 24 * 30)
        return lat, lon


def geocode_and_save(
    company_id: str,
    *,
    redis_url: str,
    postal_code: Optional[str] = None,
    street: Optional[str] = None,
    number: Optional[str] = None,
    neighborhood: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
):
    """
    Background task:
    - Conecta DB/Redis
    - Geocodifica (preferindo endereço completo)
    - Atualiza company.location
    """
    db = SessionLocal()
    redis = Redis.from_url(redis_url, decode_responses=True)
    geocoder = GeocodeService(redis)

    try:
        if any([street, number, neighborhood, city, state, postal_code]):
            lat, lon = geocoder.geocode_structured_address(
                street=street,
                number=number,
                neighborhood=neighborhood,
                city=city,
                state=state,
                postal_code=postal_code,
            )
        elif postal_code:
            lat, lon = geocoder.geocode_postal_code(postal_code)
        else:
            raise ValueError("Endereço/CEP não fornecido para geocodificação")

        company = db.get(Company, company_id)
        if company:
            company.location = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
            db.commit()
    except Exception as e:
        logger.error("geocode_and_save falhou para company=%s: %s", company_id, e)
    finally:
        db.close()


# Wrapper de compatibilidade (se em algum lugar antigo ainda chamar por CEP posicional)
def geocode_and_save_cep(company_id: str, postal_code: str, redis_url: str):
    return geocode_and_save(
        company_id,
        redis_url=redis_url,
        postal_code=postal_code,
    )
