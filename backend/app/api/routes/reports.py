import math
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session, joinedload, selectinload

from app.api.deps import get_current_user_optional, require_admin
from app.db.session import get_db
from app.models.hazard import (
    AIDetection,
    HazardReport,
    HazardType,
    ReportVerification,
    SeverityLevel,
    User,
    VerificationStatus,
)
from app.schemas.hazard import (
    HazardReportCreate,
    HazardReportRead,
    HazardReportUpdate,
    VerificationAction,
)
from app.services.ai_client import AIServiceClient

router = APIRouter(prefix="/reports", tags=["reports"])

ai_client = AIServiceClient()

# Map report hazard_type code to the AI model_type used for inference.
# The granular UI categories map onto the four deployed AI model families.
HAZARD_TYPE_TO_MODEL: dict[str, Optional[str]] = {
    "potholes": "road_damage",
    "longitudinal_cracks": "road_damage",
    "transverse_cracks": "road_damage",
    "alligator_cracks": "road_damage",
    "landslides": "landslide",
    "rockfalls": "rockfall_debris",
    "road_debris": "rockfall_debris",
    "waterlogging": "flooding_waterlogging",
    "flooding": "flooding_waterlogging",
    "other_obstructions": None,
    # Legacy broad categories remain readable for existing reports.
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
    status_code = report.status_ref.code
    resolution_status = report.resolution_status or (
        "resolved" if status_code == "resolved" else "unresolved"
    )
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
        "status": status_code,
        "resolution_status": resolution_status,
        "image_urls": report.image_urls or [],
        "ai_confidence": report.ai_confidence,
        "ai_detections": list(report.detections),
        "verification_history": list(report.verifications),
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
    reporter_id: Optional[UUID] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    bbox: Optional[str] = Query(
        None, description="minLng,minLat,maxLng,maxLat viewport filter"
    ),
    limit: int = Query(50, ge=1, le=500),
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
            selectinload(HazardReport.detections),
            selectinload(HazardReport.verifications),
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
    if reporter_id:
        query = query.filter(HazardReport.reporter_id == reporter_id)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                HazardReport.title.ilike(pattern),
                HazardReport.description.ilike(pattern),
                HazardReport.district.ilike(pattern),
            )
        )
    if bbox:
        try:
            min_lng, min_lat, max_lng, max_lat = [float(v) for v in bbox.split(",")]
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="bbox must be minLng,minLat,maxLng,maxLat",
            )
        envelope = func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
        query = query.filter(func.ST_Intersects(HazardReport.location, envelope))

    sort_columns = {
        "created_at": HazardReport.created_at,
        "updated_at": HazardReport.updated_at,
        "title": HazardReport.title,
        "district": HazardReport.district,
    }
    sort_column = sort_columns.get(sort_by, HazardReport.created_at)
    order = asc(sort_column) if sort_dir.lower() == "asc" else desc(sort_column)

    rows = query.order_by(order).offset(offset).limit(limit).all()
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
            selectinload(HazardReport.detections),
            selectinload(HazardReport.verifications),
        )
        .filter(HazardReport.id == report_id)
        .one_or_none()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    report, latitude, longitude = row
    return _report_to_dict(report, latitude, longitude)


def _load_report_row(db: Session, report_id: UUID):
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
            selectinload(HazardReport.detections),
            selectinload(HazardReport.verifications),
        )
        .filter(HazardReport.id == report_id)
        .one_or_none()
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )
    return row


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6_371_000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * radius * math.asin(math.sqrt(a))


@router.get("/{report_id}/duplicates")
def find_duplicates(
    report_id: UUID,
    radius_m: int = Query(300, ge=10, le=5000),
    db: Session = Depends(get_db),
):
    """Return nearby reports of the same category that may be duplicates."""
    report, latitude, longitude = _load_report_row(db, report_id)
    rows = (
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
        .filter(
            HazardReport.id != report_id,
            HazardReport.hazard_type_id == report.hazard_type_id,
        )
        .limit(500)
        .all()
    )
    candidates = []
    for other, other_lat, other_lng in rows:
        distance = _haversine_m(latitude, longitude, other_lat, other_lng)
        if distance <= radius_m:
            candidates.append(
                {
                    "id": other.id,
                    "title": other.title,
                    "hazard_type": other.hazard_type_ref.code,
                    "severity": other.severity_ref.code,
                    "status": other.status_ref.code,
                    "latitude": other_lat,
                    "longitude": other_lng,
                    "created_at": other.created_at,
                    "distance_m": round(distance, 1),
                }
            )
    candidates.sort(key=lambda item: item["distance_m"])
    return candidates


@router.post("/{report_id}/verify", response_model=HazardReportRead)
def verify_report(
    report_id: UUID,
    payload: VerificationAction,
    db: Session = Depends(get_db),
    reviewer: User = Depends(require_admin),
):
    return _record_verification(db, report_id, "verified", reviewer, payload.remarks)


@router.post("/{report_id}/reject", response_model=HazardReportRead)
def reject_report(
    report_id: UUID,
    payload: VerificationAction,
    db: Session = Depends(get_db),
    reviewer: User = Depends(require_admin),
):
    return _record_verification(db, report_id, "rejected", reviewer, payload.remarks)


@router.post("/{report_id}/resolve", response_model=HazardReportRead)
def resolve_report(
    report_id: UUID,
    payload: VerificationAction,
    db: Session = Depends(get_db),
    reviewer: User = Depends(require_admin),
):
    return _record_verification(db, report_id, "resolved", reviewer, payload.remarks)


def _record_verification(
    db: Session,
    report_id: UUID,
    action: str,
    reviewer: User,
    remarks: Optional[str],
):
    report, latitude, longitude = _load_report_row(db, report_id)
    status_id = _lookup_id(db, VerificationStatus, action, "status")
    report.status_id = status_id
    if action == "resolved":
        report.resolution_status = "resolved"
    elif report.resolution_status == "resolved":
        report.resolution_status = "unresolved"
    db.add(
        ReportVerification(
            report_id=report.id,
            reviewer_id=reviewer.id,
            reviewer_name=reviewer.full_name,
            action=action,
            remarks=remarks,
        )
    )
    db.add(report)
    db.commit()
    report, latitude, longitude = _load_report_row(db, report_id)
    return _report_to_dict(report, latitude, longitude)


@router.post("", response_model=HazardReportRead, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_in: HazardReportCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    from geoalchemy2 import WKTElement

    hazard_type_id = _lookup_id(db, HazardType, report_in.hazard_type, "hazard_type")
    severity_id = _lookup_id(db, SeverityLevel, report_in.severity, "severity")
    status_id = _lookup_id(db, VerificationStatus, DEFAULT_STATUS_CODE, "status")

    report = HazardReport(
        reporter_id=current_user.id if current_user else None,
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
        resolution_status="unresolved",
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
        new_status = update_data.pop("status")
        update_data["status_id"] = _lookup_id(
            db, VerificationStatus, new_status, "status"
        )
        if new_status == "resolved":
            update_data.setdefault("resolution_status", "resolved")

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
