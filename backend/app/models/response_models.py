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
