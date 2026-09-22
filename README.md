# LexiGuide

[![Live Demo](https://img.shields.io/badge/Live_Demo-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://fanciful-blancmange-ad2659.netlify.app/)
[![IEEE Documentation](https://img.shields.io/badge/EPICS_Report-IEEE_Paper_Style-blue?style=for-the-badge&logo=readthedocs)](docs/EPICS_ReadQuest_IEEE_Documentation.md)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.12-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Worlds-black?style=for-the-badge&logo=three.js)](https://threejs.org/)

> 🌐 **Live Production Deployment**: **[https://fanciful-blancmange-ad2659.netlify.app/](https://fanciful-blancmange-ad2659.netlify.app/)**  
> 📄 **Academic Documentation**: **[EPICS IEEE Research-Style Project Report](docs/EPICS_ReadQuest_IEEE_Documentation.md)**

**LexiGuide: An AI-Powered Intelligent Learning Support Platform for Children with Reading Difficulties**  
*EPICS Project — Supporting children aged 4–10 in building strong literacy foundations.*

> [!IMPORTANT]
> **Educational Non-Clinical Positioning**: LexiGuide is an educational screening, skill-building, and learning support platform. It observes reading patterns, identifies phonetic and fluency growth areas, and adapts educational activities to each child's pace. **It does not provide a medical, psychological, or clinical diagnosis of dyslexia or any other learning disability.**

---

## 1. System Architecture

LexiGuide is an AI-powered intelligent learning support platform for children with reading difficulties. It is engineered as a decoupled, resilient web platform designed for low-latency child interactions, secure parental oversight, and educator cohort analytics.

```
                      +------------------------------------------+
                      |         Client Browser / PWA            |
                      |   React 19 + Vite + Tailwind CSS         |
                      |   (Child / Parent / Teacher Portals)     |
                      +--------------------+---------------------+
                                           |
                                   HTTPS / REST / JWT
                                           |
                                           v
                      +------------------------------------------+
                      |          FastAPI REST Engine             |
                      |   Python 3.12 + Pydantic v2 Validation   |
                      +--------------------+---------------------+
                                           |
                     +---------------------+---------------------+
                     |                                           |
                     v                                           v
    +---------------------------------+         +---------------------------------+
    |     AI & Learning Services      |         |    PostgreSQL Relational DB     |
    | - Speech Recognition (Whisper)  |         | - SQLAlchemy 2.0 ORM            |
    | - Adaptive Difficulty Engine    |         | - Alembic Schema Migrations     |
    | - Next-Best-Action Selector     |         | - Users, Sessions, Progress     |
    | - Multimodal Presentation Gen   |         | - Reading Fingerprints          |
    +---------------------------------+         +---------------------------------+
```

### 1.1 Frontend
- **Framework**: React 19 Single Page Application bundled with Vite.
- **Styling**: Tailwind CSS with custom playful, high-contrast themes and WCAG 2.1 AA accessibility (min 48px touch targets, Dyslexic font options, keyboard navigation, aria-live announcements).
- **Portals**:
  - **Child Portal**: Playful, distraction-free environment featuring "Read With Me", "Speak & Shine", Phonics Arcade, and visual journey maps.
  - **Parent Portal**: Weekly learning plans, reading pattern insights, daily time analytics, and home practice tips.
  - **Teacher Portal**: Classroom roster management, tiered intervention flags, cohort progress charts, and individualized student reading profiles.

### 1.2 Backend
- **Framework**: FastAPI (async ASGI) on Python 3.12.
- **ORM & Migrations**: SQLAlchemy 2.0 with Alembic version-controlled migrations.
- **Database**: PostgreSQL 15+ in production (SQLite supported for local development and test automation).
- **Security**: JWT authentication (HMAC-SHA256), bcrypt password hashing, role-based access control (Child / Parent / Teacher), object-level relationship validation (preventing cross-tenant data leakage), and CORS enforcement.

### 1.3 AI & Intelligence Services
- **Speech-to-Text**: Pluggable architecture supporting local OpenAI Whisper models (`tiny`, `base`, `small`, `medium`) and deterministic mock/browser fallbacks.
- **Phonological Analysis**: Word and phoneme alignment algorithms identifying letter reversals (e.g., b/d, p/q), phonetic substitutions, omissions, and hesitations.
- **Adaptive Learning Engine**: Dynamically calculates child mastery per skill, selects the Next-Best-Action based on spaced repetition, and generates custom decodable stories tailored to current learning goals.

---

## 2. Quick Start & Local Development

### 2.1 Prerequisites
- **Node.js**: v18.0+ (v20+ recommended)
- **Python**: v3.11+ (v3.12 recommended)
- **PostgreSQL** (optional for local dev; SQLite fallback is available out of the box)

### 2.2 Frontend Setup

```bash
# 1. Install frontend dependencies
npm install

# 2. Configure frontend environment
cp .env.example .env

# 3. Launch Vite development server
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### 2.3 Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate a Python virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS / Linux:
source .venv/bin/activate

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env

# 5. Run database migrations
alembic upgrade head

# 6. Seed demo data (demo users, students, activities)
python -m app.seed

# 7. Start the FastAPI development server
uvicorn app.main:app --reload --port 8000
```
The API documentation (Swagger UI) will be available at `http://localhost:8000/docs`.

---

## 3. Environment Variables

### 3.1 Frontend (`.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL for the FastAPI backend API |

### 3.2 Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./readquest.db` | Primary database URI (`postgresql+psycopg2://...` in prod) |
| `TEST_DATABASE_URL` | `sqlite:///./readquest_test.db` | Isolated database URI for pytest test runners |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Allowed CORS origins (comma-separated for multiple) |
| `JWT_SECRET` | `dev_secret_key_change_in_production` | Cryptographic secret for signing JWT access tokens |
| `JWT_ALGORITHM` | `HS256` | Token signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Token expiration duration (7 days default) |
| `AI_MODE` | `mock` | AI execution mode: `mock` (deterministic) or `real` (Whisper) |
| `WHISPER_MODEL_SIZE` | `base` | Whisper model tier: `tiny`, `base`, `small`, `medium` |
| `MAX_AUDIO_UPLOAD_MB` | `15` | Maximum allowed audio payload size in megabytes |

---

## 4. Default Demo Accounts

The database seed (`python -m app.seed`) provisions the following accounts:

| Role | Email | Password | Details |
|---|---|---|---|
| **Parent** | `parent@readquest.demo` | `demo1234` | Parent account linked to demo child Aarav |
| **Teacher** | `teacher@readquest.demo` | `demo1234` | Teacher account managing Class 1-A cohort |
| **Child** | `child.aarav@readquest.demo` | `demo1234` | Direct login for student Aarav (Age 7, Grade 1) |

*Note: The frontend also supports instant offline demo mode directly from the landing page if the backend is not running.*

---

## 5. API Overview & Key Endpoints

| Route Group | Base Path | Key Endpoints | Description |
|---|---|---|---|
| **Authentication** | `/api/auth` | `POST /login`, `GET /me`, `POST /register` | JWT token issuance, session hydration, profile fetch |
| **Learning Engine**| `/api/learning` | `POST /session`, `GET /plan`, `GET /next-action` | Adaptive session logging, weekly plan generation, next activity |
| **Reading Pipeline**| `/api/reading` | `POST /session`, `POST /session-audio`, `GET /fingerprint/{id}` | Audio upload, alignment scoring, reading pattern profiling |
| **Content Engine** | `/api/content` | `POST /generate`, `GET /stories`, `GET /activities` | Phonics-constrained story generation, activity retrieval |
| **Search Engine**  | `/api/search` | `GET /` | Query stories, phoneme drills, and games |
| **Multimodal**     | `/api/multimodal` | `POST /generate`, `GET /presentation/{id}` | Multi-sensory lesson cards, slides, audio cues |
| **Analytics**      | `/api/analytics` | `GET /child/{id}/progress`, `GET /child/{id}/trends` | Mastery progression, time-on-task, pattern evolution |
| **Health**         | `/api/health` | `GET /`, `GET /detailed` | Liveness check and deep subsystem readiness probe |

---

## 6. AI Engine & Speech Pipeline Modes

LexiGuide features an intelligent multi-modal speech pipeline with zero-friction fallbacks:

1. **Real Mode (`AI_MODE=real`)**:
   - Ingests child audio recordings (WAV, MP3, WebM, OGG).
   - Transcribes audio using OpenAI Whisper (`tiny`, `base`, `small`, or `medium`).
   - Runs dynamic time warping and phoneme alignment against target decodable texts.
   - Flags phonetic substitutions, omissions, additions, and hesitations (>1.5s pauses).
   - Generates updated Reading Observations and updates the child's Reading Pattern Profile.

2. **Mock Mode (`AI_MODE=mock`)**:
   - Provides deterministic, realistic speech transcription and phonological pattern scoring for testing and low-resource environments.
   - Does not require GPU resources or external speech model weights.

3. **Client-Side Fallback**:
   - If the backend is disconnected, the frontend's built-in `mockAiService.js` maintains full functionality in the browser, allowing children to practice without interruption.

---

## 7. Testing & Quality Assurance

### 7.1 Backend Test Suite (Pytest)
The backend test suite covers authentication, RBAC authorization, security headers, database migrations, speech alignment, content generation, and the validation suite:

```bash
cd backend
pytest -v
```
- **Total Backend Tests**: 458 passed (20 test modules)

### 7.2 Frontend Test Suite (Vitest)
The frontend test suite covers all portal views, WCAG accessibility, touch targets, state management, search, and validation:

```bash
npx vitest run
```
- **Total Frontend Tests**: 734 passed (31 test files)

### 7.3 Production Build Verification
To verify the production asset build:
```bash
npm run build
```
Generates minified, production-ready static assets in the `dist/` directory.

---

## 8. Production Deployment

For detailed deployment blueprints, containerization instructions, database clustering, and security checklists, refer to **[`DEPLOYMENT.md`](./DEPLOYMENT.md)**.

- **Frontend Target**: Vercel / Netlify / Cloudflare Pages / Nginx static host.
- **Backend Target**: Docker container on AWS ECS / Render / Fly.io / Railway / Kubernetes.
- **Database Target**: Managed PostgreSQL (AWS RDS / Supabase / Neon / GCP Cloud SQL).
- **Current Release Status**: `DEPLOYMENT READY` (Requires production cloud credentials and target database provisioning).

---

## 9. License

Developed under the EPICS program. All rights reserved.
