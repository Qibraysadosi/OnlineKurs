from fastapi import APIRouter, HTTPException, Response, status

from app.core.deps import CurrentUser, DbSession
from app.core.security import hash_password, verify_password
from app.schemas.user import PasswordChange, UserPublic, UserUpdate

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


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def change_password(payload: PasswordChange, user: CurrentUser, db: DbSession) -> Response:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Joriy parol noto'g'ri")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
