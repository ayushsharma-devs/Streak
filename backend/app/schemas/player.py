import uuid
from pydantic import BaseModel, ConfigDict


class PlayerCreateResponse(BaseModel):
    player_id: uuid.UUID
    created: bool

    model_config = ConfigDict(from_attributes=True)
