# RoadWatch HP

**AI-assisted crowdsourced road hazard detection and monitoring platform for Himachal Pradesh**

RoadWatch HP is a full-stack platform for reporting, detecting, reviewing and mapping road hazards across Himachal Pradesh. Citizens submit geo-tagged reports with photographs; an AI inference service optionally analyses the images; authorised reviewers verify, reject or resolve reports; and verified hazards are visualised on an interactive GIS map with live analytics.

The platform is built around one rule: **never fabricate data**. When a trained model is unavailable, the AI service reports `model_loaded: false` and returns no predictions. Analytics are computed from stored reports, not from synthetic statistics.

## Features

- **Citizen and administrator accounts** with JWT authentication and role-based access.
- **Geo-tagged hazard reporting** with map location picker, district, severity, images and description.
- **AI-assisted detection** for road damage, rockfall/debris, flooding/waterlogging and landslide segmentation.
- **Duplicate awareness** that surfaces nearby reports of the same category for reviewers.
- **Verification workflow** with an audit trail of verify, reject and resolve actions plus remarks.
- **Interactive GIS map** with clustered markers, filters, legend and hazard detail panels.
- **Operational analytics** derived from real reports: status, severity, hazard type, district and monthly trends.
- **Validated image uploads** restricted to JPEG, PNG and WebP with magic-byte checks and a configurable size limit.
- **Honest AI reporting**: model availability is exposed in `/health` and per inference response.

## Architecture

```text
Browser (React SPA, Vite)
        │  REST/JSON + Bearer JWT
        ▼
Backend API (FastAPI, SQLAlchemy, Alembic)
        │                         │
        │ PostgreSQL + PostGIS    │ HTTP
        ▼                         ▼
Report and geospatial data   AI inference service (FastAPI)
        │                         │
        └── uploads volume        └── ai-service/weights/<model>/
```

| Component | Responsibility |
|---|---|
| `frontend/` | Public landing page, authenticated workspace, hazard map, report flow, verification, analytics |
| `backend/` | Auth, reports, map queries, analytics, uploads, AI proxy, database migrations |
| `ai-service/` | Model adapter registry and four independent inference pipelines |
| `database/` | Docker entrypoint SQL (PostGIS extension only); Alembic owns application tables |
| `tests/` | Backend schema/API tests, upload tests, optional DB and AI tests |
| `docs/` | Database schema and space for architecture, API, research and model reports |

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, Leaflet, Recharts |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic |
| Authentication | JWT bearer tokens, password hashing |
| AI/ML | PyTorch, torchvision, Pillow, NumPy, OpenCV |
| Database | PostgreSQL 16, PostGIS 3.4 |
| Mapping | Leaflet, react-leaflet, OpenStreetMap tiles, Nominatim geocoding |
| Infrastructure | Docker, Docker Compose |

## Repository Structure

