# backend/app/api/v1/router.py

from fastapi import APIRouter
from .endpoints import (
    auth, cashback_metrics, users, companies, categories, addresses, 
    cashback_associations, cashback_programs, asaas_webhook, 
    company_payments, admin_payments, asaas_customer, wallet, 
    fee_settings, admin_commissions, commissions, transfer_methods,
    point_purchases, points_wallet, point_plans, admin_point_plans, points,
    branches, inventory_items, purchases, product_categories, admin_point,
    leaderboard, rewards, points_metrics, purchase_metrics
)

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
router.include_router(cashback_metrics.router, prefix="/cashback-metrics", tags=["metrics"])
router.include_router(fee_settings.router, prefix="/admin/fee-settings", tags=["fee_settings"])
router.include_router(commissions.router, prefix="/commissions", tags=["commissions"])
router.include_router(admin_commissions.router, prefix="/admin/commissions", tags=["admin_commissions"])
router.include_router(transfer_methods.router, prefix="/transfer_methods", tags=["transfer_methods"])
router.include_router(point_purchases.router, prefix="/point-purchases", tags=["point_purchases"])
router.include_router(points_wallet.router, prefix="/points", tags=["points"])
router.include_router(point_plans.router, prefix="/point-plans", tags=["point_plans"])
router.include_router(admin_point_plans.router, prefix="/point-plans/admin", tags=["admin_point_plans"])
router.include_router(points.router, prefix="/points", tags=["points"])
router.include_router(branches.router, prefix="/branches", tags=["branches"])
router.include_router(inventory_items.router, prefix="/inventory", tags=["inventory"])
router.include_router(purchases.router, prefix="/purchases", tags=["purchases"])
router.include_router(product_categories.router, prefix="/product-categories", tags=["product_categories"])
router.include_router(admin_point.router, prefix="/admin_point", tags=["admin_points"])
router.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])
router.include_router(rewards.router, prefix="/rewards", tags=["rewards"])
router.include_router(points_metrics.router, prefix="/points_metrics", tags=["points_metrics"])
router.include_router(purchase_metrics.router, prefix="/purchase_metrics", tags=["purchase_metrics"])
