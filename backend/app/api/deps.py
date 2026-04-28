from __future__ import annotations

import random
import re
import string
from typing import Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.supabase_jwt import AuthUser
from app.models import Profile, User


def _slugify_username(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9_]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s[:32] or "user"


def _rand_suffix(n: int = 5) -> str:
    return "".join(random.choice(string.ascii_lowercase + string.digits) for _ in range(n))


def ensure_user_profile(db: Session, auth: AuthUser) -> Tuple[User, Profile]:
    user = db.scalar(select(User).where(User.supabase_user_id == auth.user_id, User.deleted_at.is_(None)))
    if user and user.profile and user.profile.deleted_at is None:
        return user, user.profile

    if not user:
        user = User(supabase_user_id=auth.user_id, email=auth.email)
        db.add(user)
        db.flush()

    # Basic username default (user can later change via PATCH /me)
    base = _slugify_username((auth.email or "").split("@")[0] if auth.email else "user")
    username = base
    while db.scalar(select(Profile).where(Profile.username == username, Profile.deleted_at.is_(None))) is not None:
        username = f"{base}_{_rand_suffix()}"[:32]

    profile = Profile(user_id=user.id, username=username, display_name=None, bio=None, avatar_url=None)
    db.add(profile)
    db.flush()
    return user, profile

