from fastapi import APIRouter, HTTPException
from ...models.request_models import BiometricVerifyRequest
from ...models.response_models import BiometricVerifyResponse
from ...services.biometrics_service import verify_match

router = APIRouter()

@router.post('/biometrics/verify-match', response_model=BiometricVerifyResponse)
async def biometrics_verify(payload: BiometricVerifyRequest):
    """Verifies facial match and liveness for a given session.
    Expects base64 images and EAR series.
    """
    try:
        result = await verify_match(
            payload.session_id,
            payload.document_photo_base64,
            payload.live_capture_base64,
            payload.ear_frame_series,
        )
        return BiometricVerifyResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
