from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, desc, exists, func, or_, select
from sqlalchemy.orm import Session

from app.api.cursor import decode_cursor, encode_cursor
from app.api.deps import ensure_user_profile
from app.api.schemas import (
    AddCommentIn,
    CommentOut,
    CreatePostIn,
    MessageOut,
    PostOut,
)
from app.auth.deps import get_current_user
from app.auth.supabase_jwt import AuthUser
from app.core.db import get_db
from app.core.errors import ApiError
from app.models import (
    Comment,
    CommunityMember,
    FamilyGroupMember,
    Follow,
    Like,
    Post,
    PostMedia,
    PostVisibility,
    Profile,
    Subscription,
    User,
)

router = APIRouter()


def _require_view_access(db: Session, viewer_id: uuid.UUID, post: Post) -> None:
    if post.author_user_id == viewer_id:
        return

    # paid gating
    if post.is_paid:
        has_sub = db.execute(
            select(1).select_from(Subscription).where(
                Subscription.subscriber_user_id == viewer_id,
                Subscription.creator_user_id == post.author_user_id,
                Subscription.status == "active",
                Subscription.deleted_at.is_(None),
            )
        ).first()
        if not has_sub:
            raise ApiError(status_code=403, message="Paid post: subscription required", code="FORBIDDEN")

    vis = post.visibility.value if hasattr(post.visibility, "value") else str(post.visibility)
    if vis == "public":
        return

    if vis == "followers":
        ok = db.execute(
            select(1).select_from(Follow).where(
                Follow.follower_user_id == viewer_id,
                Follow.followed_user_id == post.author_user_id,
                Follow.deleted_at.is_(None),
            )
        ).first()
        if not ok:
            raise ApiError(status_code=403, message="Not allowed to view this post", code="FORBIDDEN")
        return

    if vis == "family":
        # share any family group
        fgm1 = FamilyGroupMember.__table__.alias("fgm1")
        fgm2 = FamilyGroupMember.__table__.alias("fgm2")
        ok = db.execute(
            select(1)
            .select_from(fgm1.join(fgm2, fgm1.c.family_group_id == fgm2.c.family_group_id))
            .where(
                fgm1.c.user_id == viewer_id,
                fgm2.c.user_id == post.author_user_id,
                fgm1.c.deleted_at.is_(None),
                fgm2.c.deleted_at.is_(None),
            )
        ).first()
        if not ok:
            raise ApiError(status_code=403, message="Not allowed to view this post", code="FORBIDDEN")
        return

    if vis == "groups":
        if not post.community_id:
            raise ApiError(status_code=403, message="Not allowed to view this post", code="FORBIDDEN")
        ok = db.execute(
            select(1).select_from(CommunityMember).where(
                CommunityMember.community_id == post.community_id,
                CommunityMember.user_id == viewer_id,
                CommunityMember.deleted_at.is_(None),
            )
        ).first()
        if not ok:
            raise ApiError(status_code=403, message="Not allowed to view this post", code="FORBIDDEN")
        return

    raise ApiError(status_code=403, message="Not allowed to view this post", code="FORBIDDEN")


def _post_out(db: Session, viewer_id: uuid.UUID, post: Post) -> dict:
    profile = db.scalar(select(Profile).where(Profile.user_id == post.author_user_id, Profile.deleted_at.is_(None)))
    if not profile:
        raise ApiError(status_code=500, message="Author profile missing", code="INTERNAL_ERROR")

    media = db.scalars(
        select(PostMedia).where(PostMedia.post_id == post.id, PostMedia.deleted_at.is_(None)).order_by(PostMedia.position)
    ).all()

    like_count = db.scalar(
        select(func.count()).select_from(Like).where(Like.post_id == post.id, Like.deleted_at.is_(None))
    ) or 0
    comment_count = db.scalar(
        select(func.count()).select_from(Comment).where(Comment.post_id == post.id, Comment.deleted_at.is_(None))
    ) or 0
    is_liked = (
        db.execute(
            select(1).select_from(Like).where(
                Like.post_id == post.id,
                Like.user_id == viewer_id,
                Like.deleted_at.is_(None),
            )
        ).first()
        is not None
    )

    return {
        "id": post.id,
        "user_id": post.author_user_id,
        "caption": post.caption,
        "visibility": post.visibility.value if hasattr(post.visibility, "value") else str(post.visibility),
        "location": None,
        "community_id": post.community_id,
        "is_paid": post.is_paid,
        "price_cents": post.price_cents,
        "media": [{"id": m.id, "url": m.url, "position": m.position} for m in media],
        "author": {
            "id": post.author_user_id,
            "username": profile.username,
            "display_name": profile.display_name,
            "profile": {"avatar_url": profile.avatar_url},
        },
        "like_count": like_count,
        "comment_count": comment_count,
        "is_liked": is_liked,
        "created_at": post.created_at,
    }


