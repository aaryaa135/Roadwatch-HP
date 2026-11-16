"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

${imports if imports else ""}

${upgrade_template if upgrade_template else "pass"}

${downgrade_template if downgrade_template else "pass"}
