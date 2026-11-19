"""Add authentication, verification audit trail and granular hazard types.

Revision ID: 0002_auth_verification
Revises: 0001_initial_schema
Create Date: 2026-01-01 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_auth_verification"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "hazard_reports",
        sa.Column(
            "resolution_status",
            sa.String(length=20),
            nullable=False,
            server_default=sa.text("'unresolved'"),
        ),
    )

    op.create_table(
        "report_verifications",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reviewer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("reviewer_name", sa.String(length=100), nullable=True),
        sa.Column("action", sa.String(length=20), nullable=False),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["report_id"],
            ["hazard_reports.id"],
            name="fk_report_verifications_report_id",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["reviewer_id"],
            ["users.id"],
            name="fk_report_verifications_reviewer_id",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_report_verifications_report_id"),
        "report_verifications",
        ["report_id"],
    )

    op.execute(
        "INSERT INTO hazard_types (code, name, description) VALUES "
        "('potholes', 'Potholes', 'Potholes and surface cavities'), "
        "('longitudinal_cracks', 'Longitudinal cracks', 'Cracks running along the road'), "
        "('transverse_cracks', 'Transverse cracks', 'Cracks running across the road'), "
        "('alligator_cracks', 'Alligator cracks', 'Interconnected fatigue cracking'), "
        "('landslides', 'Landslides', 'Landslide-affected road sections'), "
        "('rockfalls', 'Rockfalls', 'Falling rock hazards'), "
        "('road_debris', 'Road debris', 'Debris blocking the carriageway'), "
        "('waterlogging', 'Waterlogging', 'Standing water on the road'), "
        "('flooding', 'Flooding', 'Flooded road sections'), "
        "('other_obstructions', 'Other obstructions', 'Other road obstructions') "
        "ON CONFLICT (code) DO NOTHING"
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_report_verifications_report_id"),
        table_name="report_verifications",
    )
    op.drop_table("report_verifications")
    op.drop_column("hazard_reports", "resolution_status")
    op.drop_column("users", "password_hash")
