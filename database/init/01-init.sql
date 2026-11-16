-- RoadWatch HP database initialization
-- Enables PostGIS and creates core schema for hazard reporting.

CREATE EXTENSION IF NOT EXISTS postgis;

-- Users: citizens and government officials who submit or manage reports.
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(20) NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'official', 'admin')),
    district        VARCHAR(50),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crowdsourced and AI-submitted hazard reports.
CREATE TABLE IF NOT EXISTS hazard_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    hazard_type     VARCHAR(40) NOT NULL CHECK (hazard_type IN (
        'road_damage', 'landslide', 'rockfall_debris', 'flooding_waterlogging', 'other'
    )),
    severity        VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'resolved')),
    location        GEOGRAPHY(POINT, 4326) NOT NULL,
    district        VARCHAR(50),
    image_urls      TEXT[] DEFAULT '{}',
    ai_confidence   DOUBLE PRECISION,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI model inference outputs linked to reports.
CREATE TABLE IF NOT EXISTS ai_detections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID REFERENCES hazard_reports(id) ON DELETE CASCADE,
    model_type      VARCHAR(30) NOT NULL CHECK (model_type IN (
        'road_damage', 'landslide', 'rockfall_debris', 'flooding_waterlogging'
    )),
    confidence      DOUBLE PRECISION NOT NULL,
    bounding_box    JSONB,
    mask_url        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common geospatial and lookup queries.
CREATE INDEX IF NOT EXISTS idx_hazard_reports_location ON hazard_reports USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_hazard_reports_type ON hazard_reports (hazard_type);
CREATE INDEX IF NOT EXISTS idx_hazard_reports_status ON hazard_reports (status);
CREATE INDEX IF NOT EXISTS idx_hazard_reports_created_at ON hazard_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_detections_report_id ON ai_detections (report_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Helpful comment for maintainers.
COMMENT ON TABLE hazard_reports IS 'Crowdsourced and AI-detected road hazards across Himachal Pradesh.';
COMMENT ON COLUMN hazard_reports.location IS 'WGS84 point (latitude/longitude) stored as PostGIS geography.';
COMMENT ON COLUMN ai_detections.bounding_box IS 'Normalized [x1, y1, x2, y2] bounding box in [0, 1] range.';
