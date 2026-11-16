from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.hazard import AIDetection, HazardReport
from app.schemas.hazard import (
    AIDetectionCreate,
    HazardReportCreate,
    HazardReportRead,
    HazardReportUpdate,
)
from app.services.ai_client import AIServiceClient

router = APIRouter(prefix="/reports", tags=["reports"])

ai_client = AIServiceClient()

# Map report hazard_type to the AI model_type used for inference.
HAZARD_TYPE_TO_MODEL: dict[str, Optional[str]] = {
    "road_damage": "road_damage",
    "landslide": "landslide",
    "rockfall_debris": "rockfall_debris",
    "flooding_waterlogging": "flooding_waterlogging",
    "other": None,
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
    query = db.query(HazardReport)
    if hazard_type:
        query = query.filter(HazardReport.hazard_type == hazard_type)
    if status:
        query = query.filter(HazardReport.status == status)
    if severity:
        query = query.filter(HazardReport.severity == severity)
    if district:
        query = query.filter(HazardReport.district == district)
    return query.order_by(HazardReport.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/{report_id}", response_model=HazardReportRead)
def get_report(report_id: UUID, db: Session = Depends(get_db)):
    report = db.get(HazardReport, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


@router.post("", response_model=HazardReportRead, status_code=status.HTTP_201_CREATED)
async def create_report(report_in: HazardReportCreate, db: Session = Depends(get_db)):
    from geoalchemy2 import WKTElement

    report = HazardReport(
        title=report_in.title,
        description=report_in.description,
        hazard_type=report_in.hazard_type,
        severity=report_in.severity,
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

    return report


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
    for field, value in update_data.items():
        setattr(report, field, value)

    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(report_id: UUID, db: Session = Depends(get_db)):
    report = db.get(HazardReport, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    db.delete(report)
    db.commit()
    return None
