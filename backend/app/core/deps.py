"""FastAPI dependencies: database session, current user resolution and role guards."""

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token, token_version
from app.db.session import get_session
from app.models import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[Session, Depends(get_session)]
BearerCredentials = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]


def _resolve_user(db: Session, credentials: HTTPAuthorizationCredentials | None) -> User | None:
    """Return the active user for a bearer token, None when no token is given."""
    if credentials is None or not credentials.credentials:
        return None
    claims = decode_token(credentials.credentials, "access")
    if claims is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token yaroqsiz yoki muddati tugagan",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.get(User, claims.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Foydalanuvchi topilmadi",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if claims.version != token_version(user.password_hash):
        # Password changed after this token was issued: the old session is revoked.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token yaroqsiz yoki muddati tugagan",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisobingiz bloklangan")
    return user


def get_optional_user(db: DbSession, credentials: BearerCredentials) -> User | None:
    return _resolve_user(db, credentials)


def get_current_user(db: DbSession, credentials: BearerCredentials) -> User:
    user = _resolve_user(db, credentials)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Avtorizatsiya talab qilinadi",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]


def require_roles(*roles: str) -> Callable[[User], User]:
    allowed = {UserRole(role) for role in roles}

    def _guard(user: CurrentUser) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Sizda bu amal uchun ruxsat yo'q"
            )
        return user

    return _guard


TeacherUser = Annotated[User, Depends(require_roles("teacher", "admin"))]
AdminUser = Annotated[User, Depends(require_roles("admin"))]
