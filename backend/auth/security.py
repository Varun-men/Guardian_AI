
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from jose import jwt
from pwdlib import PasswordHash
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from environment")

ALGORITHM = "HS256"

# Access tokens stay short-lived; refresh tokens provide
# the persistent session. Both are configurable via env.
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15")
)
REFRESH_TOKEN_EXPIRE_DAYS = int(
    os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30")
)

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(data: dict):
    payload = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload.update({"exp": expire})

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# --------------------------------------------------
# Refresh tokens (opaque, stored hashed, rotatable)
# --------------------------------------------------

def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(
        days=REFRESH_TOKEN_EXPIRE_DAYS
    )


def is_expired(expires_at: datetime) -> bool:
    # SQLite returns naive datetimes; treat them as UTC.
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at <= datetime.now(timezone.utc)
