import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.models import Base
from app.db.session import get_db
from app.main import app
from app.services.puzzle_service import get_game_date, get_puzzle_for_date

# Setup isolated SQLite test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_game.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register_player():
    player_id = str(uuid.uuid4())
    headers = {"X-Player-ID": player_id}

    # First call: created = True
    res1 = client.post("/api/player", headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["player_id"] == player_id
    assert data1["created"] is True
    assert data1["username"] is None

    # Second call: created = False
    res2 = client.post("/api/player", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["player_id"] == player_id
    assert data2["created"] is False


def test_update_username():
    player_id = str(uuid.uuid4())
    headers = {"X-Player-ID": player_id}
    client.post("/api/player", headers=headers)

    # Valid update
    res = client.patch(
        "/api/player/username",
        headers=headers,
        json={"username": "RiddleMaster_42"},
    )
    assert res.status_code == 200
    assert res.json()["username"] == "RiddleMaster_42"

    # Verify reflected in get today game state
    state_res = client.get("/api/game/today", headers=headers)
    assert state_res.status_code == 200
    assert state_res.json()["username"] == "RiddleMaster_42"

    # Invalid username (too short)
    res_short = client.patch(
        "/api/player/username",
        headers=headers,
        json={"username": "a"},
    )
    assert res_short.status_code == 422


def test_invariant_11_answer_is_not_present_in_get_today_game_response():
    """
    Invariant 11: answer is not present in GET /api/game/today response
    """
    player_id = str(uuid.uuid4())
    headers = {"X-Player-ID": player_id}
    client.post("/api/player", headers=headers)

    res = client.get("/api/game/today", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "answer" not in data
    assert "answer" not in data["puzzle"]
    assert "id" in data["puzzle"]
    assert "clue" in data["puzzle"]
    assert "word_lengths" in data["puzzle"]


def test_invariant_6_second_guess_same_day_rejected():
    """
    Invariant 6: second guess same day -> rejected (HTTP 409)
    """
    player_id = str(uuid.uuid4())
    headers = {"X-Player-ID": player_id}
    client.post("/api/player", headers=headers)

    today = get_game_date()
    puzzle = get_puzzle_for_date(today)

    # First guess succeeds
    res1 = client.post(
        "/api/game/guess",
        headers=headers,
        json={"guess": puzzle["answer"]},
    )
    assert res1.status_code == 200

    # Second guess on the same day MUST return 409
    res2 = client.post(
        "/api/game/guess",
        headers=headers,
        json={"guess": "second_attempt"},
    )
    assert res2.status_code == 409
    assert "already submitted a guess" in res2.json()["detail"]


def test_invariant_12_and_13_already_played_state_survives_repeated_get_and_hides_guess():
    """
    Invariant 12: stored guess is not exposed by GET /api/game/today
    Invariant 13: already-played state survives repeated GET
    """
    player_id = str(uuid.uuid4())
    headers = {"X-Player-ID": player_id}
    client.post("/api/player", headers=headers)

    # Submit a guess
    client.post(
        "/api/game/guess",
        headers=headers,
        json={"guess": "my_secret_submitted_guess"},
    )

    # First GET after play
    res1 = client.get("/api/game/today", headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["has_played_today"] is True
    assert data1["result"] == {"correct": False}
    # Invariant 12: No raw guess stored/returned
    assert "guess" not in data1
    assert "my_secret_submitted_guess" not in str(data1)
    # Invariant 11: No answer returned
    assert "answer" not in data1

    # Second GET after play (repeated)
    res2 = client.get("/api/game/today", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["has_played_today"] is True
    assert data2["result"] == {"correct": False}
    assert "guess" not in data2


def test_invariant_7_malformed_uuid_rejected():
    """
    Invariant 7: malformed UUID -> rejected (HTTP 400)
    """
    res1 = client.get("/api/game/today", headers={"X-Player-ID": "invalid-uuid-format"})
    assert res1.status_code == 400
    assert "Invalid player UUID" in res1.json()["detail"]

    res2 = client.get("/api/game/today")
    assert res2.status_code == 400
    assert "Missing" in res2.json()["detail"]


def test_invariant_8_empty_guess_rejected():
    """
    Invariant 8: empty guess -> rejected (HTTP 422)
    """
    player_id = str(uuid.uuid4())
    headers = {"X-Player-ID": player_id}
    client.post("/api/player", headers=headers)

    res_empty = client.post("/api/game/guess", headers=headers, json={"guess": ""})
    assert res_empty.status_code == 422

    res_whitespace = client.post("/api/game/guess", headers=headers, json={"guess": "   "})
    assert res_whitespace.status_code == 422


def test_invariant_9_oversized_guess_rejected():
    """
    Invariant 9: oversized guess -> rejected (HTTP 422)
    """
    player_id = str(uuid.uuid4())
    headers = {"X-Player-ID": player_id}
    client.post("/api/player", headers=headers)

    oversized = "a" * 101
    res = client.post("/api/game/guess", headers=headers, json={"guess": oversized})
    assert res.status_code == 422
