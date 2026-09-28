from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import DbSession
from app.core.security import decode_token, hash_password, token_version, verify_password
from app.models import User, UserRole
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, Tokens
from app.services.tokens import issue_tokens

router = APIRouter(prefix="/auth", tags=["auth"])


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
    claims = decode_token(payload.refresh_token, "refresh")
    user = db.get(User, claims.user_id) if claims is not None else None
    if user is None or claims is None or claims.version != token_version(user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token yaroqsiz yoki muddati tugagan"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisobingiz bloklangan")
    return issue_tokens(user)