@router.post("/posts", response_model=PostOut, status_code=201)
def create_post(
    body: CreatePostIn,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)

    if not body.caption and not body.media_urls:
        raise ApiError(status_code=400, message="caption or media_urls required", code="INVALID_INPUT")

    if body.visibility not in ("public", "followers", "family", "groups"):
        raise ApiError(status_code=400, message="Invalid visibility", code="INVALID_INPUT")

    if body.visibility == "groups" and not body.community_id:
        raise ApiError(status_code=400, message="community_id required for groups visibility", code="INVALID_INPUT")

    post = Post(
        author_user_id=me.id,
        caption=body.caption,
        visibility=PostVisibility(body.visibility),
        community_id=body.community_id,
        is_paid=body.is_paid,
        price_cents=body.price_cents if body.is_paid else None,
    )
    db.add(post)
    db.flush()

    for idx, url in enumerate(body.media_urls):
        db.add(PostMedia(post_id=post.id, url=url, position=idx))

    db.commit()
    db.refresh(post)
    return _post_out(db, me.id, post)


@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    post = db.scalar(select(Post).where(Post.id == post_id, Post.deleted_at.is_(None)))
    if not post:
        raise ApiError(status_code=404, message="Post not found", code="NOT_FOUND")
    _require_view_access(db, me.id, post)
    return _post_out(db, me.id, post)


