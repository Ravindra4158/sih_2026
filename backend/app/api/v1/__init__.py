"""API version 1 router aggregation."""

from fastapi import APIRouter

from .document import router as document_router
from .forensics import router as forensics_router
from .biometrics import router as biometrics_router
from .screening import router as screening_router
from .checksum import router as checksum_router

router = APIRouter()
router.include_router(document_router)
router.include_router(forensics_router)
router.include_router(biometrics_router)
router.include_router(screening_router)
router.include_router(checksum_router)
