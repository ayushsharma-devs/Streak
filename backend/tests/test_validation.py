import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.security import validate_player_id
from app.schemas.game import GuessRequest
from app.utils.normalization import normalize_text


def test_normalization_whitespace_and_casefold():
    assert normalize_text("  KEYBOARD  ") == "keyboard"
    assert normalize_text("FootSteps") == "footsteps"
    assert normalize_text("\t  echo \n") == "echo"


def test_normalization_unicode():
    # Full-width characters normalized via NFKC
    assert normalize_text("ＥＣＨＯ") == "echo"
    # Accented normalization
    assert normalize_text("café") == "café"


def test_empty_guess_rejected():
    with pytest.raises(ValidationError):
        GuessRequest(guess="")


def test_whitespace_only_guess_rejected():
    with pytest.raises(ValidationError):
        GuessRequest(guess="   \t\n  ")


def test_oversized_guess_rejected():
    oversized = "a" * 101
    with pytest.raises(ValidationError):
        GuessRequest(guess=oversized)

    valid_100 = "a" * 100
    req = GuessRequest(guess=valid_100)
    assert len(req.guess) == 100


def test_malformed_uuid_rejected():
    with pytest.raises(HTTPException) as exc_info:
        validate_player_id("not-a-valid-uuid")
    assert exc_info.value.status_code == 400
    assert "Invalid player UUID" in exc_info.value.detail


def test_missing_uuid_rejected():
    with pytest.raises(HTTPException) as exc_info:
        validate_player_id(None)
    assert exc_info.value.status_code == 400
    assert "Missing" in exc_info.value.detail
