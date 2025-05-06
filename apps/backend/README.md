# Clubily Backend (v1)

FastAPI + PostgreSQL backend para gestão de usuários (admin/user) com autenticação via cookie.

## Requisitos

* Python 3.11
* PostgreSQL ≥ 13

## Instalação

```bash
cd backend
python -m venv venv && source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Banco de dados (Alembic)

```bash
# Inicializa o diretório de migrações
alembic init alembic

# Gera a primeira migration a partir dos models
alembic revision --autogenerate -m "create users table"

# Aplica todas as migrations pendentes
alembic upgrade head
```
