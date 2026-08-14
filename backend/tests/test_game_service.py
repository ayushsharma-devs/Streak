import uuid
from datetime import date, datetime, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.db.models import Attempt, Base, Player
from app.services.game_service import calculate_streak_update


def test_invariant_1_first_correct_guess_starts_streak_at_one():
    """
    Invariant 1: first correct guess -> streak 1
    """
    today = date(2026, 8, 14)
    new_streak, new_highest = calculate_streak_update(
        current_streak=0,
        highest_streak=0,
        last_played_date=None,
        today=today,
        is_correct=True,
    )
    assert new_streak == 1
    assert new_highest == 1


def test_invariant_2_consecutive_correct_guesses_increment_streak():
    """
    Invariant 2: consecutive correct guesses -> streak increments
    """
    today = date(2026, 8, 14)
    yesterday = date(2026, 8, 13)

    new_streak, new_highest = calculate_streak_update(
        current_streak=1,
        highest_streak=1,
        last_played_date=yesterday,
        today=today,
        is_correct=True,
    )
    assert new_streak == 2
    assert new_highest == 2

    # Next consecutive day
    day_after = date(2026, 8, 15)
    new_streak_3, new_highest_3 = calculate_streak_update(
        current_streak=new_streak,
        highest_streak=new_highest,
        last_played_date=today,
        today=day_after,
        is_correct=True,
    )
    assert new_streak_3 == 3
    assert new_highest_3 == 3


def test_invariant_3_missed_day_restarts_streak_at_one():
    """
    Invariant 3: missed day -> streak restarts at 1
    """
    today = date(2026, 8, 14)
    three_days_ago = date(2026, 8, 11)

    new_streak, new_highest = calculate_streak_update(
        current_streak=5,
        highest_streak=10,
        last_played_date=three_days_ago,
        today=today,
        is_correct=True,
    )
    assert new_streak == 1
    assert new_highest == 10  # Highest streak does not decrease


def test_invariant_4_wrong_guess_resets_streak_to_zero():
    """
    Invariant 4: wrong guess -> streak 0
    """
    today = date(2026, 8, 14)
    yesterday = date(2026, 8, 13)

    new_streak, new_highest = calculate_streak_update(
        current_streak=7,
        highest_streak=7,
        last_played_date=yesterday,
        today=today,
        is_correct=False,
    )
    assert new_streak == 0
    assert new_highest == 7


def test_invariant_5_highest_streak_persists():
    """
    Invariant 5: highest streak persists and never decreases
    """
    today = date(2026, 8, 14)
    yesterday = date(2026, 8, 13)

    # Wrong guess does not lower highest streak
    new_streak, new_highest = calculate_streak_update(
        current_streak=4,
        highest_streak=12,
        last_played_date=yesterday,
        today=today,
        is_correct=False,
    )
    assert new_streak == 0
    assert new_highest == 12

    # Subsequent correct guess maintains previous highest
    tomorrow = date(2026, 8, 15)
    new_streak_2, new_highest_2 = calculate_streak_update(
        current_streak=new_streak,
        highest_streak=new_highest,
        last_played_date=today,
        today=tomorrow,
        is_correct=True,
    )
    assert new_streak_2 == 1
    assert new_highest_2 == 12


def test_invariant_14_database_uniqueness_prevents_duplicate_attempts():
    """
    Invariant 14: database uniqueness prevents duplicate attempts for same player & puzzle_date
    """
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()

    player_id = uuid.uuid4()
    player = Player(player_id=player_id, current_streak=0, highest_streak=0)
    db.add(player)
    db.commit()

    puzzle_date = date(2026, 8, 14)

    # First attempt succeeds
    attempt1 = Attempt(
        id=uuid.uuid4(),
        player_id=player_id,
        puzzle_id=1,
        puzzle_date=puzzle_date,
        correct=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(attempt1)
    db.commit()

    # Second attempt with same player_id and puzzle_date MUST violate unique constraint
    attempt2 = Attempt(
        id=uuid.uuid4(),
        player_id=player_id,
        puzzle_id=1,
        puzzle_date=puzzle_date,
        correct=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(attempt2)
    with pytest.raises(IntegrityError):
        db.commit()

    db.rollback()
    db.close()
