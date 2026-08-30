from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from uuid import uuid4
from typing import Optional
import shutil
import tempfile
import os
from ...models.request_models import ProcessOCRRequest
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
        # Store in MongoDB sessions collection
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

