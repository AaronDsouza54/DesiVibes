from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    error: str
    code: str
    status: int
    details: object | None = None


class CursorPage(BaseModel):
    items: list
    next_cursor: str | None


class ProfileOut(BaseModel):
    username: str
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    is_creator: bool = False


class UserMeOut(BaseModel):
    id: uuid.UUID
    supabase_user_id: str
    email: str | None
    profile: ProfileOut


class UpdateMeIn(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=32)
    display_name: str | None = Field(default=None, max_length=64)
    bio: str | None = None
    avatar_url: str | None = None


class UserOut(BaseModel):
    id: uuid.UUID
    email: str | None
    profile: ProfileOut


class UserGetOut(BaseModel):
    user: UserOut
    is_following: bool


class PostMediaOut(BaseModel):
    id: uuid.UUID
    url: str
    position: int


class PostAuthorOut(BaseModel):
    id: uuid.UUID
    username: str
    display_name: str | None
    profile: dict = Field(default_factory=dict)


class PostOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    caption: str | None
    visibility: str
    location: str | None = None
    community_id: uuid.UUID | None = None
    is_paid: bool
    price_cents: int | None = None
    media: List[PostMediaOut]
    author: PostAuthorOut
    like_count: int
    comment_count: int
    is_liked: bool
    created_at: datetime


class CreatePostIn(BaseModel):
    caption: str | None = None
    visibility: str
    location: str | None = None
    community_id: uuid.UUID | None = None
    is_paid: bool = False
    price_cents: int | None = None
    media_urls: List[str] = Field(default_factory=list)


class CommentOut(BaseModel):
    id: uuid.UUID
    post_id: uuid.UUID
    user_id: uuid.UUID
    body: str
    parent_id: uuid.UUID | None = None
    created_at: datetime


class AddCommentIn(BaseModel):
    body: str = Field(min_length=1)
    parent_id: uuid.UUID | None = None


class CommunityOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    avatar_url: str | None = None
    is_private: bool = False
    creator_user_id: uuid.UUID
    is_member: bool = False


class CreateCommunityIn(BaseModel):
    name: str
    slug: str
    description: str | None = None
    avatar_url: str | None = None
    is_private: bool = False


class EventOut(BaseModel):
    id: uuid.UUID
    organizer_user_id: uuid.UUID
    community_id: uuid.UUID | None = None
    title: str
    description: str | None = None
    cover_url: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None


class CreateEventIn(BaseModel):
    title: str
    description: str | None = None
    cover_url: str | None = None
    community_id: uuid.UUID | None = None
    location_name: str | None = None  # accepted but currently unused in model
    location_address: str | None = None  # accepted but currently unused in model
    location_city: str | None = None  # accepted but currently unused in model
    is_virtual: bool = False  # accepted but currently unused in model
    virtual_url: str | None = None  # accepted but currently unused in model
    starts_at: datetime
    ends_at: datetime | None = None
    is_free: bool = True  # accepted but currently unused in model


class RSVPIn(BaseModel):
    status: str


class MessageOut(BaseModel):
    message: str

