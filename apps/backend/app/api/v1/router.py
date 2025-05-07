# backend/app/api/v1/router.py

from fastapi import APIRouter
from .endpoints import auth, users
from .endpoints import auth, users, companies

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(companies.router, prefix="/companies", tags=["companies"])