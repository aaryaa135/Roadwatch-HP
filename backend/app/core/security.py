"""Password hashing and signed access tokens.

Uses only the Python standard library so the service has no extra runtime
dependency for authentication. Tokens are HMAC-SHA256 signed payloads with an
expiry; they are intentionally simple, stateless bearer tokens.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any, Optional

from app.core.config import settings

_PBKDF2_ITERATIONS = 200_000


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS
    )
    return f"pbkdf2_sha256${_PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: Optional[str]) -> bool:
    if not encoded:
        return False
    try:
        algorithm, iterations, salt_hex, digest_hex = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str, role: str) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + settings.access_token_expire_minutes * 60,
    }
    payload_b64 = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(
        settings.secret_key.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256
    ).digest()
    return f"{payload_b64}.{_b64encode(signature)}"


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    try:
        payload_b64, signature_b64 = token.split(".", 1)
        expected = hmac.new(
            settings.secret_key.encode("utf-8"),
            payload_b64.encode("ascii"),
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(expected, _b64decode(signature_b64)):
            return None
        payload = json.loads(_b64decode(payload_b64))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload
    except (ValueError, TypeError, json.JSONDecodeError):
        return None
