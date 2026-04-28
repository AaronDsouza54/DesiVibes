from __future__ import annotations

from fastapi import Depends, Header
from jose.exceptions import JWTError

from app.auth.supabase_jwt import AuthUser, verify_supabase_jwt
from app.core.errors import ApiError


async def get_current_user(authorization: str | None = Header(default=None)) -> AuthUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise ApiError(status_code=401, message="Missing Bearer token", code="UNAUTHORIZED")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        return await verify_supabase_jwt(token)
    except JWTError:
        raise ApiError(status_code=401, message="Invalid or expired token", code="UNAUTHORIZED")