@router.delete("/posts/{post_id}", response_model=MessageOut)
def delete_post(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    post = db.scalar(select(Post).where(Post.id == post_id, Post.deleted_at.is_(None)))
    if not post:
        raise ApiError(status_code=404, message="Post not found", code="NOT_FOUND")
    if post.author_user_id != me.id:
        raise ApiError(status_code=403, message="Only author can delete", code="FORBIDDEN")
    post.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Post deleted"}


@router.get("/users/{user_id}/posts")
def get_user_posts(
    user_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=50),
    cursor: str | None = Query(default=None),
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    created_before = None
    id_before = None
    if cursor:
        c = decode_cursor(cursor)
        created_before, id_before = c.created_at, c.id

    f_follow = exists(
        select(1).select_from(Follow).where(
            Follow.follower_user_id == me.id,
            Follow.followed_user_id == user_id,
            Follow.deleted_at.is_(None),
        )
    )
    fgm1 = FamilyGroupMember.__table__.alias("fgm1")
    fgm2 = FamilyGroupMember.__table__.alias("fgm2")
    f_family = exists(
        select(1)
        .select_from(fgm1.join(fgm2, fgm1.c.family_group_id == fgm2.c.family_group_id))
        .where(
            fgm1.c.user_id == me.id,
            fgm2.c.user_id == user_id,
            fgm1.c.deleted_at.is_(None),
            fgm2.c.deleted_at.is_(None),
        )
    )
    f_group_member = exists(
        select(1).select_from(CommunityMember).where(
            CommunityMember.community_id == Post.community_id,
            CommunityMember.user_id == me.id,
            CommunityMember.deleted_at.is_(None),
        )
    )

    base_filter = or_(
        Post.author_user_id == me.id,
        and_(Post.author_user_id == user_id, Post.visibility == "public"),
        and_(Post.author_user_id == user_id, Post.visibility == "followers", f_follow),
        and_(Post.author_user_id == user_id, Post.visibility == "family", f_family),
        and_(Post.author_user_id == user_id, Post.visibility == "groups", f_group_member),
    )

    q = select(Post).where(Post.deleted_at.is_(None), base_filter).order_by(desc(Post.created_at), desc(Post.id))
    if created_before and id_before:
        q = q.where(or_(Post.created_at < created_before, and_(Post.created_at == created_before, Post.id < id_before)))

    rows = db.scalars(q.limit(limit + 1)).all()
    has_more = len(rows) > limit
    rows = rows[:limit]

    items = [_post_out(db, me.id, p) for p in rows]
    next_cursor = encode_cursor(rows[-1].created_at, rows[-1].id) if has_more and rows else None
    return {"items": items, "next_cursor": next_cursor}


@router.get("/feed")
def get_feed(
    limit: int = Query(default=20, ge=1, le=50),
    cursor: str | None = Query(default=None),
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    created_before = None
    id_before = None
    if cursor:
        c = decode_cursor(cursor)
        created_before, id_before = c.created_at, c.id

    # visibility filters using EXISTS subqueries
    f_follow = exists(
        select(1).select_from(Follow).where(
            Follow.follower_user_id == me.id,
            Follow.followed_user_id == Post.author_user_id,
            Follow.deleted_at.is_(None),
        )
    )
    # share family group
    fgm1 = FamilyGroupMember.__table__.alias("fgm1")
    fgm2 = FamilyGroupMember.__table__.alias("fgm2")
    f_family = exists(
        select(1)
        .select_from(fgm1.join(fgm2, fgm1.c.family_group_id == fgm2.c.family_group_id))
        .where(
            fgm1.c.user_id == me.id,
            fgm2.c.user_id == Post.author_user_id,
            fgm1.c.deleted_at.is_(None),
            fgm2.c.deleted_at.is_(None),
        )
    )
    f_group_member = exists(
        select(1).select_from(CommunityMember).where(
            CommunityMember.community_id == Post.community_id,
            CommunityMember.user_id == me.id,
            CommunityMember.deleted_at.is_(None),
        )
    )

    base_filter = or_(
        Post.author_user_id == me.id,
        and_(Post.visibility == "public"),
        and_(Post.visibility == "followers", f_follow),
        and_(Post.visibility == "family", f_family),
        and_(Post.visibility == "groups", f_group_member),
    )

    q = select(Post).where(Post.deleted_at.is_(None), base_filter).order_by(desc(Post.created_at), desc(Post.id))
    if created_before and id_before:
        q = q.where(or_(Post.created_at < created_before, and_(Post.created_at == created_before, Post.id < id_before)))

    rows = db.scalars(q.limit(limit + 1)).all()
    has_more = len(rows) > limit
    rows = rows[:limit]

    items = [_post_out(db, me.id, p) for p in rows]
    next_cursor = encode_cursor(rows[-1].created_at, rows[-1].id) if has_more and rows else None
    db.commit()
    return {"items": items, "next_cursor": next_cursor}


@router.post("/posts/{post_id}/like", response_model=MessageOut)
def like_post(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    post = db.scalar(select(Post).where(Post.id == post_id, Post.deleted_at.is_(None)))
    if not post:
        raise ApiError(status_code=404, message="Post not found", code="NOT_FOUND")
    _require_view_access(db, me.id, post)

    db.add(Like(post_id=post_id, user_id=me.id))
    try:
        db.commit()
    except Exception:
        db.rollback()
    return {"message": "Post liked"}


@router.delete("/posts/{post_id}/like", response_model=MessageOut)
def unlike_post(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    row = db.scalar(select(Like).where(Like.post_id == post_id, Like.user_id == me.id, Like.deleted_at.is_(None)))
    if row:
        row.deleted_at = datetime.utcnow()
        db.commit()
    return {"message": "Post unliked"}


@router.get("/posts/{post_id}/comments")
def get_comments(
    post_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=50),
    cursor: str | None = Query(default=None),
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    post = db.scalar(select(Post).where(Post.id == post_id, Post.deleted_at.is_(None)))
    if not post:
        raise ApiError(status_code=404, message="Post not found", code="NOT_FOUND")
    _require_view_access(db, me.id, post)

    created_before = None
    id_before = None
    if cursor:
        c = decode_cursor(cursor)
        created_before, id_before = c.created_at, c.id

    q = select(Comment).where(Comment.post_id == post_id, Comment.deleted_at.is_(None)).order_by(
        desc(Comment.created_at), desc(Comment.id)
    )
    if created_before and id_before:
        q = q.where(
            or_(
                Comment.created_at < created_before,
                and_(Comment.created_at == created_before, Comment.id < id_before),
            )
        )

    rows = db.scalars(q.limit(limit + 1)).all()
    has_more = len(rows) > limit
    rows = rows[:limit]

    items = [
        {
            "id": c.id,
            "post_id": c.post_id,
            "user_id": c.user_id,
            "body": c.body,
            "parent_id": c.parent_id,
            "created_at": c.created_at,
        }
        for c in rows
    ]
    next_cursor = encode_cursor(rows[-1].created_at, rows[-1].id) if has_more and rows else None
    return {"items": items, "next_cursor": next_cursor}


@router.post("/posts/{post_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(
    post_id: uuid.UUID,
    body: AddCommentIn,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    post = db.scalar(select(Post).where(Post.id == post_id, Post.deleted_at.is_(None)))
    if not post:
        raise ApiError(status_code=404, message="Post not found", code="NOT_FOUND")
    _require_view_access(db, me.id, post)

    if body.parent_id:
        parent = db.scalar(select(Comment).where(Comment.id == body.parent_id, Comment.deleted_at.is_(None)))
        if not parent or parent.post_id != post_id:
            raise ApiError(status_code=404, message="Parent comment not found", code="NOT_FOUND")

    c = Comment(post_id=post_id, user_id=me.id, body=body.body, parent_id=body.parent_id)
    db.add(c)
    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "post_id": c.post_id,
        "user_id": c.user_id,
        "body": c.body,
        "parent_id": c.parent_id,
        "created_at": c.created_at,
    }

