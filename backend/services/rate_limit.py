"""Lightweight in-memory rate limiting for public endpoints.

The draft-analysis endpoint is intentionally public (guest "instant demo" does
not send an Authorization header), so it needs abuse protection independent of
authentication. This uses a per-client-IP sliding window.

Disabled by default: set ANALYZE_RATE_LIMIT_PER_MINUTE to a positive integer to
enable it. Defaulting to 0 keeps local development and the test-suite
unaffected, mirroring the monitoring scheduler's opt-in behaviour.
"""

import os
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import HTTPException, Request


_WINDOW_SECONDS = 60
_hits: Dict[str, Deque[float]] = defaultdict(deque)


def get_rate_limit_per_minute() -> int:
    raw = os.getenv("ANALYZE_RATE_LIMIT_PER_MINUTE", "0")

    try:
        return max(0, int(raw))
    except (TypeError, ValueError):
        return 0


def _client_key(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def enforce_rate_limit(request: Request) -> None:
    """Reject the request with 429 when the caller exceeds the configured rate."""

    limit = get_rate_limit_per_minute()

    if limit <= 0:
        return

    now = time.monotonic()
    bucket = _hits[_client_key(request)]

    while bucket and now - bucket[0] > _WINDOW_SECONDS:
        bucket.popleft()

    if len(bucket) >= limit:
        retry_after = int(_WINDOW_SECONDS - (now - bucket[0])) + 1
        raise HTTPException(
            status_code=429,
            detail=(
                "Too many analysis requests. Please slow down and try again "
                "shortly."
            ),
            headers={"Retry-After": str(retry_after)},
        )

    bucket.append(now)
