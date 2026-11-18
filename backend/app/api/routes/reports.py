from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.hazard import (
    AIDetection,
    HazardReport,
    HazardType,
    SeverityLevel,
    VerificationStatus,
)
from app.schemas.hazard import (
    HazardReportCreate,
    HazardReportRead,
    HazardReportUpdate,
)
from app.services.ai_client import AIServiceClient

router = APIRouter(prefix="/reports", tags=["reports"])

ai_client = AIServiceClient()

# Map report hazard_type code to the AI model_type used for inference.
HAZARD_TYPE_TO_MODEL: dict[str, Optional[str]] = {
    "road_damage": "road_damage",
    "landslide": "landslide",
    "rockfall_debris": "rockfall_debris",
    "flooding_waterlogging": "flooding_waterlogging",
    "other": None,
}

DEFAULT_STATUS_CODE = "pending"


def _lookup_id(db: Session, model, code: str, field: str) -> UUID:
    """Resolve a lookup-table code to its UUID primary key."""
    row = db.query(model).filter(model.code == code).one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field}: '{code}'",
        )
    return row.id


def _report_to_dict(report: HazardReport, latitude: float, longitude: float) -> dict:
    """Serialize an ORM report into the shape expected by HazardReportRead."""
    return {
        "id": report.id,
        "reporter_id": report.reporter_id,
        "title": report.title,
        "description": report.description,
        "hazard_type": report.hazard_type_ref.code,
        "severity": report.severity_ref.code,
        "district": report.district,
        "latitude": latitude,
        "longitude": longitude,
        "status": report.status_ref.code,
        "image_urls": report.image_urls,
        "ai_confidence": report.ai_confidence,
        "ai_detections": list(report.detections),
        "created_at": report.created_at,
        "updated_at": report.updated_at,
    }


@router.get("", response_model=List[HazardReportRead])
def list_reports(
    db: Session = Depends(get_db),
    hazard_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    query = (
        db.query(
            HazardReport,
            func.ST_Y(HazardReport.location).label("latitude"),
            func.ST_X(HazardReport.location).label("longitude"),
        )
        .options(
            joinedload(HazardReport.hazard_type_ref),
            joinedload(HazardReport.severity_ref),
            joinedload(HazardReport.status_ref),
        )
    )
    if hazard_type:
        query = query.join(HazardReport.hazard_type_ref).filter(
            HazardType.code == hazard_type
        )
    if status:
        query = query.join(HazardReport.status_ref).filter(
            VerificationStatus.code == status
        )
    if severity:
        query = query.join(HazardReport.severity_ref).filter(
            SeverityLevel.code == severity
        )
    if district:
        query = query.filter(HazardReport.district == district)
    rows = (
        query.order_by(HazardReport.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_report_to_dict(report, latitude, longitude) for report, latitude, longitude in rows]


@router.get("/{report_id}", response_model=HazardReportRead)
def get_report(report_id: UUID, db: Session = Depends(get_db)):
    row = (
        db.query(
            HazardReport,
            func.ST_Y(HazardReport.location).label("latitude"),
            func.ST_X(HazardReport.location).label("longitude"),
        )
        .options(
            joinedload(HazardReport.hazard_type_ref),
            joinedload(HazardReport.severity_ref),
            joinedload(HazardReport.status_ref),
        )
        .filter(HazardReport.id == report_id)
        .one_or_none()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    report, latitude, longitude = row
    return _report_to_dict(report, latitude, longitude)


@router.post("", response_model=HazardReportRead, status_code=status.HTTP_201_CREATED)
async def create_report(report_in: HazardReportCreate, db: Session = Depends(get_db)):
    from geoalchemy2 import WKTElement

    hazard_type_id = _lookup_id(db, HazardType, report_in.hazard_type, "hazard_type")
    severity_id = _lookup_id(db, SeverityLevel, report_in.severity, "severity")
    status_id = _lookup_id(db, VerificationStatus, DEFAULT_STATUS_CODE, "status")

    report = HazardReport(
        title=report_in.title,
        description=report_in.description,
        hazard_type_id=hazard_type_id,
        severity_id=severity_id,
        status_id=status_id,
        district=report_in.district,
        location=WKTElement(
            f"POINT({report_in.longitude} {report_in.latitude})", srid=4326
        ),
        image_urls=report_in.image_urls or [],
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Run AI inference on the first uploaded image, if a model exists for this hazard type.
    model_type = HAZARD_TYPE_TO_MODEL.get(report_in.hazard_type)
    if model_type and report_in.image_urls:
        image_url = report_in.image_urls[0]
        try:
            result = await ai_client.infer(model_type, image_url)
            if result.get("model_loaded"):
                confidence = float(result.get("confidence", 0.0))
                report.ai_confidence = confidence
                detection = AIDetection(
                    report_id=report.id,
                    model_type=model_type,
                    confidence=confidence,
                    bounding_box=result.get("bounding_box"),
                    mask_url=result.get("mask_url"),
                )
                db.add(detection)
                db.commit()
                db.refresh(report)
        except Exception:
            # AI inference failure must not block report creation.
            pass

    return _report_to_dict(report, report_in.latitude, report_in.longitude)


@router.patch("/{report_id}", response_model=HazardReportRead)
def update_report(
    report_id: UUID,
    report_in: HazardReportUpdate,
    db: Session = Depends(get_db),
):
    report = db.get(HazardReport, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    update_data = report_in.model_dump(exclude_unset=True)
    if "severity" in update_data:
        update_data["severity_id"] = _lookup_id(
            db, SeverityLevel, update_data.pop("severity"), "severity"
        )
    if "status" in update_data:
        update_data["status_id"] = _lookup_id(
            db, VerificationStatus, update_data.pop("status"), "status"
        )

    for field, value in update_data.items():
        setattr(report, field, value)

    db.add(report)
    db.commit()
    db.refresh(report)

    lat_lon = (
        db.query(
            func.ST_Y(HazardReport.location).label("latitude"),
            func.ST_X(HazardReport.location).label("longitude"),
        )
        .filter(HazardReport.id == report_id)
        .one()
    )
    return _report_to_dict(report, lat_lon.latitude, lat_lon.longitude)


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(report_id: UUID, db: Session = Depends(get_db)):
    report = db.get(HazardReport, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    db.delete(report)
    db.commit()
    return None
