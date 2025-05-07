# Clubily Backend (v1)

FastAPI + PostgreSQL backend para gestão de usuários (admin/user) com autenticação via cookie.

---

## Sumário

- [Requisitos](#requisitos)  
- [Estrutura do Projeto](#estrutura-do-projeto)  
- [Configuração de Ambiente](#configuração-de-ambiente)  
- [Instalação](#instalação)  
- [Banco de Dados & Migrações (Alembic)](#banco-de-dados--migrações-alembic)  
- [Rodando o Servidor](#rodando-o-servidor)  
- [Documentação Interativa](#documentação-interativa)  
- [Fluxo de Autenticação](#fluxo-de-autenticação)  
- [Como Adicionar Novas Entidades (Models)](#como-adicionar-novas-entidades-models)  

---

## Requisitos

- **Python** 3.11  
- **PostgreSQL** ≥ 13  
- **Git** (opcional, para versionamento)

---

## Estrutura do Projeto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── email_utils.py
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── init_db.py    ← (opcional, só se não usar Alembic)
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── token.py
│   │   └── user.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   └── user_service.py
│   └── api/
│       ├── __init__.py
│       ├── deps.py
│       └── v1/
│           ├── __init__.py
│           ├── endpoints/
│           │   ├── auth.py
│           │   └── users.py
│           └── router.py
├── alembic/                ← diretório de migrações
│   ├── env.py
│   └── versions/
├── .env.example
├── requirements.txt
└── README.md
```

---

## Configuração de Ambiente

1. **Copie** o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```
2. **Preencha** as variáveis no `.env`:

   ```dotenv
   # aplicação
   SECRET_KEY=seu_super_secret_key
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   FERNET_KEY=   # gere com comando abaixo

   # banco
   POSTGRES_SERVER=localhost
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=clubily_db

   # SMTP (envio de e-mail)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=seu_usuario
   SMTP_PASSWORD=sua_senha
   EMAIL_FROM="Clubily <suporte@clubily.com>"

   # CORS (front local)
   BACKEND_CORS_ORIGINS=http://localhost:3000
   ```

3. **Gere** a chave Fernet (32 bytes Base64 url-safe):
   ```bash
   python - << 'EOF'
   from cryptography.fernet import Fernet
   print(Fernet.generate_key().decode())
   EOF
   ```
   e cole em `FERNET_KEY`.

---

## Instalação

```bash
cd backend
python -m venv venv
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt
```

---

## Banco de Dados & Migrações (Alembic)

1. **Inicializa** Alembic (se ainda não fez):
   ```bash
   alembic init alembic
   ```
2. **Configure** no `alembic.ini`:
   ```ini
   sqlalchemy.url = postgresql+psycopg2://postgres:postgres@localhost/clubily_db
   ```
3. **Edite** `alembic/env.py` para apontar `target_metadata = Base.metadata` e importar seus models.
4. **Gere** a primeira migration:
   ```bash
   alembic revision --autogenerate -m "create users table"
   ```
5. **Aplique** todas as migrations:
   ```bash
   alembic upgrade head
   ```

---

## Rodando o Servidor

```bash
uvicorn app.main:app --reload
```

---

## Documentação Interativa

```
http://127.0.0.1:8000/docs
```

---

## Fluxo de Autenticação

1. **Registro**  
   `POST /api/v1/auth/register`  
   Body JSON:
   ```json
   {
     "name": "...",
     "email": "...",
     "password": "...",
     "company_name": "...",
     "phone": "...",
     "cpf": "12345678901",
     "role": "user"
   }
   ```
   → envia e-mail de verificação e retorna `access_token` + cookie HttpOnly.

2. **Verificação de E-mail**  
   `GET /api/v1/auth/verify?token=...`  
   → marca `is_verified = True`.

3. **Login**  
   `POST /api/v1/auth/login`  
   Body JSON:
   ```json
   { "email": "...", "password": "..." }
   ```
   → retorna token + cookie.

4. **Esqueci Senha**  
   `POST /api/v1/auth/forgot-password?email=...`  
   → envia link com token de reset.

5. **Reset de Senha**  
   `POST /api/v1/auth/reset-password`  
   Body JSON:
   ```json
   { "token": "...", "new_password": "..." }
   ```

6. **Dados do Usuário**  
   `GET /api/v1/users/me` (autenticado via cookie) → retorna perfil.

---

## Como Adicionar Novas Entidades (Models)

Sempre que criar um novo model:

1. **Defina** sua classe em `app/models/*.py`, importando `Base` de `app/db/base.py`.  
2. **Adicione** import do seu model em `alembic/env.py` (para autogenerate).  
3. **Gere** a migration:
   ```bash
   alembic revision --autogenerate -m "add <nome_da_tabela>"
   ```
4. **Aplique**:
   ```bash
   alembic upgrade head
   ```
5. **Crie** schemas em `app/schemas/`, services em `app/services/` e endpoints em `app/api/v1/endpoints/`.  
6. **Documente** no Swagger; ao subir o Uvicorn os novos endpoints aparecerão automaticamente.

---
