from fastapi import APIRouter, UploadFile, File, HTTPException
from uuid import uuid4
import shutil
import tempfile
import os
from ...models.response_models import ELAResponse
from ...services.ela_service import analyze_ela_image
from ...utils.file_utils import validate_upload, resolve_image_path

router = APIRouter()

@router.post('/forensics/ela-analysis', response_model=ELAResponse)
async def ela_analysis(image_file: UploadFile = File(...), jpeg_quality: int = 90):
    """Runs Error Level Analysis on an uploaded document image or PDF.
    Supported formats: JPEG (.jpg / .jpeg), PNG (.png), PDF (.pdf).
    Returns tampering detection results.
    """
    # Validate file type (extension + magic bytes) — raises 415 on bad input
    validate_upload(image_file)

    # Save uploaded file to a temporary path
    try:
        suffix = os.path.splitext(image_file.filename)[-1].lower() if image_file.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(image_file.file, tmp)
            tmp_path = tmp.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store upload: {e}")

    # Convert PDF → PNG if needed; otherwise returns original path
    image_path = resolve_image_path(tmp_path, image_file.filename or "")

    try:
        result = await analyze_ela_image(image_path, jpeg_quality)
    finally:
        # Clean up temp files regardless of success/failure
        if image_path != tmp_path and os.path.exists(image_path):
            os.unlink(image_path)
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    tamper_detected = result.get("tampering_probability", 0) > 0.4
    tamper_score = result.get("tampering_probability", 0) * 100

    return ELAResponse(
        session_id=f"sess_{uuid4().hex}",
        tamper_detected=tamper_detected,
        tamper_confidence_score=tamper_score,
        anomaly_regions=result.get("suspicious_regions", []),
        ela_heatmap_base64=result.get("ela_heatmap_url", "")
    )
