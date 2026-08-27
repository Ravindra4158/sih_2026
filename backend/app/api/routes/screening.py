"""Screening API placeholder."""
from fastapi import APIRouter, status

router = APIRouter(prefix="/screenings", tags=["screenings"])


@router.post("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def create_screening() -> dict[str, str]:
    """Reserve the screening workflow endpoint for a later MVP iteration."""
    return {"detail": "Screening pipeline is not implemented yet."}
