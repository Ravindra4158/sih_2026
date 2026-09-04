"""
case_models.py – Pydantic schemas for screening case documents stored in MongoDB.
"""
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Sub-models (nested inside a Case document)
# ---------------------------------------------------------------------------

class IQAData(BaseModel):
    blurScore: float = 0.0
    glareDetected: bool = False
    passQualityCheck: bool = True


class OCRData(BaseModel):
    rawText: str = ""
    parsedFields: Dict[str, str] = Field(default_factory=dict)
    confidenceScores: Dict[str, float] = Field(default_factory=dict)


class ForensicsData(BaseModel):
    tamperDetected: bool = False
    tamperConfidenceScore: float = 0.0
    anomalyRegions: List[Any] = Field(default_factory=list)
    elaHeatmapBase64: Optional[str] = None
    elaFlags: List[str] = Field(default_factory=list)
    imageWidth: Optional[int] = None
    imageHeight: Optional[int] = None


class LivenessData(BaseModel):
    isLive: bool = True
    blinkDetected: bool = True
    minimumEar: float = 0.2
    padScore: float = 0.9


class BiometricsData(BaseModel):
    faceMatchScore: float = 0.0
    verificationStatus: str = "PENDING"
    livenessCheck: LivenessData = Field(default_factory=LivenessData)
    earFrameSeries: List[float] = Field(default_factory=list)


class CaseDetails(BaseModel):
    dob: str = ""
    nationality: str = "Indian"
    gender: str = ""
    issueDate: str = ""
    expiryDate: str = "N/A"


# ---------------------------------------------------------------------------
# Main Case document
# ---------------------------------------------------------------------------

class CaseDocument(BaseModel):
    id: str = Field(..., description="Unique case ID, e.g. BR-2026-12345")
    date: str = ""
    name: str = ""
    docType: str = ""
    docNo: str = ""
    riskLevel: str = "Low"        # Low | Medium | High
    status: str = "Pending"       # Pending | Approved | Rejected
    officer: str = "Rajesh K."
    reviewNotes: str = ""
    details: CaseDetails = Field(default_factory=CaseDetails)
    iqa: IQAData = Field(default_factory=IQAData)
    ocr: OCRData = Field(default_factory=OCRData)
    forensics: ForensicsData = Field(default_factory=ForensicsData)
    biometrics: BiometricsData = Field(default_factory=BiometricsData)
    warnings: List[str] = Field(default_factory=list)
    documentImageBase64: Optional[str] = None
    livePhotoBase64: Optional[str] = None


# ---------------------------------------------------------------------------
# Request / Response wrappers
# ---------------------------------------------------------------------------

class SaveCaseRequest(CaseDocument):
    """Body for POST /cases — full case document."""
    pass


class UpdateCaseRequest(BaseModel):
    """Body for PATCH /cases/{case_id}."""
    status: Optional[str] = None
    reviewNotes: Optional[str] = None
    riskLevel: Optional[str] = None
