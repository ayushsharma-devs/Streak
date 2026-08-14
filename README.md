# Streak

Streak is a one-riddle-per-UTC-day game built with FastAPI, PostgreSQL, Next.js, TypeScript, and Tailwind CSS. A browser receives one persistent anonymous UUID and may submit one guess per UTC calendar day.

## Architecture

- The browser creates a cryptographic UUID once and persists it in `localStorage` as `streak_player_id`. If storage is unavailable, the app stops and explains that persistent storage is required; it never uses a disposable fallback identity.
- The client sends that UUID in `X-Player-ID`. It is an identifier, not authentication, and contains no personal data.
- The backend chooses the daily puzzle deterministically from the UTC date. Puzzle answers remain server-side.
- PostgreSQL enforces one attempt per player and UTC date with `UNIQUE(player_id, puzzle_date)`. Guess text is evaluated transiently and is not stored.
- `SELECT ... FOR UPDATE` locks a player's row on PostgreSQL while a guess is processed. The unique constraint is still the final concurrency guarantee.

See [the architecture document](docs/architecture.md) for operational detail.

## Local development

Requirements: Python 3.10+, Node.js 18+, and npm.

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m app.db.migrations
uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

Copy `.env.example` to `.env` and adjust it when needed. Development defaults to SQLite if `DATABASE_URL` is omitted; production never does.

## Tests

Normal tests are self-contained and do not need a running server:

```bash
cd backend && pytest
cd frontend && npm test && npm run build
```

Live stress tests are deliberately separate from normal pytest discovery because they require a running backend and exercise real HTTP concurrency:

```bash
cd backend
pytest stress_test.py
```

## Production deployment checklist

- [ ] Set `ENVIRONMENT=production`.
- [ ] Set a non-empty PostgreSQL `DATABASE_URL` using the psycopg v3 `postgresql://` scheme and TLS where your provider requires it.
- [ ] Set `GAME_TIMEZONE=UTC`, `PUZZLE_START_DATE`, and an exact `FRONTEND_URL` origin.
- [ ] Run `python -m app.db.migrations` once per release before starting application instances.
- [ ] Start the API only after migrations succeed, for example: `python -m app.db.migrations && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- [ ] Set `NEXT_PUBLIC_API_URL` to the deployed API origin and build the frontend.
- [ ] Verify `/api/health`, a new anonymous registration, and a second same-day guess returning HTTP 409.
- [ ] Run the separate live stress suite against a staging PostgreSQL deployment before production rollout.

Production startup verifies the migration version and fails closed when it is missing or stale.
