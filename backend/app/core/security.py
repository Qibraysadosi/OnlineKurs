"""Password hashing (bcrypt) and JWT creation / verification (PyJWT, HS256)."""

import hashlib
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import bcrypt
import jwt

from app.core.config import settings

ALGORITHM = "HS256"
TokenType = Literal["access", "refresh"]
BCRYPT_MAX_BYTES = 72
PASSWORD_TOO_LONG = "Parol 72 baytdan oshmasligi kerak"


def validate_password_bytes(password: str) -> str:
    """bcrypt silently compares only the first 72 bytes; refuse anything longer."""
    if len(password.encode("utf-8")) > BCRYPT_MAX_BYTES:
        raise ValueError(PASSWORD_TOO_LONG)
    return password


def token_version(password_hash: str) -> str:
    """Per-user token generation derived from the password hash.

    Every password change produces a new salted hash, so tokens issued before the change
    carry a stale version and are rejected (`ver` claim).
    """
    return hashlib.sha256(password_hash.encode("utf-8")).hexdigest()[:16]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _encode(payload: dict[str, Any], expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    to_encode = {**payload, "iat": now, "exp": now + expires_delta}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(user_id: int, role: str, version: str) -> str:
    return _encode(
        {"sub": str(user_id), "role": role, "type": "access", "ver": version},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: int, version: str) -> str:
    return _encode(
        {"sub": str(user_id), "type": "refresh", "ver": version},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


@dataclass(frozen=True)
class TokenClaims:
    user_id: int
    version: str


def decode_token(token: str, expected_type: TokenType) -> TokenClaims | None:
    """Return the claims of a valid token of the expected type, else None."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    if payload.get("type") != expected_type:
        return None
    subject = payload.get("sub")
    version = payload.get("ver")
    if not isinstance(subject, str) or not subject.isdigit() or not isinstance(version, str):
        return None
    return TokenClaims(user_id=int(subject), version=version)
