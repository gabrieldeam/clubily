from fastapi import APIRouter

# Import individual route modules here
from . import routes_checkin
from . import routes_rules
from . import routes_surveys
from . import routes_ads
from . import routes_billing
# Import other route modules as they are created

api_router = APIRouter()

# Include routers from modules
api_router.include_router(routes_checkin.router, prefix="/checkin", tags=["Check-in"])
api_router.include_router(routes_rules.router, prefix="/rules", tags=["Rules"])
api_router.include_router(routes_surveys.router, prefix="/surveys", tags=["Surveys"])
api_router.include_router(routes_ads.router, prefix="/ads", tags=["Ads"])
api_router.include_router(routes_billing.router, prefix="/billing", tags=["Billing"])
# Include other routers

