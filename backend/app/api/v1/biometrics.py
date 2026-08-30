from fastapi import APIRouter, HTTPException
from ...models.request_models import BiometricVerifyRequest
from ...models.response_models import BiometricVerifyResponse
from ...services.biometrics_service import verify_match
from ...utils.common import SessionStore

router = APIRouter()

@router.post('/biometrics/verify-match', response_model=BiometricVerifyResponse)
async def biometrics_verify(payload: BiometricVerifyRequest):
    """Verifies facial match and liveness for a given session.
    Saves results to MongoDB SessionStore.
    """
    try:
        # Call the corrected signature verify_match
        result = await verify_match(
            session_id=payload.session_id,
            document_photo_base64=payload.document_photo_base64,
            live_capture_base64=payload.live_capture_base64,
            ear_frame_series=payload.ear_frame_series,
        )
        
        # Save biometrics result to session store
        await SessionStore.set(payload.session_id, "biometrics", result)
        
        return BiometricVerifyResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
