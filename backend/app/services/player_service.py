import uuid
from typing import Optional, Tuple
from sqlalchemy.exc import IntegrityError
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
        current_streak=0,
        highest_streak=0,
    )
    db.add(new_player)
    try:
        db.commit()
        db.refresh(new_player)
        return new_player, True
    except IntegrityError:
        # Another request created this UUID after our initial lookup. Rolling
        # back before re-reading is required by PostgreSQL transaction rules.
        db.rollback()
        player = get_player(db, player_id)
        if player is not None:
            return player, False
        raise
