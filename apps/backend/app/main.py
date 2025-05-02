from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import settings

app = FastAPI(
    title="Loyalty Ecosystem API",
    openapi_url=f"/api/v1/openapi.json" # Adjust path as needed
)

# Set all CORS enabled origins
# In production, restrict this to your frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for now (development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to the Loyalty Ecosystem API"}

# Add other middleware or event handlers if needed

# Example: Startup event (e.g., check DB connection)
# @app.on_event("startup")
# async def startup_event():
#     try:
#         # Test Supabase connection
#         response = await settings.supabase.table("stores").select("id").limit(1).execute()
#         print("Supabase connection successful.")
#     except Exception as e:
#         print(f"Error connecting to Supabase on startup: {e}")

# If running directly with uvicorn:
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)

