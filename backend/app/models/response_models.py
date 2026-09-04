from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class IQAMetrics(BaseModel):
    blur_score: float = Field(..., description="Blur metric for image quality")
    glare_detected: bool = Field(..., description="Whether glare was detected")
    pass_quality_check: bool = Field(..., description="Overall IQA pass/fail flag")

class ProcessOCRResponse(BaseModel):
    session_id: str = Field(..., description="Unique identifier for the processing session")
    document_type: str = Field(..., description="Detected document type, e.g., TD3")
    iqa_metrics: IQAMetrics
    raw_mrz_text: str = Field(..., description="Raw MRZ string extracted from the document")
    parsed_fields: Dict[str, str] = Field(..., description="Dictionary of parsed MRZ fields")
    confidence_scores: Dict[str, float] = Field(..., description="Confidence for OCR components")

class ChecksumDetail(BaseModel):
    calculated: int = Field(...)
    expected: int = Field(...)
    valid: bool = Field(...)

class ValidateChecksumResponse(BaseModel):
    session_id: str = Field(...)
    is_mrz_valid: bool = Field(...)
    checksum_details: Dict[str, ChecksumDetail]
    flags_raised: List[str] = Field(default_factory=list)

class AnomalyRegion(BaseModel):
    region_label: str = Field(...)
    bounding_box: Dict[str, int] = Field(..., description="x, y, width, height")
    error_variance: float = Field(...)

class ELAResponse(BaseModel):
    session_id: str = Field(...)
    tamper_detected: bool = Field(...)
    tamper_confidence_score: float = Field(...)
    # Accept plain dicts (service output) or AnomalyRegion objects
    anomaly_regions: List[Any] = Field(default_factory=list)
    # Optional: None when ELA could not produce a heatmap (e.g. load error)
    ela_heatmap_base64: Optional[str] = Field(None, description="Base64 encoded heatmap image")
    image_width: Optional[int] = Field(None, description="Width of scanned image")
    image_height: Optional[int] = Field(None, description="Height of scanned image")


class TamperingAnalysisResponse(BaseModel):
    """Explainable tampering-screening signals; never an authenticity verdict."""
    session_id: str = Field(...)
    tamper_detected: bool = Field(..., description="ELA threshold signal requiring review")
    tamper_confidence_score: float = Field(..., ge=0, le=100)
    anomaly_regions: List[Any] = Field(default_factory=list)
    ela_heatmap_base64: Optional[str] = Field(None)
    photo_replacement: Dict[str, Any]
    text_manipulation: Dict[str, Any]
    stamp_forgery: Dict[str, Any]
    image_metadata: Dict[str, Any]
    flags_raised: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)

class LivenessCheck(BaseModel):
    is_live: bool = Field(...)
    blink_detected: bool = Field(...)
    minimum_ear: float = Field(...)
    pad_score: float = Field(...)

class BiometricVerifyResponse(BaseModel):
    session_id: str = Field(...)
    face_match_score: float = Field(...)
    verification_status: str = Field(..., description="e.g., MATCH_CONFIRMED, MISMATCH")
    liveness_check: LivenessCheck
    flags_raised: List[str] = Field(default_factory=list)

class ScreeningResponse(BaseModel):
    session_id: str = Field(...)
    timestamp: str = Field(..., description="ISO8601 timestamp of decision")
    overall_risk_score: float = Field(...)
    risk_level: str = Field(...)
    final_action: str = Field(..., description="e.g., APPROVE, REFER_TO_OFFICER")
    summary_flags: List[str] = Field(default_factory=list)
    officer_routing: Optional[Dict[str, str]] = Field(None, description="Routing info for officer handling")

class LayoutValidationResult(BaseModel):
    is_valid: bool = Field(..., description="Whether the document matches expected layout rules")
    document_type: str = Field(..., description="Detected or provided document type")
    confidence_score: float = Field(..., description="Confidence score for layout validation")
    layout_anomalies: List[str] = Field(default_factory=list, description="List of anomalies found in layout")

class LayoutValidationResponse(BaseModel):
    session_id: str = Field(...)
    validation_result: LayoutValidationResult

class CrossReferenceResult(BaseModel):
    is_verified: bool = Field(...)
    overall_match_confidence: float = Field(...)
    flags_raised: List[str] = Field(default_factory=list)
    match_details: Dict[str, Any] = Field(default_factory=dict)

class MachineReadableResult(BaseModel):
    has_mrz: bool = Field(False, description="Whether an MRZ was found")
    mrz_data: Optional[str] = Field(None, description="The raw MRZ string if found")
    has_barcode: bool = Field(False, description="Whether a barcode/QR code was found")
    barcode_data: List[Dict[str, Any]] = Field(default_factory=list, description="List of decoded barcodes and their types")
    aadhaar_qr_data: Optional[Dict[str, Any]] = Field(None, description="Decoded secure Aadhar QR data if present")
    cross_reference_result: Optional[CrossReferenceResult] = Field(None, description="Results of comparing QR data to OCR data")
    
class MachineReadableResponse(BaseModel):
    session_id: str = Field(...)
    machine_readable_result: MachineReadableResult
