import os
import uuid
from datetime import datetime, timezone

from backend.auth.dependencies import get_current_user

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from backend.db.models import RefreshToken, User
from backend.auth.schemas import RegisterRequest, LoginRequest, TokenResponse
from backend.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_refresh_token,
    generate_csrf_token,
    hash_token,
    refresh_token_expiry,
    is_expired,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from backend.auth.dependencies import get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

REFRESH_COOKIE_NAME = "guardian_refresh"
CSRF_COOKIE_NAME = "guardian_csrf"
CSRF_HEADER_NAME = "x-csrf-token"


def _cookie_samesite() -> str:
    value = os.getenv("REFRESH_COOKIE_SAMESITE", "none").lower()
    return value if value in {"lax", "strict", "none"} else "none"


def _cookie_secure(request: Request) -> bool:
    override = os.getenv("REFRESH_COOKIE_SECURE", "").lower()
    if override in {"true", "false"}:
        return override == "true"
    # Secure on HTTPS. Also on loopback: browsers treat
    # localhost/127.0.0.1 as trustworthy and accept Secure
    # cookies there, which keeps SameSite=None working for
    # local cross-origin development.
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    if proto == "https":
        return True
    host = request.url.hostname or ""
    return host in {"localhost", "127.0.0.1", "::1"}


def _set_session_cookies(
    response: Response,
    request: Request,
    refresh_token: str,
    csrf_token: str,
) -> None:
    secure = _cookie_secure(request)
    samesite = _cookie_samesite()
    if samesite == "none" and not secure:
        # SameSite=None requires Secure; downgrade for plain-HTTP dev.
        samesite = "lax"
    max_age = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path="/",
    )
    # Readable by JS so it can echo the value back in the
    # X-CSRF-Token header (double-submit CSRF protection).
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=csrf_token,
        max_age=max_age,
        httponly=False,
        secure=secure,
        samesite=samesite,
        path="/",
    )


def _clear_session_cookies(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/")
    response.delete_cookie(CSRF_COOKIE_NAME, path="/")


def _issue_refresh_token(db: Session, user: User):
    """Create a persisted refresh token row.

    Returns (raw_refresh_token, raw_csrf_token, record).
    Only hashes are stored.
    """
    raw_refresh = generate_refresh_token()
    raw_csrf = generate_csrf_token()

    record = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash=hash_token(raw_refresh),
        csrf_hash=hash_token(raw_csrf),
        expires_at=refresh_token_expiry(),
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return raw_refresh, raw_csrf, record


def _access_payload(user: User) -> dict:
    return {
        "sub": user.id,
        "role": user.role,
    }


@router.post("/register")
def register(
    data: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):

    existing = db.query(User).filter(
        (User.username == data.username) |
        (User.email == data.email)
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Username or email already exists")

    user = User(
        id=str(uuid.uuid4()),
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        role="creator",
        is_active=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(_access_payload(user))
    refresh_token, csrf_token, _ = _issue_refresh_token(db, user)
    _set_session_cookies(response, request, refresh_token, csrf_token)

    return {
        "message": "Registration successful",
        "user_id": user.id,
        "role": user.role,
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):

    user = db.query(User).filter(
        User.username == data.username
    ).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account inactive")

    token = create_access_token(_access_payload(user))
    refresh_token, csrf_token, _ = _issue_refresh_token(db, user)
    _set_session_cookies(response, request, refresh_token, csrf_token)

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Rotate the refresh token and issue a new access token.

    Requires the HttpOnly refresh cookie plus a matching
    X-CSRF-Token header (double-submit CSRF protection).
    """
    raw_refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    raw_csrf_header = request.headers.get(CSRF_HEADER_NAME, "")
    raw_csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME, "")

    if not raw_refresh:
        raise HTTPException(status_code=401, detail="No refresh token")

    record = db.query(RefreshToken).filter(
        RefreshToken.token_hash == hash_token(raw_refresh)
    ).first()

    # Never accept missing, expired, revoked, or rotated tokens.
    if (
        record is None
        or record.revoked_at is not None
        or is_expired(record.expires_at)
    ):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # CSRF: header must match the readable cookie AND the hash
    # bound to this specific refresh token row.
    if (
        not raw_csrf_header
        or not raw_csrf_cookie
        or raw_csrf_header != raw_csrf_cookie
        or hash_token(raw_csrf_header) != record.csrf_hash
    ):
        raise HTTPException(status_code=403, detail="CSRF validation failed")

    # Rotate: revoke the presented token, issue a fresh pair.
    new_refresh, new_csrf, new_record = _issue_refresh_token(db, user)

    record.revoked_at = datetime.now(timezone.utc)
    record.replaced_by = new_record.id
    db.commit()

    _set_session_cookies(response, request, new_refresh, new_csrf)

    return {
        "access_token": create_access_token(_access_payload(user)),
        "token_type": "bearer"
    }


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Revoke the active refresh token and clear session cookies."""
    raw_refresh = request.cookies.get(REFRESH_COOKIE_NAME)

    if raw_refresh:
        record = db.query(RefreshToken).filter(
            RefreshToken.token_hash == hash_token(raw_refresh)
        ).first()
        if record and record.revoked_at is None:
            record.revoked_at = datetime.now(timezone.utc)
            db.commit()

    _clear_session_cookies(response)

    return {"message": "Logged out"}


@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role
    }
