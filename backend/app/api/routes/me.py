from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.auth.supabase_jwt import AuthUser
from app.core.db import get_db
from app.core.errors import ApiError
from app.api.deps import ensure_user_profile
from app.api.schemas import MessageOut, UpdateMeIn, UserMeOut
from app.models import Follow, Profile, User

router = APIRouter()


@router.get("/me", response_model=UserMeOut)
def get_me(
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    user, profile = ensure_user_profile(db, auth)
    db.commit()
    return {
        "id": user.id,
        "supabase_user_id": user.supabase_user_id,
        "email": user.email,
        "profile": {
            "username": profile.username,
            "display_name": profile.display_name,
            "bio": profile.bio,
            "avatar_url": profile.avatar_url,
            "is_creator": profile.is_creator,
        },
    }


@router.patch("/me", response_model=MessageOut)
def update_me(
    body: UpdateMeIn,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    user, profile = ensure_user_profile(db, auth)

    if body.username is not None:
        profile.username = body.username
    if body.display_name is not None:
        profile.display_name = body.display_name
    if body.bio is not None:
        profile.bio = body.bio
    if body.avatar_url is not None:
        profile.avatar_url = body.avatar_url

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ApiError(status_code=409, message="Username already taken", code="CONFLICT")

    return {"message": "Profile updated"}


@router.get("/users/{user_id}")
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    viewer, _ = ensure_user_profile(db, auth)
    user = db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    if not user:
        raise ApiError(status_code=404, message="User not found", code="NOT_FOUND")

    profile = db.scalar(select(Profile).where(Profile.user_id == user.id, Profile.deleted_at.is_(None)))
    if not profile:
        raise ApiError(status_code=404, message="Profile not found", code="NOT_FOUND")

    is_following = db.execute(
        select(1).select_from(Follow).where(
            Follow.follower_user_id == viewer.id,
            Follow.followed_user_id == user.id,
            Follow.deleted_at.is_(None),
        )
    ).first() is not None

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "profile": {
                "username": profile.username,
                "display_name": profile.display_name,
                "bio": profile.bio,
                "avatar_url": profile.avatar_url,
                "is_creator": profile.is_creator,
            },
        },
        "is_following": is_following,
    }

