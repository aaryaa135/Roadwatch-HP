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

from backend.app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

# Magic byte signatures for image formats.
IMAGE_MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",        # JPEG
    b"\x89PNG\r\n\x1a\n": "image/png",    # PNG
    b"RIFF": "image/webp",                # WEBP (RIFF container with WEBP at offset 8)
}


class UploadError(Exception):
    """Raised when an uploaded file cannot be stored."""


def ensure_upload_dir() -> Path:
    """Create the upload directory if it does not exist and return its path."""
    upload_path = Path(settings.upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


def _is_safe_object_name(object_name: str) -> bool:
    """Reject object names that could escape the upload directory."""
    # Only allow a bare filename: no directory separators, no dot segments.
    if not object_name:
        return False
    if os.path.sep in object_name or "/" in object_name or "\\" in object_name:
        return False
    if object_name in (".", ".."):
        return False
    return True


def _mime_from_magic_bytes(head: bytes) -> str:
    """Detect MIME type from file magic bytes.

    Returns an empty string when no known signature matches.
    """
    for signature, mime_type in IMAGE_MAGIC_BYTES.items():
        if head.startswith(signature):
            if mime_type == "image/webp":
                # WEBP uses a RIFF container; confirm "WEBP" at offset 8.
                if len(head) >= 12 and head[8:12] == b"WEBP":
                    return mime_type
                continue
            return mime_type
    return ""


def validate_upload(file: UploadFile) -> None:
    """Validate an uploaded file's extension, MIME type and size.

    Raises UploadError if the file is not acceptable.
    """
    if not file.filename:
        raise UploadError("No filename provided.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise UploadError(
            f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Detect MIME type from file contents (magic bytes), not from the
    # client-supplied filename. This prevents MIME spoofing via extension.
    head = file.file.read(32)
    file.file.seek(0)

    detected_mime = _mime_from_magic_bytes(head)
    if detected_mime not in ALLOWED_MIME_TYPES:
        raise UploadError(
            f"Unsupported file content type '{detected_mime or 'unknown'}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
        )

    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    if size > settings.upload_max_size:
        raise UploadError(
            f"File too large ({size} bytes). Maximum is {settings.upload_max_size} bytes."
        )
    if size == 0:
        raise UploadError("Empty file.")


async def save_upload(file: UploadFile) -> str:
    """Save an uploaded file and return its public URL.

    Raises UploadError on validation or storage failure.
    """
    validate_upload(file)

    upload_dir = ensure_upload_dir()
    ext = Path(file.filename or "upload").suffix.lower()
    object_name = f"{uuid.uuid4().hex}{ext}"

    if not _is_safe_object_name(object_name):
        raise UploadError("Unsafe generated object name.")

    destination = upload_dir / object_name

    try:
        with destination.open("wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)
    except OSError as exc:
        raise UploadError(f"Could not store uploaded file: {exc}") from exc

    return f"{settings.upload_base_url}/{object_name}"


def get_uploaded_file(object_name: str) -> Optional[Path]:
    """Return the local path for an uploaded file object name, or None.

    Rejects unsafe object names to prevent path traversal.
    """
    if not _is_safe_object_name(object_name):
        return None
    upload_dir = ensure_upload_dir()
    path = upload_dir / object_name
    return path if path.exists() else None
