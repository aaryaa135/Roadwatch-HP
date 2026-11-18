"""Integration tests for image upload validation and storage.

These tests exercise the upload service directly without requiring a
database. Temporary files are created in the OS temp directory and cleaned
up automatically.
"""

import io
import os
import tempfile
from pathlib import Path

import pytest

from backend.app.services.upload import (
    ALLOWED_EXTENSIONS,
    UploadError,
    validate_upload,
    _is_safe_object_name,
    _mime_from_magic_bytes,
)


class FakeUploadFile:
    """Minimal stand-in for Starlette UploadFile for unit testing."""

    def __init__(self, filename: str, content: bytes):
        self.filename = filename
        self.file = io.BytesIO(content)
        self._content = content

    async def read(self, n: int = 1024 * 1024) -> bytes:
        return self.file.read(n)


def _make_file(filename: str, content: bytes) -> FakeUploadFile:
    return FakeUploadFile(filename, content)


# ---------------------------------------------------------------------------
# Magic byte detection
# ---------------------------------------------------------------------------


def test_mime_from_magic_bytes_jpeg():
    assert _mime_from_magic_bytes(b"\xff\xd8\xff" + b"\x00" * 29) == "image/jpeg"


def test_mime_from_magic_bytes_png():
    assert _mime_from_magic_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00" * 24) == "image/png"


def test_mime_from_magic_bytes_webp():
    header = b"RIFF\x00\x00\x00\x00WEBP"
    assert _mime_from_magic_bytes(header + b"\x00" * 20) == "image/webp"


def test_mime_from_magic_bytes_riff_not_webp():
    header = b"RIFF\x00\x00\x00\x00AVI "
    assert _mime_from_magic_bytes(header + b"\x00" * 20) == ""


def test_mime_from_magic_bytes_unknown():
    assert _mime_from_magic_bytes(b"\x00" * 32) == ""


def test_mime_from_magic_bytes_empty():
    assert _mime_from_magic_bytes(b"") == ""


# ---------------------------------------------------------------------------
# Object name safety
# ---------------------------------------------------------------------------


def test_is_safe_object_name_valid():
    assert _is_safe_object_name("a1b2c3d4.jpg") is True


def test_is_safe_object_name_rejects_dot_segments():
    assert _is_safe_object_name("..") is False
    assert _is_safe_object_name(".") is False


def test_is_safe_object_name_rejects_separators():
    assert _is_safe_object_name("../evil.jpg") is False
    assert _is_safe_object_name("sub/evil.jpg") is False
    assert _is_safe_object_name("sub\\evil.jpg") is False


def test_is_safe_object_name_rejects_empty():
    assert _is_safe_object_name("") is False


# ---------------------------------------------------------------------------
# Upload validation
# ---------------------------------------------------------------------------


def test_validate_upload_accepts_jpeg():
    content = b"\xff\xd8\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00" + b"\x00" * 100
    file = _make_file("test.jpg", content)
    validate_upload(file)


def test_validate_upload_accepts_png():
    content = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x00" * 100
    )
    file = _make_file("test.png", content)
    validate_upload(file)


def test_validate_upload_accepts_webp():
    content = b"RIFF\x00\x00\x00\x00WEBPVP8 " + b"\x00" * 100
    file = _make_file("test.webp", content)
    validate_upload(file)


def test_validate_upload_rejects_unsupported_extension():
    file = _make_file("test.txt", b"\x00" * 100)
    with pytest.raises(UploadError):
        validate_upload(file)


def test_validate_upload_rejects_unsupported_mime():
    # .jpg extension but not JPEG magic bytes
    file = _make_file("test.jpg", b"\x00" * 100)
    with pytest.raises(UploadError):
        validate_upload(file)


def test_validate_upload_rejects_empty_file():
    file = _make_file("test.jpg", b"")
    with pytest.raises(UploadError):
        validate_upload(file)


def test_validate_upload_rejects_no_filename():
    file = FakeUploadFile("", b"\xff\xd8\xff" + b"\x00" * 100)
    with pytest.raises(UploadError):
        validate_upload(file)


def test_validate_upload_rejects_no_filename():
    file = FakeUploadFile("", b"\xff\xd8\xff" + b"\x00" * 100)
    import asyncio
    with pytest.raises(UploadError):
        asyncio.run(validate_upload(file))


# ---------------------------------------------------------------------------
# save_upload integration (uses temp directory)
# ---------------------------------------------------------------------------


def test_save_upload_returns_public_url(monkeypatch):
    with tempfile.TemporaryDirectory() as tmpdir:
        import backend.app.services.upload as upload_mod

        monkeypatch.setattr(upload_mod.settings, "upload_dir", tmpdir)
        monkeypatch.setattr(
            upload_mod.settings,
            "upload_base_url",
            "http://localhost:8002/uploads",
        )

        content = b"\xff\xd8\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00" + b"\x00" * 100
        file = _make_file("photo.jpg", content)

        import asyncio
        url = asyncio.run(upload_mod.save_upload(file))

        assert url.startswith("http://localhost:8002/uploads/")
        assert url.endswith(".jpg")
        # File actually exists on disk
        object_name = url.rsplit("/", 1)[-1]
        assert Path(tmpdir, object_name).exists()


def test_save_upload_generates_unique_names(monkeypatch):
    with tempfile.TemporaryDirectory() as tmpdir:
        import backend.app.services.upload as upload_mod

        monkeypatch.setattr(upload_mod.settings, "upload_dir", tmpdir)
        monkeypatch.setattr(
            upload_mod.settings,
            "upload_base_url",
            "http://localhost:8002/uploads",
        )

        content = b"\xff\xd8\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00" + b"\x00" * 100

        import asyncio
        url1 = asyncio.run(
            upload_mod.save_upload(_make_file("photo.jpg", content))
        )
        url2 = asyncio.run(
            upload_mod.save_upload(_make_file("photo.jpg", content))
        )

        assert url1 != url2


def test_save_upload_rejects_oversized_file(monkeypatch):
    with tempfile.TemporaryDirectory() as tmpdir:
        import backend.app.services.upload as upload_mod

        monkeypatch.setattr(upload_mod.settings, "upload_dir", tmpdir)
        monkeypatch.setattr(
            upload_mod.settings,
            "upload_base_url",
            "http://localhost:8002/uploads",
        )
        monkeypatch.setattr(upload_mod.settings, "upload_max_size", 100)

        content = b"\xff\xd8\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00" + b"\x00" * 1000
        file = _make_file("photo.jpg", content)

        import asyncio
        with pytest.raises(UploadError):
            asyncio.run(upload_mod.save_upload(file))
