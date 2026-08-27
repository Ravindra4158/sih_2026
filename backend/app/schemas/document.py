"""Document schema placeholder."""
from typing import Any

from pydantic import BaseModel, Field


class DocumentReference(BaseModel):
    """Non-sensitive identifier for a submitted document."""
    document_id: str


class DocumentUploadResponse(DocumentReference):
    """Response returned after a document passes upload validation."""

    filename: str
    status: str = "uploaded"


class DocumentTypeResponse(BaseModel):
    name: str
    confidence: float = Field(ge=0, le=1)
    method: str


class DocumentProcessResponse(DocumentReference):
    """Output of the upload-to-OCR pipeline, not an authenticity decision."""

    document_type: DocumentTypeResponse
    pages: int
    ocr: dict[str, Any]
    extracted_data: dict[str, Any]
    validation: dict[str, Any]
