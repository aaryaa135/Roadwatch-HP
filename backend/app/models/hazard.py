"""SQLAlchemy 2.0 ORM models for RoadWatch HP database.

Normalized schema:
- users: citizens and officials who submit / manage reports.
- hazard_types: lookup table of supported hazard categories.
- severity_levels: lookup table of severity grades (low, medium, high, critical).
- verification_statuses: lookup table of report review statuses.
- hazard_reports: crowdsourced / AI-submitted reports with PostGIS Point location.
- report_duplicates: tracks which reports are duplicates of which (self-referential via report IDs).
- ai_detections: AI inference outputs linked to reports.

Relationships:
- users 1:N hazard_reports (reporter)
- hazard_types 1:N hazard_reports
- severity_levels 1:N hazard_reports
- verification_statuses 1:N hazard_reports
- hazard_reports 1:N ai_detections
- hazard_reports N:M hazard_reports via report_duplicates (original <-> duplicate)
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from geoalchemy2 import Geometry
from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Float,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="citizen")
    district: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    reports: Mapped[List["HazardReport"]] = relationship(
        "HazardReport", back_populates="reporter", cascade="all, delete-orphan"
    )


class HazardType(Base):
    __tablename__ = "hazard_types"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(
        String(40), unique=True, nullable=False, index=True
    )  # road_damage, landslide, rockfall_debris, flooding_waterlogging, other
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    reports: Mapped[List["HazardReport"]] = relationship(
        "HazardReport", back_populates="hazard_type_ref"
    )


class SeverityLevel(Base):
    __tablename__ = "severity_levels"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )  # low, medium, high, critical
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    reports: Mapped[List["HazardReport"]] = relationship(
        "HazardReport", back_populates="severity_ref"
    )


class VerificationStatus(Base):
    __tablename__ = "verification_statuses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )  # pending, verified, rejected, resolved
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    reports: Mapped[List["HazardReport"]] = relationship(
        "HazardReport", back_populates="status_ref"
    )


class HazardReport(Base):
    __tablename__ = "hazard_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    reporter_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    hazard_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hazard_types.id", ondelete="RESTRICT"),
        nullable=False,
    )
    severity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("severity_levels.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("verification_statuses.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # GPS coordinates stored as a PostGIS geography point (WGS84, SRID 4326).
    location: Mapped[object] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326), nullable=False
    )
    district: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    image_urls: Mapped[List[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default="{}"
    )
    ai_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    reporter: Mapped[Optional["User"]] = relationship(
        "User", back_populates="reports"
    )
    hazard_type_ref: Mapped["HazardType"] = relationship(
        "HazardType", back_populates="reports"
    )
    severity_ref: Mapped["SeverityLevel"] = relationship(
        "SeverityLevel", back_populates="reports"
    )
    status_ref: Mapped["VerificationStatus"] = relationship(
        "VerificationStatus", back_populates="reports"
    )
    detections: Mapped[List["AIDetection"]] = relationship(
        "AIDetection", back_populates="report", cascade="all, delete-orphan"
    )
    # Reports that list this report as their original (i.e. this is the canonical report).
    duplicates_of_me: Mapped[List["ReportDuplicate"]] = relationship(
        "ReportDuplicate",
        foreign_keys="[ReportDuplicate.original_report_id]",
        back_populates="original_report",
        cascade="all, delete-orphan",
    )
    # The original report this report is a duplicate of (if any).
    duplicate_of: Mapped[Optional["ReportDuplicate"]] = relationship(
        "ReportDuplicate",
        foreign_keys="[ReportDuplicate.duplicate_report_id]",
        back_populates="duplicate_report",
        uselist=False,
    )


class ReportDuplicate(Base):
    """Many-to-many duplicate references between hazard reports.

    original_report_id -> the canonical/original report.
    duplicate_report_id -> the report flagged as a duplicate of the original.
    """

    __tablename__ = "report_duplicates"
    __table_args__ = (
        CheckConstraint(
            "original_report_id <> duplicate_report_id",
            name="chk_duplicate_distinct_reports",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    original_report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hazard_reports.id", ondelete="CASCADE"),
        nullable=False,
    )
    duplicate_report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hazard_reports.id", ondelete="CASCADE"),
        nullable=False,
    )
    detection_method: Mapped[str] = mapped_column(
        String(20), nullable=False, default="manual"
    )  # manual, ai
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    original_report: Mapped["HazardReport"] = relationship(
        "HazardReport",
        foreign_keys=[original_report_id],
        back_populates="duplicates_of_me",
    )
    duplicate_report: Mapped["HazardReport"] = relationship(
        "HazardReport",
        foreign_keys=[duplicate_report_id],
        back_populates="duplicate_of",
    )


class AIDetection(Base):
    __tablename__ = "ai_detections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    report_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hazard_reports.id", ondelete="CASCADE"),
        nullable=True,
    )
    model_type: Mapped[str] = mapped_column(String(30), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    bounding_box: Mapped[Optional[dict]] = mapped_column(nullable=True)
    mask_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    report: Mapped[Optional["HazardReport"]] = relationship(
        "HazardReport", back_populates="detections"
    )
