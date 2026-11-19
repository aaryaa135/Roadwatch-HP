"""Shared API dependencies: authentication and role checks."""

import uuid
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.hazard import User

bearer_scheme = HTTPBearer(auto_error=False)


def _user_from_credentials(
    credentials: Optional[HTTPAuthorizationCredentials], db: Session
) -> Optional[User]:
    if credentials is None or not credentials.credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    if not payload:
        return None
    try:
        user_id = uuid.UUID(str(payload.get("sub")))
    except (ValueError, TypeError):
        return None
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        return None
    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    return _user_from_credentials(credentials, db)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    user = _user_from_credentials(credentials, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return user
