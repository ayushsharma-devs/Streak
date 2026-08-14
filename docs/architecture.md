# Streak Architecture Documentation

## 1. System Overview

**Streak** is a minimalist, high-integrity, one-puzzle-per-day riddle guessing game. Every day at midnight UTC, a single shared riddle becomes active for all players globally. Players have exactly one opportunity each calendar day to submit a guess.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Next.js Frontend                              │
│  - Anonymous UUID in localStorage (`X-Player-ID`)                     │
│  - App Router, TypeScript, Tailwind CSS                                │
│  - Cold-start aware loader (2.5s UX notice)                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (X-Player-ID Header)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          FastAPI Backend                               │
│  - Router handlers (Health, Game, Player)                              │
│  - Timezone-aware date anchor (`GAME_TIMEZONE`)                        │
│  - Deterministic puzzle selection service                              │
│  - Guess normalization & pure streak transition engine                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQLAlchemy 2.0 (Pooler-optimized)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                             │
│  - `players` table (player_id, streaks, last_played_date)              │
│  - `attempts` table (id, player_id, puzzle_date, correct, created_at)  │
│  - DB Constraint: `UNIQUE(player_id, puzzle_date)`                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architecture Principles

### 2.1 Anonymous UUID as Identity (Not Authentication)
- Players do not need to register with email/passwords or authenticate via OAuth.
- On first visit, the client generates a cryptographic UUID (`crypto.randomUUID()`) and saves it to `localStorage` under `streak_player_id`.
- The browser attaches `X-Player-ID: <UUID>` to every backend API call.
- **Threat Model**: The client is completely untrusted. The backend validates UUID structure and enforces all game logic authoritatively. Possession of another player's UUID reveals only non-sensitive game counters (current streak, highest streak), and no private data exists in the system.

### 2.2 Server-Authoritative Game State & Zero Answer Leakage
- Puzzle answers are stored **exclusively** on the server in `backend/app/data/puzzles.json`.
- The client-facing endpoint `GET /api/game/today` returns only safe metadata (`id`, `clue`, `word_lengths`), current streak statistics, and whether the player has already played today.
- The `attempts` table stores the player's normalized guess and outcome (`correct: true/false`), but never stores the puzzle's true answer.
- The answer is never delivered in API payloads, error messages, or response bodies.

### 2.3 Deterministic Daily Puzzle Scheduling
- Daily puzzle selection is deterministic, calculated as:
  $$\text{puzzle\_index} = (\text{game\_date} - \text{PUZZLE\_START\_DATE}).\text{days} \pmod N$$
  where $N$ is the total number of puzzles in the catalog.
- Benefits:
  - No background cron jobs, schedulers, or queues required.
  - The entire world observes the exact same puzzle on any given calendar day.
  - The rotation gracefully wraps infinitely without risk of out-of-range indexing.

### 2.4 Centralized Game Date Boundary
- A single centralized function `get_game_date()` determines the current game date using the configured `GAME_TIMEZONE` (default: `UTC`).
- `datetime.now()` is forbidden from being called arbitrarily throughout the codebase, preventing time drift and multi-timezone split-brain states.

---

## 3. State Machine & Streak Transitions

Streak updates are computed as pure mathematical transitions:

| Previous State | Action on Day $T$ | New `current_streak` | New `highest_streak` |
| :--- | :--- | :--- | :--- |
| Any (`last_played_date` is None or $< T - 1$) | Correct Guess | $1$ | $\max(\text{highest}, 1)$ |
| Played on $T - 1$ (`last_played_date` == yesterday) | Correct Guess | $\text{current} + 1$ | $\max(\text{highest}, \text{current} + 1)$ |
| Any | Wrong Guess | $0$ | Unchanged |
| Second guess on same day $T$ | Any Guess | **HTTP 409 Conflict** | Unchanged |

---

## 4. Transactional Integrity & Concurrency

To ensure a player cannot exploit race conditions (e.g. sending parallel requests to submit multiple guesses):
1. **Row-level Lock**: The player record is selected with `FOR UPDATE` where supported.
2. **Pre-flight Check**: The service checks for existing records in `attempts` where `player_id = :id AND puzzle_date = :today`.
3. **Database-Level Constraint**: The `attempts` table enforces `UNIQUE(player_id, puzzle_date)`.
4. **Conflict Handling**: If two requests execute concurrently, the database unique constraint aborts the second transaction with an `IntegrityError`, which FastAPI catches and translates into a clean `409 Conflict` HTTP response.

---

## 5. Cold-Start UX Strategy

When hosted on serverless or scale-to-zero container platforms (such as Render's free tier):
- FastAPI may take several seconds to boot from a cold start.
- Next.js includes a non-intrusive 2.5-second timer in `LoadingState.tsx`.
- If a request is still pending after 2.5s, the UI displays a reassuring message:
  > *"Taking a little longer than usual — the server may be waking up."*
- The request is **not** aborted or timed out; the message purely provides transparency.
