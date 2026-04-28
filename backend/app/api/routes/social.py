from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import ensure_user_profile
from app.api.schemas import MessageOut
from app.auth.deps import get_current_user
from app.auth.supabase_jwt import AuthUser
from app.core.db import get_db
from app.core.errors import ApiError
from app.models import Follow, User

router = APIRouter()


@router.post("/users/{user_id}/follow", response_model=MessageOut)
def follow_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    if me.id == user_id:
        raise ApiError(status_code=400, message="Cannot follow yourself", code="INVALID_INPUT")

    target = db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    if not target:
        raise ApiError(status_code=404, message="User not found", code="NOT_FOUND")

    db.add(Follow(follower_user_id=me.id, followed_user_id=target.id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # already following
    return {"message": "Now following user"}


@router.delete("/users/{user_id}/follow", response_model=MessageOut)
def unfollow_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    row = db.scalar(
        select(Follow).where(
            Follow.follower_user_id == me.id,
            Follow.followed_user_id == user_id,
            Follow.deleted_at.is_(None),
        )
    )
    if row:
        row.deleted_at = datetime.utcnow()
        db.commit()
    return {"message": "Unfollowed user"}

