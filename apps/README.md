# Clubily Monorepo

Este repositório contém a aplicação Clubily, incluindo o backend e quatro frontends em Next.js:

- **backend**: serviço FastAPI
- **clubi.ly**: frontend principal (porta 3002)
- **kiosk-next**: frontend para quiosque (porta 3003)
- **portal-client**: frontend para clientes (porta 3000)
- **portal-company**: frontend para empresas (porta 3001)

## Pré-requisitos

- Python 3.x + venv
- Node.js + npm

## Configuração

1. Clone o repositório e navegue para `apps`:
   ```bash
   cd clubily/apps
   ```
2. Instale dependências:
   ```bash
   npm install
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

3. Variáveis de ambiente:
   - **Backend**: `.env.local` (dev) e `.env.production` (prod) em `backend/`.
   - **Frontends Next.js**: use `.env.development.local` para dev e `.env.production.local` para prod em cada pasta de frontend.

## Scripts

### Desenvolvimento

```bash
npm run dev
```

- Roda em paralelo:
  - `uvicorn app.main:app --reload --env-file .env.local` (backend)
  - `npm run dev` em cada frontend

### Build

```bash
npm run build
```

- Executa `npm run build` em cada frontend sequencialmente.

### Produção

```bash
npm run start
```

- Roda em paralelo:
  - `uvicorn app.main:app --env-file .env.production` (backend)
  - `npm run start` em cada frontend

## Observações

- Para parar todos os processos, use Ctrl+C.
- Lockfiles: remova lockfiles extras se desejar centralizar no root.
