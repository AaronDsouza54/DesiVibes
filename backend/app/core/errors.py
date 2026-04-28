from __future__ import annotations

from typing import Any, Optional

from fastapi import HTTPException


class ApiError(HTTPException):
    def __init__(
        self,
        *,
        status_code: int,
        message: str,
        code: str,
        details: Optional[Any] = None,
    ):
        super().__init__(
            status_code=status_code,
            detail={"error": message, "code": code, "status": status_code, "details": details},
        )

