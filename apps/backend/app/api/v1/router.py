# backend/app/api/v1/router.py

from fastapi import APIRouter
from .endpoints import auth, users
from .endpoints import auth, users, companies, categories, addresses, cashback_associations, cashback_programs, asaas_webhook, company_payments, admin_payments, asaas_customer, wallet

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(companies.router, prefix="/companies", tags=["companies"])
router.include_router(categories.router, prefix="/categories", tags=["categories"])
router.include_router(addresses.router, prefix="/addresses", tags=["addresses"])
router.include_router(cashback_programs.router, prefix="/companies/me/cashback-programs", tags=["cashback_programs"])
router.include_router(cashback_associations.router, prefix="/cashbacks", tags=["cashback_associations"])
router.include_router(asaas_webhook.router, prefix="/webhooks", tags=["webhooks"])
router.include_router(company_payments.router, prefix="/credits", tags=["company_payments"])
router.include_router(admin_payments.router, prefix="/admin", tags=["admin_payments"])
router.include_router(asaas_customer.router, tags=["asaas_customer"])
router.include_router(wallet.router, prefix="/wallet", tags=["wallet"])