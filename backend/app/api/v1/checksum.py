from fastapi import APIRouter, HTTPException
from ...models.request_models import ValidateChecksumRequest
from ...models.response_models import ValidateChecksumResponse
from ...services.checksum_service import validate_checksum

router = APIRouter()

@router.post('/document/validate-checksum', response_model=ValidateChecksumResponse)
async def validate_checksum_endpoint(payload: ValidateChecksumRequest):
    """Validates ICAO checksum for the provided MRZ text."""
    try:
        result = await validate_checksum(payload.raw_mrz_text)
        return ValidateChecksumResponse(**result, session_id=payload.session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
