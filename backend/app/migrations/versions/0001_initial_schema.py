"""Initial RoadWatch HP schema.

Creates:
- postgis extension
- users
- hazard_types (lookup)
- severity_levels (lookup)
- verification_statuses (lookup)
- hazard_reports (with PostGIS POINT geography)
- report_duplicates (self-referential duplicate tracking)
- ai_detections

Revision ID: 0001_initial_schema
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostGIS extension must exist before any geography columns.
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    # ---------- lookup: hazard_types ----------
    op.create_table(
        "hazard_types",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("code", sa.String(length=40), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_hazard_types_code"), "hazard_types", ["code"], unique=True
    )

    # ---------- lookup: severity_levels ----------
    op.create_table(
        "severity_levels",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_severity_levels_code"), "severity_levels", ["code"], unique=True
    )

    # ---------- lookup: verification_statuses ----------
    op.create_table(
        "verification_statuses",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_verification_statuses_code"),
        "verification_statuses",
        ["code"],
        unique=True,
    )

    # ---------- users ----------
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False, server_default=sa.text("'citizen'")),
        sa.Column("district", sa.String(length=50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # ---------- hazard_reports ----------
    op.create_table(
        "hazard_reports",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "reporter_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column(
            "hazard_type_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "severity_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "status_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "location",
            Geometry(geometry_type="POINT", srid=4326, from_text="ST_GeomFromEWKT", name="geometry"),
            nullable=False,
        ),
        sa.Column("district", sa.String(length=50), nullable=True),
        sa.Column(
            "image_urls",
            postgresql.ARRAY(sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column("ai_confidence", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["hazard_type_id"],
            ["hazard_types.id"],
            name="fk_hazard_reports_hazard_type_id_hazard_types",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["severity_id"],
            ["severity_levels.id"],
            name="fk_hazard_reports_severity_id_severity_levels",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["status_id"],
            ["verification_statuses.id"],
            name="fk_hazard_reports_status_id_verification_statuses",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["reporter_id"],
            ["users.id"],
            name="fk_hazard_reports_reporter_id_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_hazard_reports_hazard_type_id"),
        "hazard_reports",
        ["hazard_type_id"],
    )
    op.create_index(
        op.f("ix_hazard_reports_severity_id"),
        "hazard_reports",
        ["severity_id"],
    )
    op.create_index(
        op.f("ix_hazard_reports_status_id"),
        "hazard_reports",
        ["status_id"],
    )
    op.create_index(
        op.f("ix_hazard_reports_created_at"),
        "hazard_reports",
        ["created_at"],
        postgresql_ops={"created_at": "DESC"},
    )
    # GiST index for geospatial queries on the location column.
    op.execute(
        "CREATE INDEX ix_hazard_reports_location ON hazard_reports USING GIST (location)"
    )

    # ---------- report_duplicates ----------
    op.create_table(
        "report_duplicates",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "original_report_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "duplicate_report_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("detection_method", sa.String(length=20), nullable=False, server_default=sa.text("'manual'")),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column(
            "detected_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "original_report_id <> duplicate_report_id",
            name="chk_duplicate_distinct_reports",
        ),
        sa.ForeignKeyConstraint(
            ["duplicate_report_id"],
            ["hazard_reports.id"],
            name="fk_report_duplicates_duplicate_report_id_hazard_reports",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["original_report_id"],
            ["hazard_reports.id"],
            name="fk_report_duplicates_original_report_id_hazard_reports",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_report_duplicates_original_report_id"),
        "report_duplicates",
        ["original_report_id"],
    )
    op.create_index(
        op.f("ix_report_duplicates_duplicate_report_id"),
        "report_duplicates",
        ["duplicate_report_id"],
    )

    # ---------- ai_detections ----------
    op.create_table(
        "ai_detections",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "report_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column("model_type", sa.String(length=30), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("bounding_box", sa.JSON(), nullable=True),
        sa.Column("mask_url", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["report_id"],
            ["hazard_reports.id"],
            name="fk_ai_detections_report_id_hazard_reports",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ai_detections_report_id"), "ai_detections", ["report_id"]
    )


def downgrade() -> None:
    op.drop_table("ai_detections")
    op.drop_table("report_duplicates")
    op.drop_index(op.f("ix_hazard_reports_location"), table_name="hazard_reports")
    op.drop_index(op.f("ix_hazard_reports_created_at"), table_name="hazard_reports")
    op.drop_index(op.f("ix_hazard_reports_status_id"), table_name="hazard_reports")
    op.drop_index(op.f("ix_hazard_reports_severity_id"), table_name="hazard_reports")
    op.drop_index(op.f("ix_hazard_reports_hazard_type_id"), table_name="hazard_reports")
    op.drop_table("hazard_reports")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.drop_index(
        op.f("ix_verification_statuses_code"), table_name="verification_statuses"
    )
    op.drop_table("verification_statuses")
    op.drop_index(
        op.f("ix_severity_levels_code"), table_name="severity_levels"
    )
    op.drop_table("severity_levels")
    op.drop_index(op.f("ix_hazard_types_code"), table_name="hazard_types")
    op.drop_table("hazard_types")
    op.execute("DROP EXTENSION IF EXISTS postgis")
