from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import ensure_user_profile
from app.api.schemas import MessageOut
from app.auth.deps import get_current_user
from app.auth.supabase_jwt import AuthUser
from app.core.db import get_db
from app.core.errors import ApiError
from app.models import Creator, Payment, PaymentStatus, Profile, Subscription, Tip

router = APIRouter()


class CreatorProfileIn(BaseModel):
    tagline: str | None = Field(default=None, max_length=140)
    subscription_price_cents: int = Field(default=0, ge=0)


class TipIn(BaseModel):
    amount_cents: int = Field(ge=1)
    message: str | None = None
    post_id: uuid.UUID | None = None


@router.post("/creators/profile")
def upsert_creator_profile(
    body: CreatorProfileIn,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, profile = ensure_user_profile(db, auth)
    row = db.scalar(select(Creator).where(Creator.user_id == me.id, Creator.deleted_at.is_(None)))
    if not row:
        row = Creator(user_id=me.id, tagline=body.tagline, subscription_price_cents=body.subscription_price_cents)
        db.add(row)
    else:
        row.tagline = body.tagline
        row.subscription_price_cents = body.subscription_price_cents

    profile.is_creator = True
    db.commit()
    return {"user_id": me.id, "tagline": row.tagline, "subscription_price_cents": row.subscription_price_cents}


@router.post("/creators/{creator_user_id}/subscribe", response_model=MessageOut)
def subscribe(
    creator_user_id: uuid.UUID,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    if me.id == creator_user_id:
        raise ApiError(status_code=400, message="Cannot subscribe to yourself", code="INVALID_INPUT")

    db.add(Subscription(subscriber_user_id=me.id, creator_user_id=creator_user_id, status="active"))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"message": "Subscribed (payment stubbed)"}


@router.delete("/creators/{creator_user_id}/subscribe", response_model=MessageOut)
def unsubscribe(
    creator_user_id: uuid.UUID,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    row = db.scalar(
        select(Subscription).where(
            Subscription.subscriber_user_id == me.id,
            Subscription.creator_user_id == creator_user_id,
            Subscription.deleted_at.is_(None),
        )
    )
    if row:
        row.status = "cancelled"
        row.deleted_at = datetime.utcnow()
        db.commit()
    return {"message": "Unsubscribed"}


@router.post("/creators/{creator_user_id}/tip")
def tip(
    creator_user_id: uuid.UUID,
    body: TipIn,
    db: Session = Depends(get_db),
    auth: AuthUser = Depends(get_current_user),
):
    me, _ = ensure_user_profile(db, auth)
    p = Payment(payer_user_id=me.id, amount_cents=body.amount_cents, status=PaymentStatus.succeeded, provider="stub")
    db.add(p)
    db.flush()
    t = Tip(
        creator_user_id=creator_user_id,
        from_user_id=me.id,
        post_id=body.post_id,
        payment_id=p.id,
        amount_cents=body.amount_cents,
        message=body.message,
    )
    db.add(t)
    db.commit()
    return {"tip": {"id": t.id, "amount_cents": t.amount_cents, "created_at": t.created_at}}

