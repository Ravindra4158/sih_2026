from fastapi import APIRouter, UploadFile, File, HTTPException
from uuid import uuid4
import shutil
import tempfile
from ...models.response_models import ELAResponse
from ...services.ela_service import analyze_ela_image

router = APIRouter()

@router.post('/forensics/ela-analysis', response_model=ELAResponse)
async def ela_analysis(image_file: UploadFile = File(...), jpeg_quality: int = 90):
    """Runs Error Level Analysis on the uploaded document image.
    Returns tampering detection results.
    """
    try:
        suffix = f".{image_file.filename.split('.')[-1]}" if '.' in image_file.filename else ''
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(image_file.file, tmp)
            tmp_path = tmp.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store upload: {e}")

    session_id = f"sess_{uuid4().hex}"
    result = await analyze_ela_image(tmp_path, jpeg_quality)
    return ELAResponse(**result, session_id=session_id)
