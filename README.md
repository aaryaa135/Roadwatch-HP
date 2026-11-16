# RoadWatch HP

**AI-Powered Crowdsourced Road Hazard Detection and Monitoring Platform for Himachal Pradesh**

RoadWatch HP aims to provide a centralized platform for reporting, detecting, monitoring and visualizing road hazards across Himachal Pradesh.

## Project Modules

1. Road damage detection
2. Landslide segmentation
3. Rockfall and debris detection
4. Flooding and waterlogging detection
5. GPS-enabled hazard reporting
6. AI-based severity assessment
7. Duplicate report detection
8. Interactive GIS hazard map

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, SQLAlchemy |
| AI/ML | PyTorch, YOLO-style detection, U-Net segmentation |
| Database | PostgreSQL, PostGIS |
| Mapping | Leaflet, OpenStreetMap |
| Infrastructure | Docker, Docker Compose |

## Design Principles

- Strict government portal aesthetic: white backgrounds, black text, grey borders only.
- No gradients, colorful cards, glassmorphism, or flashy animations.
- Minimal, formal, professional; resembles an Indian government information portal.
- Responsive desktop and mobile design; accessibility prioritised.
- Never invent AI predictions or display fake statistics. When trained model weights are absent, the AI service reports `model_loaded: false` with an empty prediction set.

## Repository Structure

```text
Roadwatch-HP/
├── ai-service/              # FastAPI AI inference service (4 pipelines)
│   ├── app/
│   │   ├── main.py
│   │   ├── schemas.py
│   │   ├── shared/          # shared inference base + utilities
│   │   └── pipelines/       # road_damage, landslide, rockfall, flooding
│   ├── weights/             # model weights (kept out of Git)
│   ├── Dockerfile
│   └── requirements.txt
├── backend/                 # FastAPI API service
│   ├── app/
│   │   ├── main.py
│   │   ├── core/            # settings (pydantic-settings)
│   │   ├── db/              # SQLAlchemy engine + session
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic v2 schemas
│   │   ├── api/routes/      # /reports, /ai
│   │   └── services/        # AI service HTTP client
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── pages/           # Home, Report, Map, Admin
│   │   ├── components/      # Navbar, Footer, Button, Field, badges
│   │   ├── api.ts           # fetch client
│   │   ├── router.tsx       # tiny history-based router
│   │   └── types.ts
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── init/01-init.sql     # PostGIS schema (runs on db container start)
├── tests/
│   ├── api/                 # schema + config tests
│   └── ai/                  # AI pipeline tests (require torch)
├── docker-compose.yml
├── .env.example
├── .env                     # local secrets (git-ignored)
├── .gitignore               # model weights, datasets, node_modules excluded
└── README.md
```

## AI Modules

Each AI module has an independent inference pipeline in `ai-service/app/pipelines/`.

- Road damage: RGB image-based object detection (pothole, crack, rutting).
- Landslide: U-Net segmentation; requires 14-channel multispectral input. Ordinary RGB photographs cannot be processed directly by this module.
- Rockfall and debris: RGB image-based object detection.
- Flooding and waterlogging: RGB image-based object detection.

Trained weights belong in `ai-service/weights/<module>/` and are excluded from Git via `.gitignore`. When weights are absent, pipelines return `model_loaded: false` with no predictions — no AI predictions are ever fabricated.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ and npm (for frontend development outside Docker)
- Python 3.11+ (for backend/AI development outside Docker)

### 1. Environment

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

Never commit `.env`; it is git-ignored.

### 2. Run with Docker Compose (recommended)

```bash
docker compose up --build
```

Services:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| AI service | http://localhost:8001 |
| PostgreSQL + PostGIS | localhost:5432 |

The database schema is initialised automatically from `database/init/01-init.sql` on first start.

### 3. Run without Docker

Backend:

```bash
cd backend
pip install -r requirements.txt
cp ../../.env .env
uvicorn app.main:app --reload
```

AI service:

```bash
cd ai-service
pip install -r requirements.txt
cp ../../.env .env
uvicorn app.main:app --reload --port 8001
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

### 4. Run Tests

```bash
# Backend + shared tests (runs locally)
python -m pytest tests

# AI pipeline tests require PyTorch (run in the ai-service Docker container)
docker compose run --rm ai-service python -m pytest /app/tests 2>/dev/null || true
```

Frontend type check and build:

```bash
cd frontend
npx tsc --noEmit
npm run build
```

## API Endpoints

Backend (`GET/POST` JSON):

| Endpoint | Description |
|---|---|
| `GET /health` | Backend health |
| `GET /reports` | List hazard reports (query: hazard_type, status, district, limit, offset) |
| `GET /reports/{id}` | Get a single report |
| `POST /reports` | Create a new hazard report |
| `PATCH /reports/{id}` | Update a report (status, severity, etc.) |
| `DELETE /reports/{id}` | Delete a report |
| `POST /ai/infer` | Proxy to AI service inference (`model_type`, `image_url`) |
| `GET /ai/health` | AI service availability |

AI service:

| Endpoint | Description |
|---|---|
| `GET /health` | Service status + per-model loaded flags |
| `GET /models` | Available model types |
| `POST /infer` | Run inference on an image URL |

## Database

Schema in `database/init/01-init.sql`: `users`, `hazard_reports` (with PostGIS geography point), `ai_detections`. Hazard types: `road_damage`, `landslide`, `rockfall_debris`, `flooding_waterlogging`, `other`.

## Data & Weights Policy

- Model weights (*.pt, *.pth, *.onnx, etc.) and datasets are excluded from Git.
- Secrets are provided via `.env` (git-ignored); `.env.example` documents required keys.
- Only free and open-source tools are used.

## License

To be decided.
