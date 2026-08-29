from pydantic import BaseModel, Field
from typing import Optional, List

class ProcessOCRRequest(BaseModel):
    document_hint: str = Field(..., description="Document type hint: PASSPORT | VISA | NATIONAL_ID | AUTO")

class ValidateChecksumRequest(BaseModel):
    session_id: str = Field(..., description="Identifier returned from OCR processing")
    raw_mrz_text: str = Field(..., description="Raw MRZ string extracted from the document")

class ELAAnalysisRequest(BaseModel):
    jpeg_quality: Optional[int] = Field(90, ge=10, le=100, description="JPEG compression quality for ELA processing")

class BiometricVerifyRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier linking to previous steps")
    document_photo_base64: str = Field(..., description="Base64-encoded document photograph")
    live_capture_base64: str = Field(..., description="Base64-encoded live capture image")
    ear_frame_series: List[float] = Field(..., description="Series of Eye Aspect Ratio values for blink detection")

class ScreeningOrchestrateRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier for the ongoing screening process")
