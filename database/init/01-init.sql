-- RoadWatch HP database initialization
-- The ONLY application-table source of truth is Alembic (backend/app/migrations/).
-- This init script therefore creates only the PostGIS extension, which must be
-- present before Alembic creates geometry/geography columns. It is idempotent
-- and safe to run on every database startup.

CREATE EXTENSION IF NOT EXISTS postgis;
