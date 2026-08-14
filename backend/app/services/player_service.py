import uuid
from typing import Optional, Tuple
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models import Player


def get_player(db: Session, player_id: uuid.UUID) -> Optional[Player]:
    """
    Retrieves an existing player by their UUID.
    """
    return db.query(Player).filter(Player.player_id == player_id).first()


def get_or_create_player(db: Session, player_id: uuid.UUID) -> Tuple[Player, bool]:
    """
    Retrieves a player if they exist, or creates a new anonymous player record.
    Returns a tuple of (player, created_boolean).
    """
    player = get_player(db, player_id)
    if player is not None:
        return player, False

    new_player = Player(
        player_id=player_id,
        username=None,
        current_streak=0,
        highest_streak=0,
    )
    db.add(new_player)
    db.commit()
    db.refresh(new_player)
    return new_player, True


def update_player_username(db: Session, player_id: uuid.UUID, new_username: str) -> Player:
    """
    Updates the display username for an existing player.
    """
    player = get_player(db, player_id)
    if not player:
        raise HTTPException(
            status_code=404,
            detail="Player not found. Please register player identity first.",
        )

    player.username = new_username
    db.commit()
    db.refresh(player)
    return player
