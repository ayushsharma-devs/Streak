"""Small, versioned schema migration runner for the application's two tables."""

from sqlalchemy import Engine, inspect, text

from app.db.models import Base
from app.db.session import engine

MIGRATION_ID = "20260814_remove_legacy_identity_and_guess_columns"
LEGACY_ATTEMPT_INDEXES = (
    "ix_attempts_player_id",
    "ix_attempts_puzzle_date",
    "ix_attempts_player_date",
)


def _ensure_migration_table(connection) -> None:
    connection.execute(
        text(
            "CREATE TABLE IF NOT EXISTS schema_migrations "
            "(migration_id VARCHAR(255) PRIMARY KEY)"
        )
    )


def run_migrations(target_engine: Engine = engine) -> None:
    """Apply the cleanup migration once, safely for PostgreSQL and SQLite."""
    with target_engine.begin() as connection:
        if connection.dialect.name == "postgresql":
            connection.execute(text("SELECT pg_advisory_xact_lock(84726104)"))

        _ensure_migration_table(connection)
        applied = connection.execute(
            text("SELECT 1 FROM schema_migrations WHERE migration_id = :migration_id"),
            {"migration_id": MIGRATION_ID},
        ).scalar()
        if applied:
            return

        Base.metadata.create_all(bind=connection)
        inspector = inspect(connection)
        player_columns = {column["name"] for column in inspector.get_columns("players")}
        attempt_columns = {column["name"] for column in inspector.get_columns("attempts")}

        if "username" in player_columns:
            connection.execute(text("ALTER TABLE players DROP COLUMN username"))
        if "guess" in attempt_columns:
            connection.execute(text("ALTER TABLE attempts DROP COLUMN guess"))

        existing_indexes = {
            index["name"] for index in inspect(connection).get_indexes("attempts")
        }
        for index_name in LEGACY_ATTEMPT_INDEXES:
            if index_name in existing_indexes:
                connection.execute(text(f"DROP INDEX {index_name}"))

        connection.execute(
            text("INSERT INTO schema_migrations (migration_id) VALUES (:migration_id)"),
            {"migration_id": MIGRATION_ID},
        )


def verify_migrations(target_engine: Engine = engine) -> None:
    """Fail startup if a production deployment has not run database migrations."""
    with target_engine.connect() as connection:
        if "schema_migrations" not in inspect(connection).get_table_names():
            raise RuntimeError("Database migrations have not been run")
        applied = connection.execute(
            text("SELECT 1 FROM schema_migrations WHERE migration_id = :migration_id"),
            {"migration_id": MIGRATION_ID},
        ).scalar()
        if not applied:
            raise RuntimeError("Database schema is not up to date; run migrations before startup")


if __name__ == "__main__":
    run_migrations()
