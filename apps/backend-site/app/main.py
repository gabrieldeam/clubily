from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# IMPORTAÇÕES NECESSÁRIAS:
from app.core.config import settings
from app.db.init_db import init_db
from app.routes.author_route   import router as author_router
from app.routes.category_route import router as category_router
from app.routes.banner_route   import router as banner_router
from app.routes.post_route     import router as post_router
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Meu Backend")

app.mount("/static", StaticFiles(directory=os.path.join("app", "static")), name="static")

# 1) Evento de startup (só em DEV, se usar Alembic remova depois)
@app.on_event("startup")
def on_startup():
    init_db()

# 2) CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3) Inclui todos os routers
app.include_router(author_router)
app.include_router(category_router)
app.include_router(banner_router)
app.include_router(post_router)

@app.get("/")
def health_check():
    return {"status": "ok"}
