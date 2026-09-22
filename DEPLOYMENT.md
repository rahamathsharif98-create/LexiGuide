# LexiGuide — Production Deployment & Operations Guide

## 1. System Architecture Overview

LexiGuide is an AI-powered intelligent learning support platform for children with reading difficulties. It is structured as a resilient, decoupled web application composed of:
1. **Frontend**: Modern Single Page Application (SPA) built with React 19, Tailwind CSS, and Vite.
2. **Backend**: Async REST API built with FastAPI (Python 3.12), SQLAlchemy 2.0 ORM, and Pydantic v2.
3. **Database**: PostgreSQL (v15+) with Alembic migration version control.
4. **Speech & Intelligence Services**: Whisper-compatible audio ingestion with graceful mock/browser fallback.

```
       +-------------------------+
       |   Client Browser / PWA   |
       +------------+------------+
                    |
           HTTPS / WebSocket
                    |
                    v
    +---------------+----------------+
    |       Reverse Proxy / CDN       |
    |    (Nginx / Cloudflare / Caddy) |
    +-------+----------------+-------+
            | Static Assets  | /api/*
            v                v
    +-------+-------+  +----+------------------+
    |  Vite Build   |  |   FastAPI Backend     |
    |  (/dist)      |  |  (Uvicorn Workers)   |
    +---------------+  +----+------------------+
                            |
                     SQLAlchemy Pool
                            |
                            v
               +------------+------------+
               |   PostgreSQL Database   |
               |  (Persistent Storage)   |
               +-------------------------+
```

---

## 2. Environment Configuration

### 2.1 Backend (`backend/.env`)

| Variable | Type | Production Example | Description |
|---|---|---|---|
| `DATABASE_URL` | string | `postgresql+psycopg2://app:secret@db.prod.internal:5432/readquest` | Primary connection string for PostgreSQL |
| `TEST_DATABASE_URL` | string | `postgresql+psycopg2://app:secret@db.prod.internal:5432/readquest_test` | Isolated test runner database |
| `FRONTEND_ORIGIN` | string | `https://lexiguide.org,https://www.lexiguide.org` | Allowed CORS origins (comma-separated) |
| `JWT_SECRET` | string | `CHANGE_ME_IN_PRODUCTION_MINIMUM_32_CHARACTERS` | 256-bit cryptographically secure secret |
| `API_BASE_URL` | string | `https://api.lexiguide.org` | Public API base address |
| `AI_MODE` | string | `real` (or `mock`) | Enables Whisper STT inference |
| `WHISPER_MODEL_SIZE` | string | `base` | Model tier (`tiny`, `base`, `small`, `medium`) |
| `MAX_AUDIO_UPLOAD_MB` | integer | `15` | Maximum audio payload accepted |

### 2.2 Frontend (`.env`)

| Variable | Type | Production Example | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | string | `https://api.lexiguide.org` | Target FastAPI backend URL for client requests |

---

## 3. Containerized Deployment (Docker & Compose)

### 3.1 Docker Compose Deployment
LexiGuide includes a multi-container `docker-compose.yml` for unified backend and PostgreSQL orchestration:

```bash
# 1. Populate production environment
cp backend/.env.example backend/.env
cp .env.example .env

# 2. Build and start services in detached mode
docker compose up --build -d

# 3. Check service health
docker compose ps
docker compose logs -f backend
```

### 3.2 Standalone Backend Dockerfile
The backend uses a multi-stage Python 3.12-slim base image with `ffmpeg` pre-installed for audio processing:

```bash
cd backend
docker build -t lexiguide-backend:latest .
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql+psycopg2://user:pass@host:5432/readquest" \
  -e JWT_SECRET="your-256-bit-secret" \
  -e FRONTEND_ORIGIN="https://lexiguide.org" \
  lexiguide-backend:latest
```

---

## 4. Database Migrations (Alembic)

Database schema is managed using Alembic. Never run manual schema modifications in production.

```bash
# Within backend virtual environment or container:
cd backend
alembic upgrade head
```

To rollback the most recent migration:
```bash
alembic downgrade -1
```

---

## 5. Cloud Platform Deployment Blueprints

### 5.1 Frontend (Vercel / Netlify / Cloudflare Pages)
1. Link GitHub repository.
2. Build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment variables:
   - `VITE_API_BASE_URL`: `https://your-api-domain.com`

### 5.2 Backend (Render / Fly.io / AWS ECS / Railway)
1. Deploy from `backend/Dockerfile` or as a Python Web Service.
2. Port: `8000`.
3. Health check path: `/api/health`.
4. Command:
   ```bash
   alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

### 5.3 Database (Neon / Supabase / AWS RDS / GCP Cloud SQL)
- Ensure PostgreSQL 15+ instance.
- Provide connection pooler URL (e.g. PgBouncer) or direct connection string in `DATABASE_URL`.

---

## 6. Health Checks, Monitoring & Telemetry

- **Liveness probe**: `GET /api/health` returns `{"status": "ok"}` with 200 HTTP code (lightweight for load balancers).
- **Readiness probe**: `GET /api/health/detailed` tests database connectivity and reports AI operational mode:
  ```json
  {
    "status": "ok",
    "database": "ok",
    "ai_mode": "mock",
    "whisper": "simulated",
    "tts": "fallback_browser"
  }
  ```

---

## 7. Security Best Practices

1. **Strict CORS Policy**: Only whitelist exact client domains in `FRONTEND_ORIGIN`.
2. **Ephemerality**: Audio files uploaded for speech analysis are processed in memory / temporary directories and immediately unlinked.
3. **Log Sanitization**: Bearer authentication tokens and passwords are redacted from application log streams.
4. **Content Security Policy (CSP)**: Ensure headers allow audio recording permissions via `Permissions-Policy: microphone=(self)`.
