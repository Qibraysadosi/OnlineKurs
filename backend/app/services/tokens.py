from app.core.security import create_access_token, create_refresh_token, token_version
from app.models import User
from app.schemas.auth import Tokens
from app.schemas.user import UserPublic


def issue_tokens(user: User) -> Tokens:
    """Mint an access/refresh pair bound to the user's current password hash."""
    version = token_version(user.password_hash)
    return Tokens(
        access_token=create_access_token(user.id, user.role.value, version),
        refresh_token=create_refresh_token(user.id, version),
        user=UserPublic.model_validate(user),
    )
