from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, desc, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.cursor import decode_cursor, encode_cursor
from app.api.deps import ensure_user_profile
from app.api.schemas import CreateEventIn, EventOut, MessageOut, RSVPIn
from app.auth.deps import get_current_user
from app.auth.supabase_jwt import AuthUser
from app.core.db import get_db
from app.core.errors import ApiError
from app.models import Event, EventAttendee, RSVPStatus

router = APIRouter()


@router.post("/events", response_model=EventOut, status_code=201)
def create_event(
    body: CreateEventIn,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    e = Event(
        organizer_user_id=me.id,
        community_id=body.community_id,
        title=body.title,
        description=body.description,
        cover_url=body.cover_url,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@router.get("/events/feed")
def events_feed(
    limit: int = Query(default=20, ge=1, le=50),
    cursor: str | None = Query(default=None),
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    ensure_user_profile(db, auth)
    created_before = None
    id_before = None
    if cursor:
        c = decode_cursor(cursor)
        created_before, id_before = c.created_at, c.id

    q = select(Event).where(Event.deleted_at.is_(None)).order_by(desc(Event.starts_at), desc(Event.id))
    if created_before and id_before:
        q = q.where(or_(Event.starts_at < created_before, and_(Event.starts_at == created_before, Event.id < id_before)))

    rows = db.scalars(q.limit(limit + 1)).all()
    has_more = len(rows) > limit
    rows = rows[:limit]

    items = [
        {
            "id": e.id,
            "organizer_user_id": e.organizer_user_id,
            "community_id": e.community_id,
            "title": e.title,
            "description": e.description,
            "cover_url": e.cover_url,
            "starts_at": e.starts_at,
            "ends_at": e.ends_at,
        }
        for e in rows
    ]
    next_cursor = encode_cursor(rows[-1].starts_at, rows[-1].id) if has_more and rows else None
    return {"items": items, "next_cursor": next_cursor}


@router.post("/events/{event_id}/rsvp", response_model=MessageOut)
def rsvp(
    event_id: uuid.UUID,
    body: RSVPIn,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    e = db.scalar(select(Event).where(Event.id == event_id, Event.deleted_at.is_(None)))
    if not e:
        raise ApiError(status_code=404, message="Event not found", code="NOT_FOUND")

    if body.status not in ("going", "interested", "not_going"):
        raise ApiError(status_code=400, message="Invalid RSVP status", code="INVALID_INPUT")

    row = db.scalar(
        select(EventAttendee).where(
            EventAttendee.event_id == event_id,
            EventAttendee.user_id == me.id,
            EventAttendee.deleted_at.is_(None),
        )
    )
    if not row:
        row = EventAttendee(event_id=event_id, user_id=me.id, status=RSVPStatus(body.status))
        db.add(row)
    else:
        row.status = RSVPStatus(body.status)
        row.updated_at = datetime.utcnow()

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"message": "RSVP updated"}

