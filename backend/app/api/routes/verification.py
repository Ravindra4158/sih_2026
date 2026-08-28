"""Complete document verification endpoint."""
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.services.document_service import document_upload_service
from app.services.verification_service import verification_service

router = APIRouter(prefix="/verification", tags=["verification"])


@router.post("/documents/verify", status_code=status.HTTP_200_OK)
async def verify_document(file: UploadFile = File(...), selfie: UploadFile | None = File(default=None)) -> dict[str, object]:
    """Return processing, model, and deterministic-validation signals for one document."""
    document = await document_upload_service.stage(file)
    selfie_document = None
    try:
        if selfie:
            selfie_document = await document_upload_service.stage(selfie)
            if not selfie_document.content_type.startswith("image/"):
                raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Selfie must be a JPEG or PNG image.")
        return verification_service.verify(document, selfie_document)
    except ValueError as exc:
        return verification_service.incomplete(document, str(exc))
    finally:
        document_upload_service.cleanup(document)
        if selfie_document:
            document_upload_service.cleanup(selfie_document)
