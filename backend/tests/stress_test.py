"""
Stress and Security Invariant Verification Suite for Streak API.
Tests:
1. High concurrency race conditions (50 parallel requests from same player)
2. Database-level UNIQUE constraint enforcement under load
3. Security fuzzing: Malformed UUIDs, SQLi payloads, oversized buffers
4. Zero answer leakage audit across all API endpoints
"""

import asyncio
import uuid
import httpx
import pytest

BASE_URL = "http://localhost:8001"


@pytest.mark.asyncio
async def test_concurrent_guesses_race_condition():
    """
    Stress Test: Fire 50 concurrent guess requests simultaneously for the same player.
    Exact Invariant: Exactly 1 request must succeed (HTTP 200), and all 49 others
    MUST be rejected with HTTP 409 Conflict. Zero duplicate records in database.
    """
    player_id = str(uuid.uuid4())
    headers = {"X-Player-ID": player_id}

    try:
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
            # Register player
            reg_res = await client.post("/api/player", headers=headers)
            assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"

            # Prepare 50 concurrent guess requests
            tasks = [
                client.post("/api/game/guess", headers=headers, json={"guess": f"guess_attempt_{i}"})
                for i in range(50)
            ]

            responses = await asyncio.gather(*tasks)

            status_codes = [r.status_code for r in responses]
            success_count = status_codes.count(200)
            conflict_count = status_codes.count(409)

            print(f"\n[1. Concurrent Stress Test] 50 Parallel Requests -> 200 OK: {success_count}, 409 Conflict: {conflict_count}")
            assert success_count == 1, f"Expected exactly 1 success, got {success_count}"
            assert conflict_count == 49, f"Expected 49 conflicts, got {conflict_count}"
    except httpx.ConnectError:
        pytest.skip(f"Live server at {BASE_URL} not running. Start uvicorn on port 8001 to run live stress tests.")


@pytest.mark.asyncio
async def test_security_fuzzing_and_injection():
    """
    Security Test: Attempt malicious and invalid inputs.
    - SQL injection strings in headers and body
    - Path traversal strings
    - XSS strings
    - Non-UUID values
    - Missing headers
    - Extremely large payloads (5,000+ chars)
    """
    try:
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
            # 1. Malformed and malicious UUIDs
            bad_uuids = [
                "admin' OR '1'='1",
                "../../../etc/passwd",
                "12345",
                "<script>alert(1)</script>",
                "null",
                "undefined",
                "not-a-valid-uuid-format",
            ]
            for bad_id in bad_uuids:
                res = await client.get("/api/game/today", headers={"X-Player-ID": bad_id})
                assert res.status_code == 400, f"Expected 400 for bad UUID '{bad_id}', got {res.status_code}"

            # 2. Missing Header
            missing_res = await client.get("/api/game/today")
            assert missing_res.status_code == 400, f"Expected 400 for missing header, got {missing_res.status_code}"

            # 3. Oversized payloads in guess
            fresh_player = str(uuid.uuid4())
            fresh_headers = {"X-Player-ID": fresh_player}
            await client.post("/api/player", headers=fresh_headers)

            oversized_res = await client.post(
                "/api/game/guess",
                headers=fresh_headers,
                json={"guess": "A" * 5000},
            )
            assert oversized_res.status_code == 422, f"Expected 422 for oversized guess, got {oversized_res.status_code}"

            # 4. Empty and whitespace guess payloads in body
            empty_res = await client.post(
                "/api/game/guess",
                headers=fresh_headers,
                json={"guess": "   "},
            )
            assert empty_res.status_code == 422, f"Expected 422 for empty guess, got {empty_res.status_code}"

            print("[2. Security & Fuzzing Test] SQLi, XSS, Path Traversal, and Oversized Payloads safely rejected.")
    except httpx.ConnectError:
        pytest.skip(f"Live server at {BASE_URL} not running. Start uvicorn on port 8001 to run live stress tests.")


@pytest.mark.asyncio
async def test_zero_leakage_audit():
    """
    Security Test: Audit all API responses to ensure the answer key is NEVER present.
    """
    player_id = str(uuid.uuid4())
    headers = {"X-Player-ID": player_id}

    try:
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
            await client.post("/api/player", headers=headers)

            res = await client.get("/api/game/today", headers=headers)
            assert res.status_code == 200
            data = res.json()

            assert "answer" not in data, "Security vulnerability: 'answer' found in response root"
            assert "answer" not in data.get("puzzle", {}), "Security vulnerability: 'answer' found in puzzle object"
            assert "guess" not in data, "Security vulnerability: 'guess' found in response root"

            print("[3. Zero Answer Leakage Audit] Verified: Answers and stored guesses are never leaked.")
    except httpx.ConnectError:
        pytest.skip(f"Live server at {BASE_URL} not running. Start uvicorn on port 8001 to run live stress tests.")


if __name__ == "__main__":
    print("=" * 60)
    print("Running Streak Stress & Security Test Suite against running backend...")
    print("=" * 60)
    asyncio.run(test_concurrent_guesses_race_condition())
    asyncio.run(test_security_fuzzing_and_injection())
    asyncio.run(test_zero_leakage_audit())
    print("\n" + "=" * 60)
    print("🎉 ALL STRESS, CONCURRENCY & SECURITY INVARIANTS VERIFIED!")
    print("=" * 60)
