from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from datetime import datetime

from sqlalchemy import desc, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.cursor import decode_cursor, encode_cursor
from app.api.deps import ensure_user_profile
from app.api.schemas import CommunityOut, CreateCommunityIn, MessageOut
from app.auth.deps import get_current_user
from app.auth.supabase_jwt import AuthUser
from app.core.db import get_db
from app.core.errors import ApiError
from app.models import Community, CommunityMember, Post
from app.api.routes.posts import _post_out  # reuse presenter

router = APIRouter()


@router.post("/communities", response_model=CommunityOut, status_code=201)
def create_community(
    body: CreateCommunityIn,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    c = Community(
        name=body.name,
        slug=body.slug,
        description=body.description,
        avatar_url=body.avatar_url,
        is_private=body.is_private,
        creator_user_id=me.id,
        tags=None,
    )
    db.add(c)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise ApiError(status_code=409, message="Community slug already exists", code="CONFLICT")

    # creator is a member
    db.add(CommunityMember(community_id=c.id, user_id=me.id, role="owner"))
    db.commit()
    return {
        "id": c.id,
        "name": c.name,
        "slug": c.slug,
        "description": c.description,
        "avatar_url": c.avatar_url,
        "is_private": c.is_private,
        "creator_user_id": c.creator_user_id,
        "is_member": True,
    }


@router.get("/communities/{community_id}", response_model=CommunityOut)
def get_community(
    community_id: uuid.UUID,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    c = db.scalar(select(Community).where(Community.id == community_id, Community.deleted_at.is_(None)))
    if not c:
        raise ApiError(status_code=404, message="Community not found", code="NOT_FOUND")

    is_member = (
        db.execute(
            select(1).select_from(CommunityMember).where(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == me.id,
                CommunityMember.deleted_at.is_(None),
            )
        ).first()
        is not None
    )
    if c.is_private and not is_member and c.creator_user_id != me.id:
        raise ApiError(status_code=403, message="Community is private", code="FORBIDDEN")

    return {
        "id": c.id,
        "name": c.name,
        "slug": c.slug,
        "description": c.description,
        "avatar_url": c.avatar_url,
        "is_private": c.is_private,
        "creator_user_id": c.creator_user_id,
        "is_member": is_member,
    }


@router.post("/communities/{community_id}/join", response_model=MessageOut)
def join_community(
    community_id: uuid.UUID,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    c = db.scalar(select(Community).where(Community.id == community_id, Community.deleted_at.is_(None)))
    if not c:
        raise ApiError(status_code=404, message="Community not found", code="NOT_FOUND")
    if c.is_private:
        raise ApiError(status_code=403, message="Cannot join private community", code="FORBIDDEN")

    db.add(CommunityMember(community_id=community_id, user_id=me.id, role="member"))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"message": "Joined community"}


@router.delete("/communities/{community_id}/leave", response_model=MessageOut)
def leave_community(
    community_id: uuid.UUID,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    row = db.scalar(
        select(CommunityMember).where(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == me.id,
            CommunityMember.deleted_at.is_(None),
        )
    )
    if row:
        row.deleted_at = datetime.utcnow()
        db.commit()
    return {"message": "Left community"}


@router.get("/communities/{community_id}/feed")
def community_feed(
    community_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=50),
    cursor: str | None = Query(default=None),
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)

    is_member = db.execute(
        select(1).select_from(CommunityMember).where(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == me.id,
            CommunityMember.deleted_at.is_(None),
        )
    ).first()
    if not is_member:
        raise ApiError(status_code=403, message="Must be a member to view community feed", code="FORBIDDEN")

    created_before = None
    id_before = None
    if cursor:
        c = decode_cursor(cursor)
        created_before, id_before = c.created_at, c.id

    q = (
        select(Post)
        .where(Post.community_id == community_id, Post.deleted_at.is_(None))
        .order_by(desc(Post.created_at), desc(Post.id))
    )
    if created_before and id_before:
        q = q.where(or_(Post.created_at < created_before, and_(Post.created_at == created_before, Post.id < id_before)))

    rows = db.scalars(q.limit(limit + 1)).all()
    has_more = len(rows) > limit
    rows = rows[:limit]

    items = [_post_out(db, me.id, p) for p in rows]
    next_cursor = encode_cursor(rows[-1].created_at, rows[-1].id) if has_more and rows else None
    return {"items": items, "next_cursor": next_cursor}

