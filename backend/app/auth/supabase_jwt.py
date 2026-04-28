from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

import httpx
from jose import jwt
from jose.exceptions import JWTError

from app.core.config import get_settings


@dataclass(frozen=True)
class AuthUser:
    user_id: str
    email: str | None
    raw_claims: Dict[str, Any]


class SupabaseJwksCache:
    def __init__(self) -> None:
        self._jwks: Optional[Dict[str, Any]] = None
        self._fetched_at: float = 0.0
        self._ttl_seconds: int = 60 * 10

    async def get(self) -> Dict[str, Any]:
        now = time.time()
        if self._jwks and (now - self._fetched_at) < self._ttl_seconds:
            return self._jwks

        settings = get_settings()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(settings.jwks_url)
            resp.raise_for_status()
            self._jwks = resp.json()
            self._fetched_at = now
            return self._jwks


jwks_cache = SupabaseJwksCache()


async def verify_supabase_jwt(token: str) -> AuthUser:
    settings = get_settings()
    jwks = await jwks_cache.get()

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise JWTError("missing kid")

        key = None
        for jwk in jwks.get("keys", []):
            if jwk.get("kid") == kid:
                key = jwk
                break
        if not key:
            raise JWTError("unknown kid")

        claims = jwt.decode(
            token,
            key,
            algorithms=[header.get("alg", "RS256")],
            issuer=settings.jwt_issuer,
            audience=settings.supabase_jwt_audience,
            options={"verify_at_hash": False},
        )
    except (JWTError, httpx.HTTPError) as e:
        raise JWTError(str(e))

    user_id = claims.get("sub")
    if not user_id:
        raise JWTError("missing sub")

    email = claims.get("email")
    return AuthUser(user_id=user_id, email=email, raw_claims=claims)

