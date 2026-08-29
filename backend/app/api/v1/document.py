from fastapi import APIRouter, UploadFile, File, HTTPException
from uuid import uuid4
import shutil
import tempfile
from ...models.request_models import ProcessOCRRequest
from ...models.response_models import ProcessOCRResponse
from ...services.ocr_service import process_ocr_image
from ...utils.common import SessionStore
router = APIRouter()

@router.post('/document/process-ocr', response_model=ProcessOCRResponse)
async def process_ocr(image_file: UploadFile = File(...), document_hint: str = "AUTO"):
    """Accepts an image, runs OCR, and returns extracted MRZ data.
    The endpoint generates a new session_id for the request.
    """
    # Save uploaded image to a temporary file
    try:
        suffix = f".{image_file.filename.split('.')[-1]}" if '.' in image_file.filename else ''
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(image_file.file, tmp)
            tmp_path = tmp.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store upload: {e}")

    session_id = f"sess_{uuid4().hex}"
    # Call OCR service (to be implemented) – returns dict compatible with ProcessOCRResponse fields
    result = await process_ocr_image(tmp_path, document_hint)

    # In a full implementation, store `result` in a session cache keyed by `session_id`
    return ProcessOCRResponse(**result, session_id=session_id)
