import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional, Tuple
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import Attempt, Player
from app.schemas.game import GameResult, GameStateResponse, GuessResponse
from app.services.player_service import get_player
from app.services.puzzle_service import (
    get_game_date,
    get_puzzle_for_date,
    get_safe_puzzle_for_date,
)
from app.utils.normalization import normalize_text


def calculate_streak_update(
    current_streak: int,
    highest_streak: int,
    last_played_date: Optional[date],
    today: date,
    is_correct: bool,
) -> Tuple[int, int]:
    """
    Pure deterministic streak state calculation.

    Rules:
    - First correct play (or missed day): current_streak = 1
    - Consecutive correct play (last_played_date == yesterday): current_streak += 1
    - Wrong guess: current_streak = 0
    - highest_streak: max(highest_streak, current_streak), never decreases.
    """
    yesterday = today - timedelta(days=1)
    if is_correct:
        if last_played_date == yesterday:
            new_streak = current_streak + 1
        else:
            new_streak = 1
    else:
        new_streak = 0

    new_highest = max(highest_streak, new_streak)
    return new_streak, new_highest


def get_game_state_for_player(db: Session, player_id: uuid.UUID) -> GameStateResponse:
    """
    Retrieves safe game state for today for the specified player.
    Never exposes puzzle answer or raw stored guesses.
    """
    player = get_player(db, player_id)
    if not player:
        raise HTTPException(
            status_code=404,
            detail="Player not found. Please register player identity first.",
        )

    today = get_game_date()
    safe_puzzle = get_safe_puzzle_for_date(today)

    attempt = (
        db.query(Attempt)
        .filter(Attempt.player_id == player_id, Attempt.puzzle_date == today)
        .first()
    )

    has_played = attempt is not None
    result = GameResult(correct=attempt.correct) if attempt is not None else None

    return GameStateResponse(
        date=today,
        puzzle=safe_puzzle,
        username=player.username,
        has_played_today=has_played,
        current_streak=player.current_streak,
        highest_streak=player.highest_streak,
        result=result,
    )


def process_guess(db: Session, player_id: uuid.UUID, raw_guess: str) -> GuessResponse:
    """
    Processes a player's daily guess with strict transactional safety.
    Guarantees that only one attempt can succeed per player per calendar day.
    """
    today = get_game_date()

    # Attempt to lock player row if supported by database engine (e.g. Postgres)
    try:
        player = (
            db.query(Player)
            .filter(Player.player_id == player_id)
            .with_for_update()
            .first()
        )
    except Exception:
        # Fallback for SQLite in tests where with_for_update is a no-op or unneeded
        player = get_player(db, player_id)

    if not player:
        raise HTTPException(
            status_code=404,
            detail="Player not found. Please register player identity first.",
        )

    # Check if an attempt for today already exists in the database
    existing_attempt = (
        db.query(Attempt)
        .filter(Attempt.player_id == player_id, Attempt.puzzle_date == today)
        .first()
    )
    if existing_attempt is not None:
        raise HTTPException(
            status_code=409,
            detail="You have already submitted a guess for today's riddle.",
        )

    # Server-side puzzle evaluation
    puzzle = get_puzzle_for_date(today)
    normalized_guess = normalize_text(raw_guess)
    normalized_answer = normalize_text(puzzle["answer"])
    is_correct = normalized_guess == normalized_answer

    # Calculate streak updates
    new_streak, new_highest = calculate_streak_update(
        current_streak=player.current_streak,
        highest_streak=player.highest_streak,
        last_played_date=player.last_played_date,
        today=today,
        is_correct=is_correct,
    )

    # Update player state
    player.current_streak = new_streak
    player.highest_streak = new_highest
    player.last_played_date = today

    # Record the attempt
    attempt = Attempt(
        id=uuid.uuid4(),
        player_id=player.player_id,
        puzzle_id=puzzle["id"],
        puzzle_date=today,
        guess=normalized_guess,
        correct=is_correct,
        created_at=datetime.now(timezone.IST),
    )

    db.add(attempt)

    try:
        db.commit()
        db.refresh(player)
    except IntegrityError:
        db.rollback()
        # Database UNIQUE(player_id, puzzle_date) constraint caught concurrent attempt
        raise HTTPException(
            status_code=409,
            detail="You have already submitted a guess for today's riddle.",
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An error occurred while recording your guess.",
        )

    return GuessResponse(
        correct=is_correct,
        current_streak=player.current_streak,
        highest_streak=player.highest_streak,
    )
