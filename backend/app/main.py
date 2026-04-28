from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.errors import ApiError
from app.api.router import api_router


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title="Desyn API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(ApiError)
    async def api_error_handler(_: Request, exc: ApiError):
        # ApiError.detail already matches our standard error shape.
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException):
        if isinstance(exc.detail, dict) and {"error", "code", "status"}.issubset(exc.detail.keys()):
            return JSONResponse(status_code=exc.status_code, content=exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": str(exc.detail), "code": "HTTP_ERROR", "status": exc.status_code, "details": None},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, __: Exception):
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "code": "INTERNAL_ERROR", "status": 500, "details": None},
        )

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    app.include_router(api_router)

    return app


app = create_app()

