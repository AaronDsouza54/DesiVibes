from __future__ import annotations

import base64
import json
import uuid
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Cursor:
    created_at: datetime
    id: uuid.UUID


def encode_cursor(created_at: datetime, row_id: uuid.UUID) -> str:
    payload = {"created_at": created_at.isoformat(), "id": str(row_id)}
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def decode_cursor(cursor: str) -> Cursor:
    padded = cursor + "=" * ((4 - (len(cursor) % 4)) % 4)
    raw = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
    data = json.loads(raw)
    return Cursor(created_at=datetime.fromisoformat(data["created_at"]), id=uuid.UUID(data["id"]))

