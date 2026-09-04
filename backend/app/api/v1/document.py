from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from uuid import uuid4
from typing import Optional
import shutil
import tempfile
import logging
import os
from ...models.request_models import ProcessOCRRequest

logger = logging.getLogger(__name__)
from ...models.response_models import (
    ProcessOCRResponse, 
    LayoutValidationResponse, 
    LayoutValidationResult,
    MachineReadableResponse,
    MachineReadableResult
)
from ...services.ocr_service import process_ocr_image
from ...services.layout_validation_service import validate_document_layout
from ...services.barcode_service import extract_barcodes_and_qr
from ...services.aadhaar_qr_service import decode_aadhaar_qr
from ...services.cross_reference_service import cross_reference_document_data
from ...utils.common import SessionStore
from ...utils.file_utils import validate_upload, resolve_image_path

router = APIRouter()

@router.post('/document/process-ocr', response_model=ProcessOCRResponse)
async def process_ocr(
    image_file: UploadFile = File(...),
    session_id: Optional[str] = Query(None, description="Optional session ID to link steps"),
    document_hint: str = "AUTO"
):
    """Accepts a document image or PDF, runs OCR, and returns extracted MRZ / field data.
    Stores the result in the MongoDB SessionStore under the session_id.
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
    
    # Use provided session_id or generate a new one
    active_session_id = session_id or f"sess_{uuid4().hex}"
    
    try:
        result = await process_ocr_image(image_path, document_hint)
        
        # Read image to base64 so document image is stored in MongoDB SessionStore
        try:
            import base64
            with open(image_path, "rb") as img_f:
                b64_img = "data:image/jpeg;base64," + base64.b64encode(img_f.read()).decode("utf-8")
                await SessionStore.set(active_session_id, "document_photo_base64", b64_img)
        except Exception as e_b64:
            logger.warning(f"Failed to convert upload to base64 for MongoDB storage: {e_b64}")

        # Store OCR result in MongoDB sessions collection
        await SessionStore.set(active_session_id, "ocr", result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR execution failed: {str(e)}")
    finally:
        # Clean up temp files
        if image_path != tmp_path and os.path.exists(image_path):
            os.unlink(image_path)
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    return ProcessOCRResponse(**result, session_id=active_session_id)

@router.post('/document/validate-layout', response_model=LayoutValidationResponse)
async def validate_layout(
    image_file: UploadFile = File(...),
    session_id: Optional[str] = Query(None, description="Optional session ID"),
    document_type: str = Query("AUTO", description="Document type hint: AADHAR | PAN | PASSPORT | AUTO")
):
    """Validates the layout of the document (Aadhar, PAN, Passport) using OCR bounding boxes."""
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
        validation_data = await validate_document_layout(image_path, document_type)
        # Convert dictionary response to Pydantic object
        validation_result = LayoutValidationResult(**validation_data)
        
        # Optionally store in session if needed
        await SessionStore.set(active_session_id, "layout_validation", validation_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Layout validation failed: {str(e)}")
    finally:
        # Clean up temp files
        if image_path != tmp_path and os.path.exists(image_path):
            os.unlink(image_path)
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    return LayoutValidationResponse(
        session_id=active_session_id,
        validation_result=validation_result
    )

@router.post('/document/verify-machine-readable', response_model=MachineReadableResponse)
async def verify_machine_readable(
    image_file: UploadFile = File(...),
    session_id: Optional[str] = Query(None, description="Optional session ID")
):
    """
    Scans the document for any Machine Readable Zones (MRZ), Barcodes (e.g., PDF417), and QR Codes.
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
        # Extract Barcodes and QR Codes
        barcodes = extract_barcodes_and_qr(image_path)
        
        # Extract MRZ and OCR fields using existing OCR service
        ocr_result = await process_ocr_image(image_path, "AUTO")
        raw_mrz = ocr_result.get("raw_mrz_text", "")
        
        # Check if any barcode data is Aadhaar QR data
        aadhaar_qr_data = None
        for b in barcodes:
            raw_data = b.get("data", "")
            # Aadhaar Secure QR is typically large integer sequence, Old is XML
            if raw_data.isdigit() or "<PrintLetterBarcodeData" in raw_data:
                res = decode_aadhaar_qr(raw_data)
                aadhaar_qr_data = res
                if res.get("is_valid_aadhaar_qr"):
                    break
                    
        # Cross-reference OCR data with QR data if available
        cross_ref_result = None
        if aadhaar_qr_data and "parsed_fields" in ocr_result:
            cross_ref_result = cross_reference_document_data(
                ocr_result.get("parsed_fields", {}),
                aadhaar_qr_data.get("demographics", {})
            )
        
        result = MachineReadableResult(
            has_mrz=bool(raw_mrz),
            mrz_data=raw_mrz if raw_mrz else None,
            has_barcode=len(barcodes) > 0,
            barcode_data=barcodes,
            aadhaar_qr_data=aadhaar_qr_data,
            cross_reference_result=cross_ref_result
        )
        
        # Store in session
        await SessionStore.set(active_session_id, "machine_readable_verification", result.model_dump())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Machine readable verification failed: {str(e)}")
    finally:
        # Clean up temp files
        if image_path != tmp_path and os.path.exists(image_path):
            os.unlink(image_path)
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    return MachineReadableResponse(
        session_id=active_session_id,
        machine_readable_result=result
    )


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Face Detection in Document Image  (with face crop)
# ---------------------------------------------------------------------------

