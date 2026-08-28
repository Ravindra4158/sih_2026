"""Document upload API."""
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.document import DocumentProcessResponse, DocumentUploadResponse
from app.services.document_processing_service import document_processing_service
from app.services.document_service import document_upload_service
from app.services.verification_history_service import verification_history_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)) -> DocumentUploadResponse:
    """Validate a document upload and return its temporary submission reference."""
    document = await document_upload_service.receive(file)
    return DocumentUploadResponse(document_id=document.document_id, filename=document.filename)


@router.post("/process", response_model=DocumentProcessResponse)
async def process_document(file: UploadFile = File(...)) -> DocumentProcessResponse:
    """Run the current non-authenticity processing pipeline on one document."""
    document = await document_upload_service.stage(file)
    try:
        return document_processing_service.process(document)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    finally:
        document_upload_service.cleanup(document)


@router.get("/{document_id}/report")
async def get_verification_report(document_id: str) -> dict[str, object]:
    """Retrieve a non-official, in-memory verification report for this process."""
    report = verification_history_service.report(document_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification report not found.")
    return report