```text
Roadwatch-HP/
├── ai-service/
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point (/health, /models, /infer)
│   │   ├── adapters/               # model registry + detection/segmentation adapters
│   │   ├── pipelines/              # legacy per-hazard pipeline modules
│   │   ├── shared/                 # shared inference helpers
│   │   └── schemas.py
│   ├── weights/
│   │   ├── road_damage/            # trained weights (git-ignored)
│   │   ├── rockfall/
│   │   ├── flooding/
│   │   └── landslide/
│   ├── Dockerfile
│   └── requirements.txt
├── backend/
│   ├── app/
│   │   ├── main.py                 # app factory, CORS, request IDs, error handlers
│   │   ├── api/routes/             # auth, reports, hazards, analytics, uploads, ai
│   │   ├── core/                   # settings, security, exceptions
│   │   ├── db/                     # SQLAlchemy engine and sessions
│   │   ├── migrations/             # Alembic environment and versions
│   │   ├── models/                 # ORM models
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   └── services/               # uploads, AI client, seed data
│   ├── alembic.ini
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/                  # Landing, Login, Register, Overview, Map, Reports, Verification, Analytics, Profile, Settings
│   │   ├── components/             # layout, map, reports, dashboard and UI components
│   │   ├── context/                # auth and toast providers
│   │   ├── hooks/
│   │   ├── services/api.ts         # typed API client
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── types.ts
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── init/01-init.sql            # creates the PostGIS extension on first start
├── docs/
│   └── database/schema.md
├── tests/
│   ├── api/
│   └── ai/
├── scripts/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Prerequisites

- Docker Engine 24+ with Docker Compose v2 (recommended path)
- Node.js 20+ and npm, for frontend development outside Docker
- Python 3.11+, for backend and AI development outside Docker

## Getting Started

### 1. Configure the environment

From the repository root:

```bash
cp .env.example .env
```

Edit `.env` as needed. Never commit `.env`; it is git-ignored. `.env.example` documents every supported variable.

### 2. Run everything with Docker Compose

```bash
docker compose up --build
```

| Service | URL / address |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8002 (`/health`, `/docs`) |
| AI service | http://localhost:8001 (`/health`, `/models`) |
| PostgreSQL + PostGIS | localhost:5432 |

Startup behaviour:

1. PostgreSQL starts and runs `database/init/01-init.sql`, which enables PostGIS.
2. The backend waits for the database, runs `alembic upgrade head`, then starts the API.
3. The backend seeds lookup values and development demo accounts.
4. The AI service scans each weights directory and loads any available model weights.

Uploaded images are stored in the `backend_uploads` Docker volume. Model weights are mounted from `ai-service/weights/`.

Stop services with `docker compose down`. To also delete database and upload data, use `docker compose down -v`.

### Development demo accounts

These accounts are created by the backend seed for local demonstration:

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@roadwatchhp.com` | `Admin@12345` |
| Citizen | `citizen@roadwatchhp.com` | `Citizen@12345` |

They are defined in `backend/app/services/seed.py`. Change or remove them before any non-development deployment.

### 3. Run services locally without Docker

The easiest local setup is to run PostgreSQL with Docker and run the application services on the host.

```bash
docker compose up -d db
```

#### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env` (for example from `../.env.example`) and point it at the host database:

```dotenv
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/roadwatch
AI_SERVICE_URL=http://localhost:8001
PUBLIC_BACKEND_URL=http://localhost:8002
UPLOAD_BASE_URL=http://localhost:8002/uploads
FRONTEND_URL=http://localhost:5173
SECRET_KEY=change-me-for-local-development
```

Then apply migrations and start the API:

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8002
```

#### AI service

Running the AI service through Docker Compose is recommended because the adapters search for weights under `/app/weights/<model>/`:

```bash
docker compose up --build ai-service
```

For a host run, install the requirements and adjust the adapter `weights_dir` values (or mirror the `/app/weights` layout):

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The API client defaults to `http://localhost:8002`. To use another backend URL, create `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:8002
VITE_AI_SERVICE_URL=http://localhost:8001
```

## AI Modules

Each hazard family is handled by an independent adapter in `ai-service/app/adapters/`. Weights must be placed in the corresponding directory and use a `.pt` or `.pth` file.

| Model type | Input | Classes / output | Weights directory |
|---|---|---|---|
| `road_damage` | RGB image, 640×640 | pothole, crack, rutting | `ai-service/weights/road_damage/` |
| `rockfall_debris` | RGB image, 640×640 | rockfall, debris | `ai-service/weights/rockfall/` |
| `flooding_waterlogging` | RGB image, 640×640 | flooding, waterlogging | `ai-service/weights/flooding/` |
| `landslide` | 14-band multispectral image, 256×256 | U-Net segmentation mask / coverage | `ai-service/weights/landslide/` |

Notes:

- The landslide module requires 14-channel multispectral input. Ordinary RGB photographs are not a valid substitute for production inference.
- When weights are absent, the adapter returns `model_loaded: false`, `confidence: 0.0` and an empty `predictions` list. No result is invented.
- `GET /health` reports which models are loaded; `GET /models` lists registered model types.
- Report creation automatically triggers inference for the matching model family when the report includes an image URL. AI failures never block report creation.

## API Overview

Interactive API documentation is available at `http://localhost:8002/docs` when the backend is running.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a citizen account and receive a token |
| `POST` | `/auth/login` | Authenticate and receive a bearer token |
| `GET` | `/auth/me` | Current user profile (Bearer token required) |
| `PATCH` | `/auth/me` | Update name, phone or district (Bearer token required) |
| `POST` | `/auth/change-password` | Change the current password (Bearer token required) |

