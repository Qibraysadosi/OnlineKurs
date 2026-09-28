from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import DbSession
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import User, UserRole
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, Tokens
from app.schemas.user import UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


def issue_tokens(user: User) -> Tokens:
    return Tokens(
        access_token=create_access_token(user.id, user.role.value),
        refresh_token=create_refresh_token(user.id),
        user=UserPublic.model_validate(user),
    )


@router.post("/register", response_model=Tokens, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: DbSession) -> Tokens:
    email = payload.email.lower()
    exists = db.execute(select(User.id).where(User.email == email)).scalar_one_or_none()
    if exists is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Bu email allaqachon ro'yxatdan o'tgan"
        )
    user = User(
        full_name=payload.full_name.strip(),
        email=email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=UserRole.student,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return issue_tokens(user)


@router.post("/login", response_model=Tokens)
def login(payload: LoginRequest, db: DbSession) -> Tokens:
    user = db.execute(select(User).where(User.email == payload.email.lower())).scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Email yoki parol noto'g'ri"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisobingiz bloklangan")
    return issue_tokens(user)


@router.post("/refresh", response_model=Tokens)
def refresh(payload: RefreshRequest, db: DbSession) -> Tokens:
    user_id = decode_token(payload.refresh_token, "refresh")
    user = db.get(User, user_id) if user_id is not None else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token yaroqsiz yoki muddati tugagan"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisobingiz bloklangan")
    return issue_tokens(user)
