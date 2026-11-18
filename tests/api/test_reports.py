"""Focused tests for hazard report creation, listing and updating.

The Pydantic schema tests run without a database. The DB-backed route tests
require ``geoalchemy2`` and a running Postgres instance (via
``ROADWATCH_TEST_DATABASE_URL``); they are skipped in environments where those
are unavailable (e.g. local development without Docker).
"""

import importlib.util
import os
import uuid

import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient

from backend.app.schemas.hazard import (
    HazardReportCreate,
    HazardReportRead,
    HazardReportUpdate,
)

# ---------------------------------------------------------------------------
# Pydantic schema tests (no database required)
# ---------------------------------------------------------------------------


def test_valid_report_create():
    report = HazardReportCreate(
        title="Pothole on NH-5 near Shimla",
        description="Large pothole in the right lane.",
        hazard_type="road_damage",
        severity="high",
        district="Shimla",
        latitude=31.1048,
        longitude=77.1734,
        image_urls=[],
    )
    assert report.hazard_type == "road_damage"
    assert report.severity == "high"
    assert report.latitude == 31.1048
    assert report.longitude == 77.1734


def test_report_create_defaults():
    report = HazardReportCreate(
        title="Landslide near Kalka",
        description="Rocks on the road.",
        hazard_type="landslide",
        latitude=30.8,
        longitude=76.9,
    )
    assert report.severity == "medium"
    assert report.image_urls is None


def test_report_create_rejects_latitude_above_90():
    with pytest.raises(ValidationError):
        HazardReportCreate(
            title="Bad",
            hazard_type="other",
            latitude=91.0,
            longitude=77.0,
        )


def test_report_create_rejects_longitude_below_minus_180():
    with pytest.raises(ValidationError):
        HazardReportCreate(
            title="Bad",
            hazard_type="other",
            latitude=31.0,
            longitude=-181.0,
        )


def test_report_update_partial():
    patch = HazardReportUpdate(status="verified")
    assert patch.status == "verified"
    assert patch.severity is None
    assert patch.title is None


def test_hazard_report_read_accepts_string_codes():
    """The read schema exposes hazard_type/severity/status as string codes."""
    data = {
        "id": uuid.uuid4(),
        "reporter_id": None,
        "title": "Pothole",
        "description": None,
        "hazard_type": "road_damage",
        "severity": "high",
        "district": "Shimla",
        "latitude": 31.1048,
        "longitude": 77.1734,
        "status": "verified",
        "image_urls": [],
        "ai_confidence": None,
        "ai_detections": [],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
    }
    report = HazardReportRead.model_validate(data)
    assert report.hazard_type == "road_damage"
    assert report.severity == "high"
    assert report.status == "verified"
    assert report.latitude == 31.1048


# ---------------------------------------------------------------------------
# DB-backed route tests (require geoalchemy2 + Postgres)
# ---------------------------------------------------------------------------

_geoalchemy2_available = importlib.util.find_spec("geoalchemy2") is not None
_test_db_url = os.environ.get("ROADWATCH_TEST_DATABASE_URL")


@pytest.mark.skipif(
    not (_geoalchemy2_available and _test_db_url),
    reason="DB-backed route tests require geoalchemy2 and ROADWATCH_TEST_DATABASE_URL",
)
class TestReportRoutes:
    @pytest.fixture(autouse=True)
    def _setup(self):
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from app.db.session import Base
        from app.db.session import get_db as real_get_db

        self.engine = create_engine(_test_db_url)
        self.SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )
        Base.metadata.create_all(bind=self.engine)

        session = self.SessionLocal()
        try:
            self._seed_lookups(session)
            session.commit()
        finally:
            session.close()

        yield

        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def _seed_lookups(self, session):
        from app.models.hazard import (
            HazardType,
            SeverityLevel,
            VerificationStatus,
        )

        session.add_all(
            [
                HazardType(code="road_damage", name="Road damage"),
                HazardType(code="landslide", name="Landslide"),
                HazardType(code="other", name="Other"),
                SeverityLevel(code="low", name="Low", sort_order=1),
                SeverityLevel(code="medium", name="Medium", sort_order=2),
                SeverityLevel(code="high", name="High", sort_order=3),
                VerificationStatus(code="pending", name="Pending"),
                VerificationStatus(code="verified", name="Verified"),
            ]
        )

    def _client(self, session):
        from app.api.routes.reports import router as reports_router

        from fastapi import FastAPI

        test_app = FastAPI()
        test_app.include_router(reports_router)

        def override_get_db():
            yield session

        test_app.dependency_overrides[real_get_db] = override_get_db
        return TestClient(test_app)

    def test_create_report(self):
        from app.db.session import get_db as real_get_db

        session = self.SessionLocal()
        try:
            client = self._client(session)
            response = client.post(
                "/reports/",
                json={
                    "title": "Pothole on NH-5",
                    "description": "Large pothole.",
                    "hazard_type": "road_damage",
                    "severity": "high",
                    "district": "Shimla",
                    "latitude": 31.1048,
                    "longitude": 77.1734,
                },
            )
            assert response.status_code == 201, response.text
            data = response.json()
            assert data["status"] == "pending"
            assert data["hazard_type"] == "road_damage"
            assert data["severity"] == "high"
            assert data["latitude"] == 31.1048
            assert data["longitude"] == 77.1734
            assert data["district"] == "Shimla"
            assert "id" in data
            report_id = data["id"]
        finally:
            session.close()

        # Fetch back and verify persistence.
        session = self.SessionLocal()
        try:
            client = self._client(session)
            response = client.get(f"/reports/{report_id}")
            assert response.status_code == 200
            assert response.json()["status"] == "pending"
        finally:
            session.close()

    def test_list_reports_with_filters(self):
        from app.db.session import get_db as real_get_db

        session = self.SessionLocal()
        try:
            client = self._client(session)
            client.post(
                "/reports/",
                json={
                    "title": "Pothole",
                    "description": "d",
                    "hazard_type": "road_damage",
                    "severity": "high",
                    "district": "Shimla",
                    "latitude": 31.1048,
                    "longitude": 77.1734,
                },
            )
            client.post(
                "/reports/",
                json={
                    "title": "Landslide",
                    "description": "d",
                    "hazard_type": "landslide",
                    "severity": "medium",
                    "district": "Mandi",
                    "latitude": 31.7,
                    "longitude": 76.9,
                },
            )
            response = client.get("/reports/?hazard_type=road_damage")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["hazard_type"] == "road_damage"

            response = client.get("/reports/?status=pending")
            assert response.status_code == 200
            assert len(response.json()) == 2
        finally:
            session.close()

    def test_update_report_status(self):
        from app.db.session import get_db as real_get_db

        session = self.SessionLocal()
        try:
            client = self._client(session)
            create = client.post(
                "/reports/",
                json={
                    "title": "To update",
                    "description": "d",
                    "hazard_type": "other",
                    "severity": "low",
                    "district": "Solan",
                    "latitude": 30.9,
                    "longitude": 77.1,
                },
            )
            assert create.status_code == 201
            report_id = create.json()["id"]

            response = client.patch(
                f"/reports/{report_id}",
                json={"status": "verified", "severity": "critical"},
            )
            assert response.status_code == 200, response.text
            data = response.json()
            assert data["status"] == "verified"
            assert data["severity"] == "critical"
        finally:
            session.close()
