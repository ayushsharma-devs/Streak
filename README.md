# 🎯 Streak — Daily Riddle Game

**Streak** is a production-quality, minimalist, one-puzzle-per-day riddle guessing game built with FastAPI, PostgreSQL (SQLAlchemy 2.0), Next.js (App Router), TypeScript, and Tailwind CSS.

---

## 📖 Overview

There is exactly one puzzle per calendar day, shared globally across all players.

### Player Flow
1. Open the site.
2. Receive today's riddle and word-length hints.
3. Submit **exactly one guess**.
4. Receive the result instantly (Correct / Incorrect).
5. Build your streak on consecutive correct days.
6. Streak resets to 0 upon an incorrect guess, or restarts at 1 if you return after missing a day.

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (Vercel)                │
│  - App Router, TypeScript, Tailwind CSS                     │
│  - Client-side anonymous UUID stored in localStorage        │
│  - Cold-start awareness with 2.5s status indicator          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP (X-Player-ID Header)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Render)                 │
│  - Timezone-aware date anchor (GAME_TIMEZONE)               │
│  - Deterministic modulo-based puzzle selector               │
│  - Transactional state transitions & streak engine          │
│  - Zero-leakage API response contracts                      │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQLAlchemy 2.0 (Pooler-aware)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database (Supabase)             │
│  - Table: `players` (player_id, streak stats, date)         │
│  - Table: `attempts` (attempt_id, player_id, date, correct) │
│  - Mandatory DB Constraint: UNIQUE(player_id, puzzle_date)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14/15 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.x, Pydantic v2, Pydantic-Settings
- **Database**: PostgreSQL (Supabase / Render) / SQLite for fast local unit testing
- **Testing**: Pytest, Pytest-Asyncio, HTTPX TestClient

---

## 📁 Repository Structure

```
streak/
├── README.md
├── .gitignore
├── .env.example
│
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   ├── app/
        ├──game/
          └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── GameShell.tsx
│   │   ├── PuzzleCard.tsx
│   │   ├── GuessForm.tsx
│   │   ├── ResultCard.tsx
│   │   ├── StreakDisplay.tsx
│   │   ├── LoadingState.tsx
        ├── CountdownTimer.tsx
│   │   └── ErrorState.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── player.ts
│   │   └── types.ts
│   └── public/
│
├── backend/
│   ├── requirements.txt
│   ├── Procfile
│   ├── pytest.ini
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── game.py
│   │   │   └── health.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── session.py
│   │   │   └── models.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── game.py
│   │   │   └── player.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── player_service.py
│   │   │   ├── puzzle_service.py
│   │   │   └── game_service.py
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   └── normalization.py
│   │   └── data/
│   │       └── puzzles.json
│   └── tests/
│       ├── __init__.py
        ├── stress_test.py
│       ├── test_puzzle_service.py
│       ├── test_game_service.py
│       ├── test_validation.py
│       └── test_api.py
│
└── docs/
    └── architecture.md
```

---

## 🗄️ Database Schema

### Table: `players`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `player_id` | `UUID` | `PRIMARY KEY` | Anonymous player identifier |
|`username` | `STRING` | `NULL` | Player username
| `current_streak` | `INTEGER` | `NOT NULL DEFAULT 0, CHECK (>= 0)` | Consecutive daily wins |
| `highest_streak` | `INTEGER` | `NOT NULL DEFAULT 0, CHECK (>= 0)` | All-time highest streak |
| `last_played_date` | `DATE` | `NULL` | Most recent date player submitted a guess |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Registration timestamp |

### Table: `attempts`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Unique attempt ID |
| `player_id` | `UUID` | `NOT NULL REFERENCES players(player_id)` | Player foreign key |
| `puzzle_id` | `INTEGER` | `NOT NULL` | Daily puzzle ID |
| `puzzle_date` | `DATE` | `NOT NULL, INDEX` | Date of the riddle |
| `guess` | `VARCHAR(100)` | `NOT NULL` | Normalized submitted guess |
| `correct` | `BOOLEAN` | `NOT NULL` | Guess accuracy |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Submission timestamp |

**Mandatory Constraint**:
`UNIQUE(player_id, puzzle_date)` prevents duplicate guesses at the database level.

---

## 🔒 Security Model & Architectural Decisions

### 1. Anonymous UUID as Identity (Not Authentication)
- An anonymous UUID is stored in `localStorage` under `streak_player_id`.
- The browser sends this via the `X-Player-ID: <UUID>` header.
- **Why**: The app requires zero user passwords, accounts, or PII. The client is treated as untrusted. Knowing another player's UUID exposes only public counters (streak: 3).

