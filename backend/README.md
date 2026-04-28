# Backend (FastAPI)

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `DATABASE_URL` to your **Supabase Postgres** connection string and `SUPABASE_URL` to your project URL.

## Run

```bash
cd backend
source .venv/bin/activate
export $(grep -v '^#' .env | xargs)
uvicorn app.main:app --reload --port 8000
```

## Migrations

```bash
cd backend
source .venv/bin/activate
export $(grep -v '^#' .env | xargs)
alembic revision -m "init" --autogenerate
alembic upgrade head
```

