import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.game import router as game_router
from app.api.health import router as health_router
from app.core.config import settings
from app.db.migrations import run_migrations, verify_migrations
from app.db.session import engine

# Configure server-side logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("streak")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    if settings.ENVIRONMENT.lower() == "production":
        verify_migrations(engine)
    else:
        run_migrations(engine)

    logger.info("Database schema verified.")
    yield


app = FastAPI(
    title="Streak API",
    description="One-puzzle-per-day riddle guessing game backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Parse allowed origins from configuration
origins = [origin.strip() for origin in settings.FRONTEND_URL.split(",") if origin.strip()]

# Section 15: CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # Anonymous UUID header auth, no cookies
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "X-Player-ID", "Accept", "Origin"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Returns clean 422 errors for schema validation without leaking internals.
    """
    logger.warning("Validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Invalid request parameters or body format",
            "errors": [
                {"field": ".".join(str(loc) for loc in err["loc"]), "message": err["msg"]}
                for err in exc.errors()
            ],
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catches unhandled exceptions, logs them server-side, and returns a safe generic 500.
    Never exposes stack traces, SQL queries, or secrets.
    """
    logger.error("Unhandled error processing %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal server error occurred. Please try again later."},
    )


# Register API route handlers
app.include_router(health_router)
app.include_router(game_router)
