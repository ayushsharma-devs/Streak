import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import validate_player_id
from app.db.session import get_db
from app.schemas.game import GameStateResponse, GuessRequest, GuessResponse
from app.schemas.player import PlayerCreateResponse
from app.services.game_service import get_game_state_for_player, process_guess
from app.services.player_service import get_or_create_player

router = APIRouter(tags=["game"])


@router.post("/api/player", response_model=PlayerCreateResponse)
def register_or_get_player(
    player_id: uuid.UUID = Depends(validate_player_id),
    db: Session = Depends(get_db),
) -> PlayerCreateResponse:
    """
    Registers an anonymous player by UUID if they don't already exist,
    or retrieves the existing player.
    """
    player, created = get_or_create_player(db, player_id)
    return PlayerCreateResponse(
        player_id=player.player_id,
        created=created,
    )


@router.get("/api/game/today", response_model=GameStateResponse)
def get_today_game(
    player_id: uuid.UUID = Depends(validate_player_id),
    db: Session = Depends(get_db),
) -> GameStateResponse:
    """
    Returns today's safe game state for the player.
    Answers and stored guesses are never returned.
    """
    return get_game_state_for_player(db, player_id)


@router.post("/api/game/guess", response_model=GuessResponse)
def submit_guess(
    guess_data: GuessRequest,
    player_id: uuid.UUID = Depends(validate_player_id),
    db: Session = Depends(get_db),
) -> GuessResponse:
    """
    Submits a single guess for today's riddle.
    Enforces one guess per day at both service and database constraint levels.
    """
    return process_guess(db, player_id, guess_data.guess)
