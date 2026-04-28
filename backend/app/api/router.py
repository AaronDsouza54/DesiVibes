from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import communities, events, family, me, posts, social, creators

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(me.router, tags=["me"])
api_router.include_router(social.router, tags=["social"])
api_router.include_router(posts.router, tags=["posts"])
api_router.include_router(communities.router, tags=["communities"])
api_router.include_router(events.router, tags=["events"])
api_router.include_router(family.router, tags=["family"])
api_router.include_router(creators.router, tags=["creators"])