Send authenticated requests with:

```http
Authorization: Bearer <access_token>
```

Registration always creates a `citizen` account. Administrator accounts are provisioned by the seed or database administration.

### Reports and verification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reports` | List reports with filtering, search, sorting, bbox and pagination |
| `GET` | `/reports/{id}` | Fetch a single report with detections and verification history |
| `POST` | `/reports` | Create a report (authentication optional; triggers AI inference) |
| `PATCH` | `/reports/{id}` | Update status, severity, title, description, district or resolution |
| `DELETE` | `/reports/{id}` | Delete a report |
| `GET` | `/reports/{id}/duplicates` | Nearby reports of the same category (`radius_m`, default 300 m) |
| `POST` | `/reports/{id}/verify` | Mark a report verified (administrator only) |
| `POST` | `/reports/{id}/reject` | Mark a report rejected (administrator only) |
| `POST` | `/reports/{id}/resolve` | Mark a report resolved (administrator only) |

`GET /reports` query parameters include `hazard_type`, `status`, `severity`, `district`, `reporter_id`, `search`, `sort_by`, `sort_dir`, `bbox` (`minLng,minLat,maxLng,maxLat`), `limit` (1–500) and `offset`.

Example report submission:

```bash
curl -X POST http://localhost:8002/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Pothole on NH-5 near Shimla",
    "description": "Large pothole in the left lane after the bypass.",
    "hazard_type": "potholes",
    "severity": "high",
    "district": "Shimla",
    "latitude": 31.1048,
    "longitude": 77.1734,
    "image_urls": []
  }'
```