### 2. Zero Answer Leakage
- **Why**: Answers live exclusively on the backend in `backend/app/data/puzzles.json`.
- The frontend `GET /api/game/today` endpoint returns only clue, safe metadata, and word lengths.


### 3. Dual-Layer One-Attempt Enforcement
- **Application Level**: Pre-flight verification in `game_service.py` checks existing attempts and acquires row locks.
- **Database Level**: `UNIQUE(player_id, puzzle_date)` guarantees transactional uniqueness even under concurrent distributed traffic. Uniqueness violations return HTTP 409 Conflict without throwing unhandled 500 errors.

### 4. Deterministic Puzzle Selection
- **Why**: `(game_date - PUZZLE_START_DATE).days % len(puzzles)` produces consistent daily rotation worldwide without mutable global states, crons, or background workers.

### 5. Centralized Game Date Boundary
- **Why**: `get_game_date()` centralizes `GAME_TIMEZONE` resolution in one place, avoiding datetime drift across distributed microservices.

---

## 📊 Streak Calculation Rules

- **First Correct Guess**: `current_streak = 1`
- **Consecutive Correct Guess** (`last_played_date == yesterday`): `current_streak += 1`
- **Missed Day** (`last_played_date < yesterday` or `None`): `current_streak = 1`
- **Wrong Guess**: `current_streak = 0`
- **Highest Streak**: `highest_streak = max(highest_streak, current_streak)` (never decreases)

---

## 🔌 API Endpoints

### 1. Health Check
`GET /api/health`
```json
{ "status": "ok" }
```

### 2. Register Player
`POST /api/player`
- **Header**: `X-Player-ID: <UUID>`
```json
{ "player_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", "created": true }
```

### 3. Get Today's Game State
`GET /api/game/today`
- **Header**: `X-Player-ID: <UUID>`
```json
{
  "date": "2026-08-14",
  "puzzle": {
    "id": 1,
    "clue": "I speak without a mouth and hear without ears...",
    "word_lengths": [4]
  },
  "has_played_today": false,
  "current_streak": 2,
  "highest_streak": 5,
  "result": null
}
```

### 4. Submit Guess
`POST /api/game/guess`
- **Header**: `X-Player-ID: <UUID>`
- **Body**: `{ "guess": "echo" }`
```json
{
  "correct": true,
  "current_streak": 3,
  "highest_streak": 5
}
```
*Returns `HTTP 409 Conflict` if the player has already played today.*

---

## 🚀 Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Configure Environment
Copy `.env.example` to root or create backend/frontend environment files:
```bash
cp .env.example .env
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*Backend runs at `http://localhost:8000`.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:3000`.*

---

## 🧪 Running Backend Tests

Run the full pytest test suite from the repository root:
```bash
cd backend
pytest
```
*Verifies all 14 game rule invariants, input validation, deterministic puzzle selection, streak transitions, and anti-leakage contracts.*

---

## 🌐 Production Deployment

### 1. Database on Supabase
- Create a Supabase project.
- Obtain the connection URI (use Transaction Pooler on port 6543 or Session pooler).
- Tables are automatically created upon FastAPI startup via SQLAlchemy.

### 2. Backend on Render
- Create a **Web Service** on Render connected to your repository.
- Root Directory: `backend`
- Environment: Python 3
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment Variables:
  - `DATABASE_URL`: `<Supabase Connection String>`
  - `FRONTEND_URL`: `https://your-app.vercel.app`
  - `GAME_TIMEZONE`: `IST`
  - `PUZZLE_START_DATE`: `2026-01-01`

### 3. Frontend on Vercel
- Import the repository on Vercel.
- Root Directory: `frontend`
- Framework Preset: Next.js
- Environment Variables:
  - `NEXT_PUBLIC_API_URL`: `https://your-backend.onrender.com`

---

## ⚖️ Known Trade-offs & Deliberate Decisions
1. **No Accounts or Passwords**: Storing player identity as anonymous UUIDs in `localStorage` allows instant friction-free play without onboarding barriers or credential management overhead.
2. **Static JSON Puzzles**: Puzzles are maintained as immutable static JSON on the server rather than in a dynamic DB table. This eliminates unnecessary query latency and ensures deterministic rotation across instances.
3. **Optimistic Rendering with Server Authority**: Frontend tracks state reactively, but all state validation (double-play prevention, guess correctness, streak math) is strictly server-enforced.
