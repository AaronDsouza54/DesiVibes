from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import ensure_user_profile
from app.api.schemas import MessageOut
from app.auth.deps import get_current_user
from app.auth.supabase_jwt import AuthUser
from app.core.db import get_db
from app.core.errors import ApiError
from app.models import AlbumMedia, FamilyGroup, FamilyGroupMember, FamilyRole, SharedAlbum

router = APIRouter()


class CreateFamilyGroupIn(BaseModel):
    name: str


class AddFamilyMemberIn(BaseModel):
    user_id: uuid.UUID
    role: str = "relative"


class CreateAlbumIn(BaseModel):
    title: str


@router.post("/family-groups")
def create_family_group(
    body: CreateFamilyGroupIn,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    g = FamilyGroup(name=body.name, owner_user_id=me.id)
    db.add(g)
    db.flush()
    db.add(FamilyGroupMember(family_group_id=g.id, user_id=me.id, role=FamilyRole.relative))
    db.commit()
    return {"id": g.id, "name": g.name}


@router.get("/family-groups")
def list_family_groups(
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    rows = db.execute(
        select(FamilyGroup.id, FamilyGroup.name)
        .join(FamilyGroupMember, FamilyGroupMember.family_group_id == FamilyGroup.id)
        .where(FamilyGroupMember.user_id == me.id, FamilyGroupMember.deleted_at.is_(None), FamilyGroup.deleted_at.is_(None))
    ).all()
    return {"items": [{"id": r.id, "name": r.name} for r in rows]}


@router.post("/family-groups/{family_group_id}/members", response_model=MessageOut)
def add_family_member(
    family_group_id: uuid.UUID,
    body: AddFamilyMemberIn,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    g = db.scalar(select(FamilyGroup).where(FamilyGroup.id == family_group_id, FamilyGroup.deleted_at.is_(None)))
    if not g:
        raise ApiError(status_code=404, message="Family group not found", code="NOT_FOUND")

    # only owner can add for hackathon simplicity
    if g.owner_user_id != me.id:
        raise ApiError(status_code=403, message="Only owner can add members", code="FORBIDDEN")

    if body.role not in set(r.value for r in FamilyRole):
        raise ApiError(status_code=400, message="Invalid family role", code="INVALID_INPUT")

    db.add(
        FamilyGroupMember(
            family_group_id=family_group_id,
            user_id=body.user_id,
            role=FamilyRole(body.role),
        )
    )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"message": "Member added"}


@router.get("/family-groups/{family_group_id}/albums")
def list_albums(
    family_group_id: uuid.UUID,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    is_member = db.execute(
        select(1).select_from(FamilyGroupMember).where(
            FamilyGroupMember.family_group_id == family_group_id,
            FamilyGroupMember.user_id == me.id,
            FamilyGroupMember.deleted_at.is_(None),
        )
    ).first()
    if not is_member:
        raise ApiError(status_code=403, message="Not a family group member", code="FORBIDDEN")

    albums = db.scalars(
        select(SharedAlbum).where(SharedAlbum.family_group_id == family_group_id, SharedAlbum.deleted_at.is_(None))
    ).all()
    return {"items": [{"id": a.id, "title": a.title} for a in albums]}


@router.post("/family-groups/{family_group_id}/albums")
def create_album(
    family_group_id: uuid.UUID,
    body: CreateAlbumIn,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    is_member = db.execute(
        select(1).select_from(FamilyGroupMember).where(
            FamilyGroupMember.family_group_id == family_group_id,
            FamilyGroupMember.user_id == me.id,
            FamilyGroupMember.deleted_at.is_(None),
        )
    ).first()
    if not is_member:
        raise ApiError(status_code=403, message="Not a family group member", code="FORBIDDEN")

    a = SharedAlbum(family_group_id=family_group_id, title=body.title)
    db.add(a)
    db.commit()
    db.refresh(a)
    return {"id": a.id, "title": a.title}

