from fastapi import APIRouter, HTTPException
from ...models.request_models import ValidateChecksumRequest
from ...models.response_models import ValidateChecksumResponse
from ...services.checksum_service import validate_checksum
from ...utils.common import SessionStore

router = APIRouter()

@router.post('/document/validate-checksum', response_model=ValidateChecksumResponse)
async def validate_checksum_endpoint(payload: ValidateChecksumRequest):
    """Validates ICAO checksum for the provided MRZ text, saving check digits to MongoDB SessionStore."""
    try:
        result = await validate_checksum(payload.raw_mrz_text)
        
        # Save checksum result to session store
        await SessionStore.set(payload.session_id, "checksum", {
            "is_mrz_valid": result.get("is_mrz_valid", False),
            "checksum_details": result.get("checksum_details", {}),
            "flags_raised": result.get("flags_raised", [])
        })
        
        return ValidateChecksumResponse(**result, session_id=payload.session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
