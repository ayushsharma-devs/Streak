import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import relationship

from app.db.session import Base


class Player(Base):
    __tablename__ = "players"

    player_id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    current_streak = Column(Integer, nullable=False, default=0)
    highest_streak = Column(Integer, nullable=False, default=0)
    last_played_date = Column(Date, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        CheckConstraint("current_streak >= 0", name="chk_players_current_streak_non_negative"),
        CheckConstraint("highest_streak >= 0", name="chk_players_highest_streak_non_negative"),
    )

    attempts = relationship(
        "Attempt",
        back_populates="player",
        cascade="all, delete-orphan",
        order_by="desc(Attempt.created_at)",
    )


class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    player_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("players.player_id", ondelete="CASCADE"),
        nullable=False,
    )
    puzzle_id = Column(Integer, nullable=False)
    puzzle_date = Column(Date, nullable=False)
    correct = Column(Boolean, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    player = relationship("Player", back_populates="attempts")

    __table_args__ = (
        UniqueConstraint("player_id", "puzzle_date", name="uq_player_puzzle_date"),
    )
