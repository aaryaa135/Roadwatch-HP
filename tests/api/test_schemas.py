"""Schema validation tests for the backend API contracts."""

from pydantic import ValidationError

from backend.app.schemas.hazard import (
    HazardReportCreate,
    HazardReportRead,
)


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


def test_hazard_report_read_from_attributes():
    try:
        HazardReportCreate(
            title="Pothole",
            description="desc",
            hazard_type="road_damage",
            severity="low",
            district="Shimla",
            latitude=91.0,
            longitude=77.0,
        )
    except ValidationError:
        return
    raise AssertionError("Expected ValidationError for latitude > 90")


def test_hazard_report_read_from_attributes():
    class Fake:
        id = "00000000-0000-0000-0000-000000000000"
        reporter_id = None
        title = "Pothole"
        description = None
        hazard_type = "road_damage"
        severity = "medium"
        status = "pending"
        district = "Shimla"
        latitude = 31.0
        longitude = 77.0
        image_urls = []
        ai_confidence = None
        created_at = "2024-01-01T00:00:00Z"
        updated_at = "2024-01-01T00:00:00Z"

    report = HazardReportRead.model_validate(Fake())
    assert report.title == "Pothole"
    assert report.status == "pending"
