from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser, DbSession
from app.core.security import hash_password, verify_password
from app.schemas.auth import Tokens
from app.schemas.user import PasswordChange, UserPublic, UserUpdate
from app.services.tokens import issue_tokens

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserPublic)
def read_me(user: CurrentUser) -> UserPublic:
    return UserPublic.model_validate(user)


@router.patch("/me", response_model=UserPublic)
def update_me(payload: UserUpdate, user: CurrentUser, db: DbSession) -> UserPublic:
    changes = payload.model_dump(exclude_unset=True)
    if "full_name" in changes and changes["full_name"] is not None:
        changes["full_name"] = changes["full_name"].strip()
    for field, value in changes.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return UserPublic.model_validate(user)


@router.post("/me/password", response_model=Tokens)
def change_password(payload: PasswordChange, user: CurrentUser, db: DbSession) -> Tokens:
    """Rotate the password and return a fresh token pair.

    Tokens carry a version derived from the password hash, so every session issued
    before the change (including the caller's own) is revoked; the new pair keeps
    the caller signed in.
    """
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Joriy parol noto'g'ri")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    db.refresh(user)
    return issue_tokens(user)
