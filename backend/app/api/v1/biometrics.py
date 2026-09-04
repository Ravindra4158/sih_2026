from fastapi import APIRouter, HTTPException
from ...models.request_models import BiometricVerifyRequest, VerifyFaceByIdRequest
from ...models.response_models import BiometricVerifyResponse
from ...services.biometrics_service import verify_match
from ...utils.common import SessionStore
from ...database.mongodb import get_db

router = APIRouter()

@router.post('/biometrics/verify-match', response_model=BiometricVerifyResponse)
async def biometrics_verify(payload: BiometricVerifyRequest):
    """Verifies facial match and liveness for a given session.
    Saves results to MongoDB SessionStore.
    """
    try:
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


@router.post('/biometrics/verify-by-id', response_model=BiometricVerifyResponse)
async def verify_face_by_id(payload: VerifyFaceByIdRequest):
    """
    Takes an ID (Case ID or Session ID) as input:
    1. Looks up the document photo from MongoDB (cases collection or session store).
    2. Takes the live photo captured with camera.
    3. Runs the configured biometric verification mode.
    4. Automatically updates the case/session in MongoDB with the verification result.
    """
    lookup_id = payload.id.strip()
    db = get_db()
    
    # 1. Search in cases collection first
    document_photo_b64 = None
    case_doc = await db["cases"].find_one({"id": lookup_id})
    if case_doc:
        document_photo_b64 = case_doc.get("documentImageBase64")
        # If not explicitly in documentImageBase64, check details or forensics preview
        if not document_photo_b64:
            document_photo_b64 = case_doc.get("forensics", {}).get("elaHeatmapBase64")

    # 2. If not found in cases, check SessionStore
    if not document_photo_b64:
        session_data = await SessionStore.get_all(lookup_id)
        if session_data:
            document_photo_b64 = session_data.get("document_photo_base64")
            if not document_photo_b64 and "ocr" in session_data:
                document_photo_b64 = session_data["ocr"].get("document_photo_base64")

    if not document_photo_b64:
        raise HTTPException(
            status_code=404,
            detail=f"No document image found for ID '{lookup_id}'. Make sure the document was uploaded for this case/session."
        )

    # 3. Match against live camera photo using the configured verification mode
    try:
        result = await verify_match(
            session_id=lookup_id,
            document_photo_base64=document_photo_b64,
            live_capture_base64=payload.live_capture_base64,
            ear_frame_series=payload.ear_frame_series or [],
        )

        # 4. Save results to SessionStore
        await SessionStore.set(lookup_id, "biometrics", result)

        # 5. If it's an existing case in MongoDB, update the case document biometrics
        if case_doc:
            await db["cases"].update_one(
                {"id": lookup_id},
                {
                    "$set": {
                        "livePhotoBase64": payload.live_capture_base64,
                        "biometrics.faceMatchScore": result["face_match_score"],
                        "biometrics.verificationStatus": result["verification_status"],
                        "biometrics.livenessCheck.isLive": result["liveness_check"]["is_live"],
                        "biometrics.livenessCheck.blinkDetected": result["liveness_check"]["blink_detected"],
                        "biometrics.livenessCheck.minimumEar": result["liveness_check"]["minimum_ear"],
                        "biometrics.livenessCheck.padScore": result["liveness_check"]["pad_score"],
                    }
                }
            )

        return BiometricVerifyResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face verification failed: {str(e)}")

