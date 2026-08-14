from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class SafePuzzle(BaseModel):
    id: int
    clue: str
    word_lengths: List[int]

    model_config = ConfigDict(from_attributes=True)


class GameResult(BaseModel):
    correct: bool

    model_config = ConfigDict(from_attributes=True)


class GameStateResponse(BaseModel):
    date: date
    puzzle: SafePuzzle
    username: Optional[str] = None
    has_played_today: bool
    current_streak: int
    highest_streak: int
    result: Optional[GameResult] = None

    model_config = ConfigDict(from_attributes=True)


class GuessRequest(BaseModel):
    guess: str = Field(..., description="The player's guess for today's riddle")

    @field_validator("guess")
    @classmethod
    def validate_guess(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Guess must be a string")
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Guess cannot be empty or whitespace-only")
        if len(trimmed) > 100:
            raise ValueError("Guess cannot exceed 100 characters")
        return trimmed


class GuessResponse(BaseModel):
    correct: bool
    current_streak: int
    highest_streak: int

    model_config = ConfigDict(from_attributes=True)
