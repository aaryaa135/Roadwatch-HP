"""Aggregated analytics computed from real hazard reports."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.hazard import (
    HazardReport,
    HazardType,
    SeverityLevel,
    VerificationStatus,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _grouped_counts(db: Session, code_column, join_condition):
    rows = (
        db.query(code_column, func.count(HazardReport.id))
        .join(HazardReport, join_condition)
        .group_by(code_column)
        .all()
    )
    return [{"code": code, "count": count} for code, count in rows]


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    total = db.query(func.count(HazardReport.id)).scalar() or 0

    by_status_rows = (
        db.query(VerificationStatus.code, func.count(HazardReport.id))
        .join(HazardReport, HazardReport.status_id == VerificationStatus.id)
        .group_by(VerificationStatus.code)
        .all()
    )
    by_status = {code: count for code, count in by_status_rows}

    verified = by_status.get("verified", 0)
    pending = by_status.get("pending", 0)
    rejected = by_status.get("rejected", 0)
    resolved = by_status.get("resolved", 0)

    by_hazard_type = _grouped_counts(
        db, HazardType.code, HazardReport.hazard_type_id == HazardType.id
    )
    by_severity = _grouped_counts(
        db, SeverityLevel.code, HazardReport.severity_id == SeverityLevel.id
    )

    severity_counts = {row["code"]: row["count"] for row in by_severity}
    high_severity = severity_counts.get("high", 0) + severity_counts.get("critical", 0)

    by_district_rows = (
        db.query(HazardReport.district, func.count(HazardReport.id))
        .filter(HazardReport.district.isnot(None))
        .group_by(HazardReport.district)
        .order_by(func.count(HazardReport.id).desc())
        .all()
    )
    by_district = [
        {"district": district, "count": count}
        for district, count in by_district_rows
    ]

    monthly_rows = (
        db.query(
            func.to_char(HazardReport.created_at, "YYYY-MM").label("month"),
            func.count(HazardReport.id),
        )
        .group_by("month")
        .order_by("month")
        .all()
    )
    monthly = [{"month": month, "count": count} for month, count in monthly_rows]

    return {
        "total_reports": total,
        "verified": verified,
        "pending": pending,
        "rejected": rejected,
        "resolved": resolved,
        "high_severity": high_severity,
        "by_hazard_type": by_hazard_type,
        "by_severity": by_severity,
        "by_status": [
            {"code": code, "count": count} for code, count in by_status_rows
        ],
        "by_district": by_district,
        "monthly": monthly,
    }
