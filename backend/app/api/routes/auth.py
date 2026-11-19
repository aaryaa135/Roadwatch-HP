"""Authentication endpoints for RoadWatch HP.

Registration always creates a citizen account. Administrator accounts are
provisioned by the migration/seed, never by self-registration.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.hazard import User
from app.schemas.auth import (
    LoginRequest,
    PasswordChange,
    ProfileUpdate,
    RegisterRequest,
    TokenResponse,
    UserRead,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    existing = db.query(User).filter(func.lower(User.email) == email).one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    user = User(
        full_name=payload.full_name.strip(),
        email=email,
        phone=payload.phone,
        district=payload.district,
        role="citizen",
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id), user.role)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    user = db.query(User).filter(func.lower(User.email) == email).one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated",
        )
    token = create_access_token(str(user.id), user.role)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return UserRead.model_validate(user)


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChange,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    db.commit()
    return None
