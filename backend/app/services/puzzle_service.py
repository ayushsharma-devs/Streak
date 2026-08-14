import json
import os
from datetime import date, datetime
from typing import Any, Dict, List
import zoneinfo

from app.core.config import settings
from app.schemas.game import SafePuzzle

# Resolve static puzzles data file relative to this service
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "puzzles.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    PUZZLES: List[Dict[str, Any]] = json.load(f)

if not PUZZLES:
    raise RuntimeError("Puzzle data is empty or missing from puzzles.json")


def get_game_date(tz_name: str | None = None) -> date:
    """
    Centralized game-date determination using configured GAME_TIMEZONE.
    Prevents scattered datetime.now() calls.
    """
    tz_to_use = tz_name or settings.GAME_TIMEZONE
    tz = zoneinfo.ZoneInfo(tz_to_use)
    return datetime.now(tz).date()


def get_puzzle_for_date(game_date: date) -> Dict[str, Any]:
    """
    Deterministically selects a puzzle based on the game date and PUZZLE_START_DATE.
    Uses modulo so the rotation never runs out or fails.
    """
    delta_days = (game_date - settings.PUZZLE_START_DATE).days
    puzzle_index = delta_days % len(PUZZLES)
    return PUZZLES[puzzle_index]


def get_safe_puzzle_for_date(game_date: date) -> SafePuzzle:
    """
    Returns safe puzzle metadata for the client.
    Guarantees the answer is never present in the returned model.
    """
    puzzle = get_puzzle_for_date(game_date)
    return SafePuzzle(
        id=puzzle["id"],
        clue=puzzle["clue"],
        word_lengths=puzzle["word_lengths"],
    )
