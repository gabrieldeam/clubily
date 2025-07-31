from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base

# Cria as tabelas (opcional, use migrations para produção)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Meu Backend")

# Configuração do CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3002",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # quem pode acessar
    allow_credentials=True,           # permite envio de cookies, autorizações, etc.
    allow_methods=["*"],              # quais métodos (GET, POST, PUT…)
    allow_headers=["*"],              # quais cabeçalhos HTTP
)

@app.get("/")
def health_check():
    return {"status": "ok"}
