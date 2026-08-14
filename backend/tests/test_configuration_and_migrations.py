import uuid

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings
from app.db.migrations import MIGRATION_ID, run_migrations
from app.db.models import Player
from app.services import player_service


def test_production_requires_database_url():
    with pytest.raises(ValidationError, match="DATABASE_URL is required"):
        Settings(ENVIRONMENT="production", DATABASE_URL=None, _env_file=None)


def test_development_defaults_to_local_sqlite_database():
    settings = Settings(ENVIRONMENT="development", DATABASE_URL=None, _env_file=None)
    assert settings.DATABASE_URL == "sqlite:///./streak.db"


def test_production_requires_utc_game_boundary():
    with pytest.raises(ValidationError, match="GAME_TIMEZONE must be UTC"):
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://example.invalid/streak",
            GAME_TIMEZONE="Asia/Kolkata",
            _env_file=None,
        )


def test_legacy_columns_and_redundant_indexes_are_migrated_away():
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE players (player_id CHAR(32) PRIMARY KEY, username VARCHAR(30))"))
        connection.execute(text("CREATE TABLE attempts (id CHAR(32) PRIMARY KEY, player_id CHAR(32), puzzle_id INTEGER, puzzle_date DATE, guess VARCHAR(100), correct BOOLEAN, created_at DATETIME)"))
        connection.execute(text("CREATE INDEX ix_attempts_player_id ON attempts (player_id)"))
        connection.execute(text("CREATE INDEX ix_attempts_puzzle_date ON attempts (puzzle_date)"))
        connection.execute(text("CREATE INDEX ix_attempts_player_date ON attempts (player_id, puzzle_date)"))

    run_migrations(engine)
    inspector = inspect(engine)
    assert "username" not in {column["name"] for column in inspector.get_columns("players")}
    assert "guess" not in {column["name"] for column in inspector.get_columns("attempts")}
    assert not ({index["name"] for index in inspector.get_indexes("attempts")} & {
        "ix_attempts_player_id", "ix_attempts_puzzle_date", "ix_attempts_player_date"
    })
    with engine.connect() as connection:
        assert connection.execute(text("SELECT migration_id FROM schema_migrations")).scalar() == MIGRATION_ID


def test_player_creation_recovers_after_concurrent_insert(monkeypatch):
    engine = create_engine("sqlite:///:memory:")
    Player.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    player_id = uuid.uuid4()
    existing = Player(player_id=player_id)
    calls = 0

    def concurrent_lookup(_db, _player_id):
        nonlocal calls
        calls += 1
        return None if calls == 1 else existing

    monkeypatch.setattr(player_service, "get_player", concurrent_lookup)
    monkeypatch.setattr(session, "commit", lambda: (_ for _ in ()).throw(IntegrityError("insert", {}, Exception())))
    monkeypatch.setattr(session, "rollback", lambda: None)

    player, created = player_service.get_or_create_player(session, player_id)
    assert player is existing
    assert created is False


def test_guess_lock_compiles_to_postgres_for_update():
    statement = select(Player).where(Player.player_id == uuid.uuid4()).with_for_update()
    assert "FOR UPDATE" in str(statement.compile(dialect=postgresql.dialect()))
