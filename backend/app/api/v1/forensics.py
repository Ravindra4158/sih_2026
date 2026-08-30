from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from uuid import uuid4
from typing import Optional
import shutil
import tempfile
import os
from ...models.response_models import ELAResponse
from ...services.ela_service import analyze_ela_image
from ...utils.common import SessionStore
from ...utils.file_utils import validate_upload, resolve_image_path

router = APIRouter()

@router.post('/forensics/ela-analysis', response_model=ELAResponse)
async def ela_analysis(
    image_file: UploadFile = File(...),
    session_id: Optional[str] = Query(None, description="Optional session ID to link steps"),
    jpeg_quality: int = 90
):
    """Runs Error Level Analysis on an uploaded document image or PDF.
    Saves results to MongoDB SessionStore.
    """
    validate_upload(image_file)

    try:
        suffix = os.path.splitext(image_file.filename)[-1].lower() if image_file.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(image_file.file, tmp)
            tmp_path = tmp.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store upload: {e}")

    image_path = resolve_image_path(tmp_path, image_file.filename or "")
    active_session_id = session_id or f"sess_{uuid4().hex}"

    try:
        result = await analyze_ela_image(image_path, jpeg_quality)
        
        tamper_detected = result.get("tampering_probability", 0) > 0.4
        tamper_score = result.get("tampering_probability", 0) * 100
        
        # Save ELA result to session store
        ela_session_data = {
            "tampering_probability": result.get("tampering_probability", 0),
            "tamper_detected": tamper_detected,
            "tamper_confidence_score": tamper_score,
            "anomaly_regions": result.get("suspicious_regions", []),
            "ela_heatmap_base64": result.get("ela_heatmap_url", ""),
            "flags_raised": result.get("flags_raised", []),
            "image_width": result.get("image_width"),
            "image_height": result.get("image_height")
        }
        await SessionStore.set(active_session_id, "forensics", ela_session_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forensics ELA failed: {str(e)}")
    finally:
        if image_path != tmp_path and os.path.exists(image_path):
            os.unlink(image_path)
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    return ELAResponse(
        session_id=active_session_id,
        tamper_detected=tamper_detected,
        tamper_confidence_score=tamper_score,
        anomaly_regions=result.get("suspicious_regions", []),
        ela_heatmap_base64=result.get("ela_heatmap_url", ""),
        image_width=result.get("image_width"),
        image_height=result.get("image_height")
    )
