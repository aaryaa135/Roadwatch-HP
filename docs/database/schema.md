# RoadWatch HP Database Schema

**Database:** PostgreSQL 16 + PostGIS 3.4
**ORM:** SQLAlchemy 2.0
**Migrations:** Alembic (see `backend/alembic.ini`, `backend/app/migrations/`)

## Entity-Relationship Summary

```
users 1:N hazard_reports
hazard_types 1:N hazard_reports
severity_levels 1:N hazard_reports
verification_statuses 1:N hazard_reports
hazard_reports 1:N ai_detections
hazard_reports N:M hazard_reports  (via report_duplicates)
```

## Tables

### users
Citizens and government officials who submit or manage hazard reports.

| Column | Type | Null | Notes |
|--------|------|------|-------|
| id | UUID | NO | PK, default `gen_random_uuid()` |
| full_name | varchar(100) | NO | |
| email | varchar(255) | NO | Unique, indexed |
| phone | varchar(20) | YES | |
| role | varchar(20) | NO | Default `citizen` |
| district | varchar(50) | YES | HP district |
| is_active | boolean | NO | Default true |
| created_at | timestamptz | NO | Default `now()` |

### hazard_types (lookup)
Supported hazard categories.

| Column | Type | Null | Notes |
|--------|------|------|-------|
| id | UUID | NO | PK |
| code | varchar(40) | NO | Unique, indexed. Values: `road_damage`, `landslide`, `rockfall_debris`, `flooding_waterlogging`, `other` |
| name | varchar(100) | NO | Human-readable label |
| description | text | YES | |
| is_active | boolean | NO | Default true |
| created_at | timestamptz | NO | |

### severity_levels (lookup)
Severity grades for hazard reports.

| Column | Type | Null | Notes |
|--------|------|------|-------|
| id | UUID | NO | PK |
| code | varchar(20) | NO | Unique, indexed. Values: `low`, `medium`, `high`, `critical` |
| name | varchar(50) | NO | |
| sort_order | int | NO | Default 0, for UI ordering |
| description | text | YES | |
| is_active | boolean | NO | Default true |
| created_at | timestamptz | NO | |

### verification_statuses (lookup)
Review/verification status of a report.

| Column | Type | Null | Notes |
|--------|------|------|-------|
| id | UUID | NO | PK |
| code | varchar(20) | NO | Unique, indexed. Values: `pending`, `verified`, `rejected`, `resolved` |
| name | varchar(50) | NO | |
| description | text | YES | |
| is_active | boolean | NO | Default true |
| created_at | timestamptz | NO | |

### hazard_reports
Core report record. Location is stored as a PostGIS `geography(POINT, 4326)` column (WGS84 latitude/longitude).

| Column | Type | Null | Notes |
|--------|------|------|-------|
| id | UUID | NO | PK |
| reporter_id | UUID | YES | FK → `users.id` (SET NULL on delete) |
| hazard_type_id | UUID | NO | FK → `hazard_types.id` (RESTRICT) |
| severity_id | UUID | NO | FK → `severity_levels.id` (RESTRICT) |
| status_id | UUID | NO | FK → `verification_statuses.id` (RESTRICT) |
| title | varchar(200) | NO | |
| description | text | YES | |
| location | geography(POINT,4326) | NO | PostGIS point; GiST index |
| district | varchar(50) | YES | |
| image_urls | text[] | NO | Default `{}` |
| ai_confidence | float | YES | AI model confidence (0–1) |
| created_at | timestamptz | NO | |
| updated_at | timestamptz | NO | Auto-updated on row change |

Indexes: `hazard_type_id`, `severity_id`, `status_id`, `created_at DESC`, GiST on `location`.

### report_duplicates
Tracks duplicate-report relationships. A report can be flagged as a duplicate of an original (canonical) report. One original can have many duplicates; a duplicate points to exactly one original.

| Column | Type | Null | Notes |
|--------|------|------|-------|
| id | UUID | NO | PK |
| original_report_id | UUID | NO | FK → `hazard_reports.id` (CASCADE) |
| duplicate_report_id | UUID | NO | FK → `hazard_reports.id` (CASCADE) |
| detection_method | varchar(20) | NO | `manual` or `ai` |
| confidence | float | YES | AI confidence when auto-detected |
| detected_at | timestamptz | NO | |
| created_at | timestamptz | NO | |

Constraint: `original_report_id <> duplicate_report_id` (a report cannot be its own duplicate).

Indexes on both FK columns.

### ai_detections
AI inference outputs linked to a report.

| Column | Type | Null | Notes |
|--------|------|------|-------|
| id | UUID | NO | PK |
| report_id | UUID | YES | FK → `hazard_reports.id` (CASCADE) |
| model_type | varchar(30) | NO | `road_damage`, `landslide`, `rockfall_debris`, `flooding_waterlogging` |
| confidence | float | NO | 0–1 |
| bounding_box | jsonb | YES | Normalized [x1,y1,x2,y2] |
| mask_url | text | YES | Segmentation mask URL (landslide) |
| created_at | timestamptz | NO | |

## Key Relationships

1. **User → Reports** (1:N): A user can submit many reports. Deactivating a user does not delete their reports (`reporter_id` set to NULL).
2. **HazardType → Reports** (1:N): Each report has exactly one hazard type.
3. **SeverityLevel → Reports** (1:N): Each report has exactly one severity.
4. **VerificationStatus → Reports** (1:N): Each report has exactly one status.
5. **Report → AIDetections** (1:N): A report can have multiple AI detection records (one per model run).
6. **Report → Report** (N:M via `report_duplicates`): Original report ←→ Duplicate report. Used for duplicate detection; an original can have many duplicate reports pointing to it.

## GIS

- PostGIS extension is required (`CREATE EXTENSION IF NOT EXISTS postgis`).
- `hazard_reports.location` is a `geography(POINT, 4326)` column.
- A GiST index (`ix_hazard_reports_location`) supports distance/nearest-neighbor queries.

## Migrations

Run from the `backend/` directory:

```bash
# Generate a new migration from model changes
alembic revision --autogenerate -m "describe_change"

# Apply migrations to the database
alembic upgrade head

# Check current migration state
alembic current

# Roll back one migration
alembic downgrade -1
```

Configuration lives in `backend/alembic.ini`; the migration environment (`backend/app/migrations/env.py`) reads `DATABASE_URL` from the application settings (`.env` / environment variables).

## Note on `database/init/01-init.sql`

The raw SQL init script in `database/init/01-init.sql` is executed by the Docker entrypoint on first database startup. It enables PostGIS and creates the core tables. Alembic is the system for schema evolution going forward; do not run both `01-init.sql` table creation and `alembic upgrade head` against the same empty database, as they would conflict. For fresh deployments, prefer Alembic migrations managed via `alembic upgrade head`.
