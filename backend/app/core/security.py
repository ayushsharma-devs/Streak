import uuid
from fastapi import Header, HTTPException


def validate_player_id(x_player_id: str | None = Header(None, alias="X-Player-ID")) -> uuid.UUID:
    """
    Validates that the incoming X-Player-ID header is present and is a valid UUID.
    Treats client input as untrusted and returns a clean 400 response on malformed input.
    """
    if not x_player_id or not x_player_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Missing required X-Player-ID header",
        )

    try:
        player_uuid = uuid.UUID(x_player_id.strip())
        return player_uuid
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid player UUID format in X-Player-ID header",
        )
