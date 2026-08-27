"""Request-scoped orchestration of preprocessing, OCR, extraction, and validation."""
from __future__ import annotations

import logging

from app.modules.document_classifier import RuleBasedDocumentClassifier
from app.modules.ocr.field_extractor import DocumentFieldExtractor
from app.modules.ocr.image_preprocessor import DocumentPreprocessor
from app.modules.ocr.ocr_engine import OcrEngine, TesseractOcrEngine
from app.modules.validation.document_validator import DocumentValidator
from app.schemas.document import DocumentProcessResponse, DocumentTypeResponse
from app.services.document_service import StagedDocument

logger = logging.getLogger(__name__)


class DocumentProcessingService:
    """Keep pipeline stages independent while exposing one application operation."""

    def __init__(
        self,
        preprocessor: DocumentPreprocessor | None = None,
        ocr_engine: OcrEngine | None = None,
        classifier: RuleBasedDocumentClassifier | None = None,
        extractor: DocumentFieldExtractor | None = None,
        validator: DocumentValidator | None = None,
    ) -> None:
        self.preprocessor = preprocessor or DocumentPreprocessor()
        self.ocr_engine = ocr_engine or TesseractOcrEngine()
        self.classifier = classifier or RuleBasedDocumentClassifier()
        self.extractor = extractor or DocumentFieldExtractor()
        self.validator = validator or DocumentValidator()

    def process(self, document: StagedDocument) -> DocumentProcessResponse:
        try:
            processed = self.preprocessor.preprocess_document(document.path, document.content_type)
            ocr_result = self.ocr_engine.extract_text(processed)
        except (OSError, RuntimeError, ValueError) as exc:
            logger.info("Document processing failed", extra={"document_id": document.document_id})
            raise ValueError("The document could not be preprocessed or read by OCR.") from exc

        classification = self.classifier.classify(ocr_result.text, document.filename)
        extracted = self.extractor.extract(classification.name, ocr_result.text)
        validation = self.validator.validate(classification.name, extracted)
        page_confidences = [page.confidence for page in ocr_result.pages if page.confidence is not None]
        return DocumentProcessResponse(
            document_id=document.document_id,
            filename=document.filename,
            document_type=DocumentTypeResponse(**classification.__dict__),
            pages=len(processed.pages),
            ocr={
                "status": "success",
                "pages": [{"page": page.page_number, "text": page.text, "confidence": page.confidence} for page in ocr_result.pages],
                "confidence": sum(page_confidences) / len(page_confidences) if page_confidences else None,
                "field_confidence_note": "Field-level confidence is unavailable for regex-derived values.",
            },
            extracted_data=extracted,
            validation=validation,
        )


document_processing_service = DocumentProcessingService()
