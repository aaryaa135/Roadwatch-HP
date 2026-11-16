"""File upload service for RoadWatch HP.

Saves uploaded photographs to the configured upload directory and returns
the public URL that can be stored in a hazard report and passed to the AI
service for inference.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import UploadFile
from starlette.responses import FileResponse

from app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class UploadError(Exception):
    """Raised when an uploaded file cannot be stored."""


def ensure_upload_dir() -> Path:
    """Create the upload directory if it does not exist and return its path."""
    upload_path = Path(settings.upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


def validate_upload(file: UploadFile) -> None:
    """Validate an uploaded file's extension and size.

    Raises UploadError if the file is not acceptable.
    """
    if not file.filename:
        raise UploadError("No filename provided.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise UploadError(
            f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Starlette/UploadFile does not expose size before reading in all versions;
    # we enforce it by reading in chunks below.
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_FILE_SIZE:
        raise UploadError(f"File too large ({size} bytes). Maximum is {MAX_FILE_SIZE} bytes.")


async def save_upload(file: UploadFile) -> str:
    """Save an uploaded file and return its public URL.

    Raises UploadError on validation or storage failure.
    """
    validate_upload(file)

    upload_dir = ensure_upload_dir()
    ext = Path(file.filename or "upload").suffix.lower()
    object_name = f"{uuid.uuid4().hex}{ext}"
    destination = upload_dir / object_name

    try:
        with destination.open("wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)
    except OSError as exc:
        raise UploadError(f"Could not store uploaded file: {exc}") from exc

    return f"{settings.upload_base_url}/{object_name}"


def get_uploaded_file(object_name: str) -> Optional[Path]:
    """Return the local path for an uploaded file object name, or None."""
    upload_dir = ensure_upload_dir()
    path = upload_dir / object_name
    return path if path.exists() else None
