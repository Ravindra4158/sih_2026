"""Document-upload operations independent of API routing."""
from __future__ import annotations

import logging
import shutil
import uuid
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config.settings import settings

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
CHUNK_SIZE = 1024 * 1024


def has_expected_signature(path: Path, content_type: str) -> bool:
    """Perform a lightweight content check before later image/PDF processing."""
    with path.open("rb") as document_file:
        header = document_file.read(8)
    signatures = {
        "application/pdf": lambda value: value.startswith(b"%PDF-"),
        "image/jpeg": lambda value: value.startswith(b"\xff\xd8\xff"),
        "image/png": lambda value: value.startswith(b"\x89PNG\r\n\x1a\n"),
    }
    return signatures[content_type](header)


@dataclass(frozen=True)
class UploadedDocument:
    """Validated, non-sensitive metadata from a completed upload."""

    document_id: str
    filename: str


@dataclass(frozen=True)
class StagedDocument(UploadedDocument):
    """Validated file available only for the duration of a request pipeline."""

    path: Path
    content_type: str


class DocumentUploadService:
    """Validate an incoming file while keeping temporary data short-lived."""

    async def receive(self, upload: UploadFile) -> UploadedDocument:
        staged = await self.stage(upload)
        try:
            return UploadedDocument(document_id=staged.document_id, filename=staged.filename)
        finally:
            self.cleanup(staged)

    async def stage(self, upload: UploadFile) -> StagedDocument:
        filename = Path(upload.filename or "").name
        extension = Path(filename).suffix.lower()
        if not filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A file is required.")
        if extension not in ALLOWED_EXTENSIONS or upload.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only PDF, JPEG, and PNG documents are supported.",
            )

        temp_dir = Path(settings.upload_temp_dir)
        temp_dir.mkdir(parents=True, exist_ok=True)
        temp_path = temp_dir / f"{uuid.uuid4().hex}{extension}"
        total_size = 0

        try:
            with temp_path.open("wb") as temp_file:
                while chunk := await upload.read(CHUNK_SIZE):
                    total_size += len(chunk)
                    if total_size > settings.max_upload_size_bytes:
                        raise HTTPException(
                            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                            detail=f"File exceeds the {settings.max_upload_size_bytes} byte upload limit.",
                        )
                    temp_file.write(chunk)

            if total_size == 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty.")
            if not has_expected_signature(temp_path, upload.content_type):
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="The file content does not match its declared document type.",
                )

            document = StagedDocument(
                document_id=str(uuid.uuid4()),
                filename=filename,
                path=temp_path,
                content_type=upload.content_type,
            )
            logger.info("Document upload validated", extra={"document_id": document.document_id})
            return document
        except HTTPException:
            temp_path.unlink(missing_ok=True)
            raise
        except OSError as exc:
            temp_path.unlink(missing_ok=True)
            logger.exception("Unable to process temporary document upload")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to process the uploaded file.",
            ) from exc
        finally:
            await upload.close()

    @staticmethod
    def cleanup(document: StagedDocument) -> None:
        """Remove a request-scoped temporary upload regardless of pipeline outcome."""
        document.path.unlink(missing_ok=True)


document_upload_service = DocumentUploadService()