### Map, analytics and uploads

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/hazards/map` | Map-oriented report list with type, status, severity, bbox and limit filters |
| `GET` | `/hazards/nearby` | Reports within a radius of a latitude/longitude (`radius_m`, `limit`) |
| `GET` | `/analytics/summary` | Real aggregate counts by status, severity, type, district and month |
| `POST` | `/uploads` | Upload a JPEG, PNG or WebP image (multipart field `file`) |
| `GET` | `/uploads/{object_name}` | Serve a stored uploaded image |
| `POST` | `/ai/infer` | Proxy inference to the AI service (`model_type`, `image_url`) |
| `GET` | `/ai/health` | AI service reachability |
| `GET` | `/health` | Backend health |

Upload limits: allowed extensions are `.jpg`, `.jpeg`, `.png` and `.webp`; content is validated by magic bytes; maximum size defaults to 10 MB (`UPLOAD_MAX_SIZE`). Stored filenames are random UUIDs.

### AI service endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service status and per-model loaded flags |
| `GET` | `/models` | Registered model types |
| `POST` | `/infer` | Run inference on an image URL for a given `model_type` |

## Database and Migrations

The schema is defined by SQLAlchemy models in `backend/app/models/` and versioned by Alembic in `backend/app/migrations/`. Full table documentation is in [`docs/database/schema.md`](docs/database/schema.md).

Core tables:

- `users`
- `hazard_types`, `severity_levels`, `verification_statuses` (lookup tables)
- `hazard_reports` (PostGIS point location)
- `report_duplicates`
- `report_verifications`
- `ai_detections`

`database/init/01-init.sql` only enables the PostGIS extension. Alembic is the source of truth for application tables.

Common commands, run from `backend/`:

```bash
alembic upgrade head                          # apply all migrations
alembic current                               # show current revision
alembic revision --autogenerate -m "message"  # create a migration from model changes
alembic downgrade -1                          # roll back one migration
```

## Testing

Install test dependencies if needed:

```bash
pip install pytest httpx
```

Run all backend and shared tests from the repository root:

```bash
python -m pytest tests -q
```

Test coverage includes schema validation, configuration, upload validation and end-to-end report/upload flows.

Additional requirements:

- **Database-backed tests** are skipped unless `ROADWATCH_TEST_DATABASE_URL` points to a running PostgreSQL/PostGIS database.
- **AI pipeline tests** require PyTorch and are skipped when it is not installed.
- **Frontend** has no automated test suite; verify it with a type check and production build:

```bash
cd frontend
npx tsc --noEmit
npm run build
```

Example database-backed test run:

```bash
export ROADWATCH_TEST_DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/roadwatch_test"
python -m pytest tests -q
```

## Configuration Reference

| Variable | Default | Purpose |
|---|---|---|
| `APP_NAME` | `RoadWatch_HP` | Application name |
| `ENVIRONMENT` | `development` | Environment label |
| `DEBUG` | `true` | FastAPI debug mode |
| `BACKEND_HOST` / `BACKEND_PORT` | `0.0.0.0` / `8000` | Backend bind address inside the container |
| `PUBLIC_BACKEND_URL` | `http://localhost:8002` | Public backend URL used in generated links |
| `UPLOAD_BASE_URL` | `http://localhost:8002/uploads` | Public prefix for stored image URLs |
| `UPLOAD_MAX_SIZE` | `10485760` | Maximum upload size in bytes (10 MB) |
| `AI_SERVICE_URL` | `http://localhost:8001` | Internal URL the backend uses to call the AI service |
| `AI_SERVICE_HOST` / `AI_SERVICE_PORT` | `0.0.0.0` / `8001` | AI service bind address |
| `DATABASE_URL` | required | SQLAlchemy/psycopg database URL |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `postgres` / `postgres` / `roadwatch` | Database container credentials |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed frontend origin for CORS |
| `SECRET_KEY` | development value | JWT signing key; must be changed for real deployments |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | Access token lifetime |
| `VITE_API_URL` | `http://localhost:8002` | Frontend API base URL |
| `VITE_AI_SERVICE_URL` | `http://localhost:8001` | Frontend AI service base URL |

## Deployment Notes

- The backend container runs `alembic upgrade head` before starting Uvicorn and listens on `$PORT` when set, which suits Render, Railway, Fly.io and similar platforms.
- The frontend Dockerfile runs the Vite development server. For production, build static assets with `npm run build` and serve `frontend/dist/` from a static host or reverse proxy.
- Update `PUBLIC_BACKEND_URL`, `UPLOAD_BASE_URL`, `FRONTEND_URL`, `VITE_API_URL` and `DATABASE_URL` for the deployed environment.
- Replace `SECRET_KEY`, database credentials and the seeded demo accounts before exposing the platform publicly.
- Persist the `postgres_data` and `backend_uploads` volumes. Model weights remain outside Git and should be mounted or downloaded during deployment.
- Use HTTPS in front of the frontend and backend; the AI service should be reachable only by the backend.

## Design and Data Principles

- Professional, accessible government-portal style interface for desktop and mobile.
- AI confidence is displayed separately from hazard severity and verification status.
- No fabricated AI predictions, statistics or production data.
- Uploads are validated by content, stored under random names and size-limited.
- Secrets and model weights are excluded from version control.

## Roadmap

- Add trained production weights for all four AI modules.
- Add automated frontend tests.
- Add role checks to report mutation endpoints where required by deployment policy.
- Add CI workflows for backend tests and frontend builds.
- Publish model evaluation reports under `docs/model-reports/`.

## License

To be decided.
