"""Idempotent lookup/demo seeding for local development.

The Alembic migration creates the same lookup values. This function makes the
application resilient when a developer starts the API against a database that
was created by an older migration, and provisions the demo accounts used in the
project demonstration.
"""

from __future__ import annotations

import logging

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.hazard import (
    HazardType,
    SeverityLevel,
    User,
    VerificationStatus,
)

logger = logging.getLogger(__name__)

HAZARD_TYPES = [
    ("potholes", "Potholes", "Potholes and surface cavities"),
    ("longitudinal_cracks", "Longitudinal cracks", "Cracks running along the road"),
    ("transverse_cracks", "Transverse cracks", "Cracks running across the road"),
    ("alligator_cracks", "Alligator cracks", "Interconnected fatigue cracking"),
    ("landslides", "Landslides", "Landslide-affected road sections"),
    ("rockfalls", "Rockfalls", "Falling rock hazards"),
    ("road_debris", "Road debris", "Debris blocking the carriageway"),
    ("waterlogging", "Waterlogging", "Standing water on the road"),
    ("flooding", "Flooding", "Flooded road sections"),
    ("other_obstructions", "Other obstructions", "Other road obstructions"),
    # Legacy broad categories retained for existing reports.
    ("road_damage", "Road damage (legacy)", "Potholes, cracks and rutting"),
    ("landslide", "Landslide (legacy)", "Landslide-affected areas"),
    ("rockfall_debris", "Rockfall and debris (legacy)", "Rockfall and debris"),
    ("flooding_waterlogging", "Flooding and waterlogging (legacy)", "Flooding"),
    ("other", "Other (legacy)", "Other road hazard"),
]

SEVERITIES = [
    ("low", "Low", 1),
    ("medium", "Medium", 2),
    ("high", "High", 3),
    ("critical", "Critical", 4),
]

STATUSES = [
    ("pending", "Pending"),
    ("verified", "Verified"),
    ("rejected", "Rejected"),
    ("resolved", "Resolved"),
]


def seed_defaults(db: Session) -> None:
    for code, name, description in HAZARD_TYPES:
        if db.query(HazardType).filter(HazardType.code == code).one_or_none() is None:
            db.add(HazardType(code=code, name=name, description=description))
    for code, name, sort_order in SEVERITIES:
        if db.query(SeverityLevel).filter(SeverityLevel.code == code).one_or_none() is None:
            db.add(SeverityLevel(code=code, name=name, sort_order=sort_order))
    for code, name in STATUSES:
        if (
            db.query(VerificationStatus)
            .filter(VerificationStatus.code == code)
            .one_or_none()
            is None
        ):
            db.add(VerificationStatus(code=code, name=name))

    demo_users = [
        (
            "RoadWatch Administrator",
            "admin@roadwatchhp.com",
            "admin@roadwatch.local",
            "admin",
            "Admin@12345",
            "Shimla",
        ),
        (
            "Demo Citizen",
            "citizen@roadwatchhp.com",
            "citizen@roadwatch.local",
            "citizen",
            "Citizen@12345",
            "Mandi",
        ),
    ]
    for full_name, email, legacy_email, role, password, district in demo_users:
        existing = db.query(User).filter(func.lower(User.email) == email).one_or_none()
        if existing is None and legacy_email:
            legacy = (
                db.query(User)
                .filter(func.lower(User.email) == legacy_email)
                .one_or_none()
            )
            if legacy is not None:
                legacy.email = email
                existing = legacy
        if existing is None:
            db.add(
                User(
                    full_name=full_name,
                    email=email,
                    role=role,
                    district=district,
                    password_hash=hash_password(password),
                    is_active=True,
                )
            )
    db.commit()


def try_seed_defaults(db: Session) -> None:
    try:
        seed_defaults(db)
    except Exception:  # pragma: no cover - startup should never crash on seed
        db.rollback()
        logger.exception("Could not seed RoadWatch defaults")
