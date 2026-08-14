from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health_check() -> dict:
    """
    Health check endpoint for Render / monitoring.
    """
    return {"status": "ok"}
