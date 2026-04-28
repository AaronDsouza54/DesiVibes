from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


def utcnow() -> datetime:
    return datetime.utcnow()


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), default=utcnow, onupdate=utcnow, nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)


class PostVisibility(str, enum.Enum):
    public = "public"
    followers = "followers"
    family = "family"
    groups = "groups"


class CommunityRole(str, enum.Enum):
    member = "member"
    admin = "admin"
    owner = "owner"


class RSVPStatus(str, enum.Enum):
    going = "going"
    interested = "interested"
    not_going = "not_going"


class FamilyRole(str, enum.Enum):
    parent = "parent"
    sibling = "sibling"
    child = "child"
    spouse = "spouse"
    relative = "relative"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supabase_user_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)

    profile: Mapped["Profile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")


class Profile(TimestampMixin, Base):
    __tablename__ = "profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    username: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    display_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_creator: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped[User] = relationship(back_populates="profile")


class Follow(TimestampMixin, Base):
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("follower_user_id", "followed_user_id", name="uq_follows_pair"),
        Index("ix_follows_followed_created", "followed_user_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    follower_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    followed_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)


class Community(TimestampMixin, Base):
    __tablename__ = "communities"
    __table_args__ = (UniqueConstraint("slug", name="uq_communities_slug"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    creator_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tags: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class CommunityMember(TimestampMixin, Base):
    __tablename__ = "community_members"
    __table_args__ = (
        UniqueConstraint("community_id", "user_id", name="uq_community_members_pair"),
        Index("ix_community_members_community", "community_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    community_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[CommunityRole] = mapped_column(Enum(CommunityRole), default=CommunityRole.member, nullable=False)


class Post(TimestampMixin, Base):
    __tablename__ = "posts"
    __table_args__ = (
        Index("ix_posts_author_created", "author_user_id", "created_at"),
        Index("ix_posts_created", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    visibility: Mapped[PostVisibility] = mapped_column(Enum(PostVisibility), nullable=False, index=True)
    community_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("communities.id", ondelete="SET NULL"))

    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    price_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)

    __table_args__ = (
        CheckConstraint("(is_paid = false) OR (price_cents IS NOT NULL AND price_cents >= 0)", name="ck_posts_paid"),
        Index("ix_posts_author_created", "author_user_id", "created_at"),
        Index("ix_posts_created", "created_at"),
        Index("ix_posts_visibility_created", "visibility", "created_at"),
    )


class PostMedia(TimestampMixin, Base):
    __tablename__ = "post_media"
    __table_args__ = (Index("ix_post_media_post", "post_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class PostVisibilityRule(TimestampMixin, Base):
    __tablename__ = "post_visibility_rules"
    __table_args__ = (
        UniqueConstraint("post_id", "allowed_user_id", name="uq_post_vis_user"),
        UniqueConstraint("post_id", "allowed_community_id", name="uq_post_vis_community"),
        Index("ix_post_visibility_rules_post", "post_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    allowed_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    allowed_community_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("communities.id", ondelete="CASCADE"))


class Like(TimestampMixin, Base):
    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_likes_pair"),
        Index("ix_likes_post", "post_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)


class Comment(TimestampMixin, Base):
    __tablename__ = "comments"
    __table_args__ = (Index("ix_comments_post_created", "post_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"))


class Event(TimestampMixin, Base):
    __tablename__ = "events"
    __table_args__ = (Index("ix_events_starts_at", "starts_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organizer_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    community_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("communities.id", ondelete="SET NULL"))

    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)


class EventAttendee(TimestampMixin, Base):
    __tablename__ = "event_attendees"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_attendees_pair"),
        Index("ix_event_attendees_event", "event_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[RSVPStatus] = mapped_column(Enum(RSVPStatus), default=RSVPStatus.going, nullable=False)


class FamilyGroup(TimestampMixin, Base):
    __tablename__ = "family_groups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    owner_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)


class FamilyGroupMember(TimestampMixin, Base):
    __tablename__ = "family_group_members"
    __table_args__ = (
        UniqueConstraint("family_group_id", "user_id", name="uq_family_group_members_pair"),
        Index("ix_family_group_members_group", "family_group_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_group_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("family_groups.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[FamilyRole] = mapped_column(Enum(FamilyRole), default=FamilyRole.relative, nullable=False)


class SharedAlbum(TimestampMixin, Base):
    __tablename__ = "shared_albums"
    __table_args__ = (Index("ix_shared_albums_family", "family_group_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_group_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("family_groups.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)


class AlbumMedia(TimestampMixin, Base):
    __tablename__ = "album_media"
    __table_args__ = (Index("ix_album_media_album", "album_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    album_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shared_albums.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Creator(TimestampMixin, Base):
    __tablename__ = "creators"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    tagline: Mapped[str | None] = mapped_column(String(140), nullable=True)
    subscription_price_cents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Subscription(TimestampMixin, Base):
    __tablename__ = "subscriptions"
    __table_args__ = (
        UniqueConstraint("subscriber_user_id", "creator_user_id", name="uq_subscriptions_pair"),
        Index("ix_subscriptions_creator", "creator_user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscriber_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    creator_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="active", nullable=False)


class Payment(TimestampMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (Index("ix_payments_user_created", "payer_user_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payer_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.succeeded, nullable=False)
    provider: Mapped[str] = mapped_column(String(32), default="stub", nullable=False)
    provider_ref: Mapped[str | None] = mapped_column(String(128), nullable=True)


class Tip(TimestampMixin, Base):
    __tablename__ = "tips"
    __table_args__ = (Index("ix_tips_creator_created", "creator_user_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    creator_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    from_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("posts.id", ondelete="SET NULL"))
    payment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("payments.id", ondelete="SET NULL"))
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

