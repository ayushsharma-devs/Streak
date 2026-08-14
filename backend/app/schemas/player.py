import re
import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class PlayerCreateResponse(BaseModel):
    player_id: uuid.UUID
    username: Optional[str] = None
    created: bool

    model_config = ConfigDict(from_attributes=True)


class UsernameUpdateRequest(BaseModel):
    username: str = Field(..., description="The player's chosen display name")

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Username must be a string")
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Username must be at least 2 characters")
        if len(trimmed) > 30:
            raise ValueError("Username cannot exceed 30 characters")
        if not re.match(r"^[a-zA-Z0-9_ -]+$", trimmed):
            raise ValueError("Username can only contain letters, numbers, spaces, underscores, and hyphens")
        return trimmed


class UsernameUpdateResponse(BaseModel):
    player_id: uuid.UUID
    username: str

    model_config = ConfigDict(from_attributes=True)
