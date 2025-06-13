# backend/app/api/v1/router.py

from fastapi import APIRouter
from .endpoints import auth, users
from .endpoints import auth, users, companies, categories, addresses, cashback_associations, cashback_programs

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(companies.router, prefix="/companies", tags=["companies"])
router.include_router(categories.router, prefix="/categories", tags=["categories"])
router.include_router(addresses.router, prefix="/addresses", tags=["addresses"])
router.include_router(cashback_programs.router, prefix="/companies/me/cashback-programs", tags=["cashback_programs"])
router.include_router(cashback_associations.router, prefix="/cashbacks", tags=["cashback_associations"])