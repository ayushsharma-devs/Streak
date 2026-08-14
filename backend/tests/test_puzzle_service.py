from datetime import date
from app.services.puzzle_service import (
    PUZZLES,
    get_puzzle_for_date,
    get_safe_puzzle_for_date,
)


def test_puzzle_selection_is_deterministic():
    """
    Test that the same date always returns the exact same puzzle.
    """
    test_date = date(2026, 8, 14)
    puzzle1 = get_puzzle_for_date(test_date)
    puzzle2 = get_puzzle_for_date(test_date)

    assert puzzle1["id"] == puzzle2["id"]
    assert puzzle1["clue"] == puzzle2["clue"]
    assert puzzle1["answer"] == puzzle2["answer"]


def test_puzzle_rotation_modulo_overflow():
    """
    Test that dates far beyond the length of the puzzle list wrap safely without errors.
    """
    total_puzzles = len(PUZZLES)
    start_date = date(2026, 1, 1)

    # 1000 days later
    future_date = date(2028, 9, 27)
    puzzle = get_puzzle_for_date(future_date)
    assert puzzle is not None
    assert "id" in puzzle
    assert "clue" in puzzle
    assert "answer" in puzzle
    assert "word_lengths" in puzzle


def test_safe_puzzle_strips_answer():
    """
    Test that get_safe_puzzle_for_date does NOT contain the answer field.
    """
    test_date = date(2026, 8, 14)
    safe_puzzle = get_safe_puzzle_for_date(test_date)

    safe_dict = safe_puzzle.model_dump()
    assert "answer" not in safe_dict
    assert "id" in safe_dict
    assert "clue" in safe_dict
    assert "word_lengths" in safe_dict
    assert len(safe_dict["word_lengths"]) >= 1
