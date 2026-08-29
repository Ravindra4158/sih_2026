from fastapi import APIRouter, UploadFile, File, HTTPException
from uuid import uuid4
import shutil
import tempfile
import os
from ...models.request_models import ProcessOCRRequest
from ...models.response_models import ProcessOCRResponse
from ...services.ocr_service import process_ocr_image
from ...utils.common import SessionStore
from ...utils.file_utils import validate_upload, resolve_image_path

router = APIRouter()

@router.post('/document/process-ocr', response_model=ProcessOCRResponse)
async def process_ocr(image_file: UploadFile = File(...), document_hint: str = "AUTO"):
    """Accepts a document image or PDF, runs OCR, and returns extracted MRZ / field data.
    Supported formats: JPEG (.jpg / .jpeg), PNG (.png), PDF (.pdf).
    The endpoint generates a new session_id for the request.
    """
    # Validate file type (extension + magic bytes) — raises 415 on bad input
    validate_upload(image_file)

    # Save uploaded file to a temporary path (preserve original extension)
    try:
        suffix = os.path.splitext(image_file.filename)[-1].lower() if image_file.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(image_file.file, tmp)
            tmp_path = tmp.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store upload: {e}")

    # Convert PDF → PNG if needed; otherwise returns original path
    image_path = resolve_image_path(tmp_path, image_file.filename or "")

    session_id = f"sess_{uuid4().hex}"
    result = await process_ocr_image(image_path, document_hint)

    # Clean up temp files
    if image_path != tmp_path and os.path.exists(image_path):
        os.unlink(image_path)
    if os.path.exists(tmp_path):
        os.unlink(tmp_path)

    return ProcessOCRResponse(**result, session_id=session_id)
