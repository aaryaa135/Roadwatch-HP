"""End-to-end report lifecycle integration tests.

These tests require a running PostgreSQL/PostGIS database via
``ROADWATCH_TEST_DATABASE_URL``. They are skipped in environments where that
is unavailable (e.g. local development without Docker). They use the FastAPI
TestClient against the real report routes with a dependency override for the
database session.
"""

import importlib.util
import io
import os
import uuid

import pytest
from fastapi.testclient import TestClient

_geoalchemy2_available = importlib.util.find_spec("geoalchemy2") is not None
_test_db_url = os.environ.get("ROADWATCH_TEST_DATABASE_URL")

skip_if_no_db = pytest.mark.skipif(
    not (_geoalchemy2_available and _test_db_url),
    reason="DB-backed route tests require geoalchemy2 and ROADWATCH_TEST_DATABASE_URL",
)


@pytest.fixture
def db_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.db.session import Base

    engine = create_engine(_test_db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        _seed_lookups(session)
        session.commit()
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def _seed_lookups(session):
    from app.models.hazard import (
        HazardType,
        SeverityLevel,
        VerificationStatus,
    )

    session.add_all(
        [
            HazardType(code="road_damage", name="Road damage"),
            HazardType(code="landslide", name="Landslide"),
            HazardType(code="rockfall_debris", name="Rockfall and debris"),
            HazardType(code="flooding_waterlogging", name="Flooding and waterlogging"),
            HazardType(code="other", name="Other"),
            SeverityLevel(code="low", name="Low", sort_order=1),
            SeverityLevel(code="medium", name="Medium", sort_order=2),
            SeverityLevel(code="high", name="High", sort_order=3),
            SeverityLevel(code="critical", name="Critical", sort_order=4),
            VerificationStatus(code="pending", name="Pending"),
            VerificationStatus(code="verified", name="Verified"),
            VerificationStatus(code="rejected", name="Rejected"),
            VerificationStatus(code="resolved", name="Resolved"),
        ]
    )


def _make_client(session):
    from app.api.routes.reports import router as reports_router
    from app.api.routes.uploads import router as uploads_router
    from app.db.session import get_db as real_get_db
    from fastapi import FastAPI

    test_app = FastAPI()
    test_app.include_router(reports_router)
    test_app.include_router(uploads_router)

    def override_get_db():
        yield session

    test_app.dependency_overrides[real_get_db] = override_get_db
    return TestClient(test_app)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@skip_if_no_db
def test_health_endpoint():
    from app.main import app

    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


# ---------------------------------------------------------------------------
# Report CRUD
# ---------------------------------------------------------------------------


@skip_if_no_db
def test_create_report(db_session):
    client = _make_client(db_session)
    response = client.post(
        "/reports/",
        json={
            "title": "Pothole on NH-5 near Shimla",
            "description": "Large pothole in the right lane.",
            "hazard_type": "road_damage",
            "severity": "high",
            "district": "Shimla",
            "latitude": 31.1048,
            "longitude": 77.1734,
            "image_urls": [],
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
    assert data["image_urls"] == []
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data

    report_id = data["id"]

    # Fetch back and verify persistence.
    response = client.get(f"/reports/{report_id}")
    assert response.status_code == 200
    fetched = response.json()
    assert fetched["id"] == report_id
    assert fetched["status"] == "pending"


@skip_if_no_db
def test_create_report_invalid_hazard_type(db_session):
    client = _make_client(db_session)
    response = client.post(
        "/reports/",
        json={
            "title": "Bad type",
            "hazard_type": "not_a_real_type",
            "latitude": 31.0,
            "longitude": 77.0,
        },
    )
    assert response.status_code == 400, response.text


@skip_if_no_db
def test_create_report_invalid_coordinates(db_session):
    client = _make_client(db_session)
    # Latitude > 90 should be rejected by Pydantic before reaching DB.
    response = client.post(
        "/reports/",
        json={
            "title": "Bad coords",
            "hazard_type": "other",
            "latitude": 91.0,
            "longitude": 77.0,
        },
    )
    assert response.status_code == 422, response.text


@skip_if_no_db
def test_get_nonexistent_report(db_session):
    client = _make_client(db_session)
    fake_id = str(uuid.uuid4())
    response = client.get(f"/reports/{fake_id}")
    assert response.status_code == 404, response.text


@skip_if_no_db
def test_update_report_status_transitions(db_session):
    client = _make_client(db_session)

    create = client.post(
        "/reports/",
        json={
            "title": "To update",
            "hazard_type": "other",
            "severity": "low",
            "latitude": 30.9,
            "longitude": 77.1,
        },
    )
    assert create.status_code == 201
    report_id = create.json()["id"]

    # Pending -> verified
    response = client.patch(f"/reports/{report_id}", json={"status": "verified"})
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "verified"

    # Verified -> resolved
    response = client.patch(f"/reports/{report_id}", json={"status": "resolved"})
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "resolved"

    # Invalid status
    response = client.patch(f"/reports/{report_id}", json={"status": "archived"})
    assert response.status_code == 400, response.text


@skip_if_no_db
def test_delete_report(db_session):
    client = _make_client(db_session)

    create = client.post(
        "/reports/",
        json={
            "title": "To delete",
            "hazard_type": "other",
            "severity": "low",
            "latitude": 30.9,
            "longitude": 77.1,
        },
    )
    assert create.status_code == 201
    report_id = create.json()["id"]

    response = client.delete(f"/reports/{report_id}")
    assert response.status_code == 204, response.text

    # Confirm it is gone.
    response = client.get(f"/reports/{report_id}")
    assert response.status_code == 404


@skip_if_no_db
def test_delete_nonexistent_report(db_session):
    client = _make_client(db_session)
    fake_id = str(uuid.uuid4())
    response = client.delete(f"/reports/{fake_id}")
    assert response.status_code == 404, response.text


@skip_if_no_db
def test_list_reports_filters_and_pagination(db_session):
    client = _make_client(db_session)

    client.post(
        "/reports/",
        json={
            "title": "Pothole A",
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
            "title": "Landslide B",
            "hazard_type": "landslide",
            "severity": "medium",
            "district": "Mandi",
            "latitude": 31.7,
            "longitude": 76.9,
        },
    )

    response = client.get("/reports/?hazard_type=road_damage")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["hazard_type"] == "road_damage"

    response = client.get("/reports/?status=pending")
    assert response.status_code == 200
    assert len(response.json()) == 2

    response = client.get("/reports/?severity=high")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["severity"] == "high"

    # Pagination
    response = client.get("/reports/?limit=1&offset=0")
    assert response.status_code == 200
    assert len(response.json()) == 1

    response = client.get("/reports/?limit=1&offset=1")
    assert response.status_code == 200
    assert len(response.json()) == 1


# ---------------------------------------------------------------------------
# Upload via HTTP
# ---------------------------------------------------------------------------


@skip_if_no_db
def test_upload_endpoint_returns_url(db_session, monkeypatch):
    import tempfile
    import app.services.upload as upload_mod

    with tempfile.TemporaryDirectory() as tmpdir:
        monkeypatch.setattr(upload_mod.settings, "upload_dir", tmpdir)
        monkeypatch.setattr(
            upload_mod.settings,
            "upload_base_url",
            "http://localhost:8002/uploads",
        )

        client = _make_client(db_session)

        content = (
            b"\xff\xd8\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00"
            + b"\x00" * 100
        )
        files = {"file": ("photo.jpg", io.BytesIO(content), "image/jpeg")}
        response = client.post("/uploads/", files=files)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["url"].startswith("http://localhost:8002/uploads/")
        assert data["filename"] == "photo.jpg"

        # Retrieve the uploaded image.
        object_name = data["url"].rsplit("/", 1)[-1]
        get_response = client.get(f"/uploads/{object_name}")
        assert get_response.status_code == 200
        assert get_response.headers["content-type"].startswith("image/")


@skip_if_no_db
def test_upload_endpoint_rejects_unsupported_file(db_session):
    client = _make_client(db_session)
    files = {"file": ("document.txt", io.BytesIO(b"not an image"), "text/plain")}
    response = client.post("/uploads/", files=files)
    assert response.status_code == 400, response.text


# ---------------------------------------------------------------------------
# Report with image URL persists correctly
# ---------------------------------------------------------------------------


@skip_if_no_db
def test_report_with_image_url_persists(db_session, monkeypatch):
    import tempfile
    import app.services.upload as upload_mod

    with tempfile.TemporaryDirectory() as tmpdir:
        monkeypatch.setattr(upload_mod.settings, "upload_dir", tmpdir)
        monkeypatch.setattr(
            upload_mod.settings,
            "upload_base_url",
            "http://localhost:8002/uploads",
        )

        client = _make_client(db_session)

        content = (
            b"\xff\xd8\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00"
            + b"\x00" * 100
        )
        files = {"file": ("photo.jpg", io.BytesIO(content), "image/jpeg")}
        upload_response = client.post("/uploads/", files=files)
        assert upload_response.status_code == 201
        image_url = upload_response.json()["url"]

        create = client.post(
            "/reports/",
            json={
                "title": "Hazard with photo",
                "hazard_type": "landslide",
                "severity": "critical",
                "district": "Shimla",
                "latitude": 31.1048,
                "longitude": 77.1734,
                "image_urls": [image_url],
            },
        )
        assert create.status_code == 201, create.text
        data = create.json()
        assert data["image_urls"] == [image_url]

        # Fetch back and verify image URL persisted.
        report_id = data["id"]
        fetched = client.get(f"/reports/{report_id}")
        assert fetched.status_code == 200
        assert fetched.json()["image_urls"] == [image_url]
