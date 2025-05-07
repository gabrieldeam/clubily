# backend/app/api/__init__.py

from fastapi import APIRouter
from .v1.router import router as v1_router
from ..core.config import settings

api_router = APIRouter()
api_router.include_router(v1_router, prefix=settings.API_V1_STR)
