"""Map-focused hazard queries."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.routes.reports import _haversine_m, list_reports
from app.db.session import get_db

router = APIRouter(prefix="/hazards", tags=["hazards"])


@router.get("/map")
def map_reports(
    db: Session = Depends(get_db),
    hazard_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    bbox: Optional[str] = Query(None),
    limit: int = Query(500, ge=1, le=1000),
):
    return list_reports(
        db=db,
        hazard_type=hazard_type,
        status=status,
        severity=severity,
        district=None,
        reporter_id=None,
        search=None,
        sort_by="created_at",
        sort_dir="desc",
        bbox=bbox,
        limit=limit,
        offset=0,
    )


@router.get("/nearby")
def nearby_reports(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_m: int = Query(1000, ge=10, le=50_000),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    reports = list_reports(
        db=db,
        hazard_type=None,
        status=None,
        severity=None,
        district=None,
        reporter_id=None,
        search=None,
        sort_by="created_at",
        sort_dir="desc",
        bbox=None,
        limit=500,
        offset=0,
    )
    nearby = []
    for report in reports:
        distance = _haversine_m(lat, lng, report["latitude"], report["longitude"])
        if distance <= radius_m:
            nearby.append({**report, "distance_m": round(distance, 1)})
    nearby.sort(key=lambda item: item["distance_m"])
    return nearby[:limit]