def _crop_and_encode(img, fx: int, fy: int, fw: int, fh: int, pad_ratio: float = 0.25) -> str:
    """
    Crop a face region from img, add proportional padding, clamp to image bounds,
    and return a JPEG base64 data-URL string.
    """
    import cv2, base64
    h, w = img.shape[:2]
    px = int(fw * pad_ratio)
    py = int(fh * pad_ratio)
    x1 = max(0, fx - px);  y1 = max(0, fy - py)
    x2 = min(w, fx + fw + px); y2 = min(h, fy + fh + py)
    crop = img[y1:y2, x1:x2]
    _, buf = cv2.imencode(".jpg", crop, [cv2.IMWRITE_JPEG_QUALITY, 92])
    b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


@router.post("/document/detect-face")
async def detect_face_in_document(
    image_file: UploadFile = File(...),
    document_hint: str = Query("AUTO", description="AADHAAR | PAN | PASSPORT | DRIVING_LICENCE | AUTO")
):
    """
    Detect the portrait face in an uploaded Indian government ID document image,
    then crop and return the face as a base64 JPEG.

    Returns:
        face_detected       – bool  (True if OpenCV found a face; False if heuristic)
        bounding_box        – { x, y, width, height } in original image pixels
        face_crop_base64    – data:image/jpeg;base64,… JPEG of the cropped face
        image_width / height
        confidence          – 0–1
    """
    import cv2
    import numpy as np

    contents = await image_file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image file.")

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # CLAHE – boosts contrast on low-quality scanned/photographed IDs
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray  = clahe.apply(gray)

    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)

    best_face = None
    best_conf = 0.0

    for scale_factor, min_neighbors, conf in [
        (1.05, 5, 0.90),
        (1.10, 4, 0.80),
        (1.15, 3, 0.70),
        (1.20, 3, 0.65),
        (1.30, 2, 0.55),
    ]:
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=scale_factor,
            minNeighbors=min_neighbors,
            minSize=(int(w * 0.06), int(h * 0.06)),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )
        if len(faces) > 0:
            areas = [fw * fh for (_, _, fw, fh) in faces]
            largest_idx = int(np.argmax(areas))
            fx, fy, fw, fh = [int(v) for v in faces[largest_idx]]
            best_face = (fx, fy, fw, fh)
            best_conf = conf
            break

    if best_face:
        fx, fy, fw, fh = best_face
        crop_b64 = _crop_and_encode(img, fx, fy, fw, fh, pad_ratio=0.20)
        return {
            "face_detected":    True,
            "bounding_box":     {"x": fx, "y": fy, "width": fw, "height": fh},
            "face_crop_base64": crop_b64,
            "image_width":      w,
            "image_height":     h,
            "confidence":       round(best_conf, 2),
        }

    # ── Heuristic fallback for Indian government ID layouts ────────────────
    hint = document_hint.upper()
    if "AADHAAR" in hint:
        fx = int(w * 0.05); fy = int(h * 0.38); fw = int(w * 0.27); fh = int(h * 0.52)
    elif "PAN" in hint:
        fx = int(w * 0.05); fy = int(h * 0.12); fw = int(w * 0.28); fh = int(h * 0.76)
    elif "PASSPORT" in hint:
        fx = int(w * 0.03); fy = int(h * 0.05); fw = int(w * 0.27); fh = int(h * 0.45)
    elif "DRIVING" in hint or hint == "DL":
        fx = int(w * 0.03); fy = int(h * 0.05); fw = int(w * 0.27); fh = int(h * 0.50)
    else:
        fx = int(w * 0.04); fy = int(h * 0.08); fw = int(w * 0.28); fh = int(h * 0.48)

    crop_b64 = _crop_and_encode(img, fx, fy, fw, fh, pad_ratio=0.10)
    return {
        "face_detected":    False,
        "bounding_box":     {"x": fx, "y": fy, "width": fw, "height": fh},
        "face_crop_base64": crop_b64,
        "image_width":      w,
        "image_height":     h,
        "confidence":       0.0,
        "note":             "Auto-detection failed; using document-type heuristic zone.",
    }
