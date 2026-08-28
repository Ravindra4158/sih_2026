"""Complete, failure-tolerant document verification orchestration."""
from __future__ import annotations

import logging
import time
from pathlib import Path

from PIL import Image

from app.models.ela import ElaAdapter
from app.models.face import DeepFaceAdapter
from app.models.mrz_reader import MrzReaderAdapter
from app.risk import RiskEngine, SignalNormalizer
from app.services.document_processing_service import DocumentProcessingService, document_processing_service
from app.services.document_service import StagedDocument
from app.services.verification_history_service import verification_history_service

logger = logging.getLogger(__name__)


class VerificationService:
    """Coordinate existing preprocessing/OCR with isolated model adapters."""

    def __init__(self, processing: DocumentProcessingService | None = None) -> None:
        self.processing = processing or document_processing_service
        self.ela = ElaAdapter()
        self.mrz = MrzReaderAdapter()
        self.face = DeepFaceAdapter()
        self.normalizer = SignalNormalizer()
        self.risk_engine = RiskEngine()

    def verify(self, document: StagedDocument, selfie: StagedDocument | None = None) -> dict[str, object]:
        started = time.perf_counter()
        logger.info("Verification started", extra={"document_id": document.document_id})
        processed = self.processing.process(document)
        page_image = self.processing.preprocessor.preprocess_document(document.path, document.content_type).pages[0].image_bytes
        models: dict[str, dict[str, object]] = {}
        models["python_ela"] = self._run("Python-ELA", self.ela.predict, page_image)
        models["mrz_passport_reader"] = self._run(
            "MRZ Passport Reader", self.mrz.predict, page_image, processed.document_type.name
        )
        face_path: Path | None = None
        try:
            face_image = models["mrz_passport_reader"].pop("_face_image", None)
            if face_image is not None:
                face_path = Path(f"/tmp/ai-border-screening-face-{document.document_id}.png")
                Image.fromarray(face_image[:, :, ::-1]).save(face_path)
            selfie_path = str(selfie.path) if selfie and selfie.content_type.startswith("image/") else None
            models["deepface"] = self._run("DeepFace", self.face.predict, str(face_path) if face_path else None, selfie_path)
        finally:
            if face_path:
                face_path.unlink(missing_ok=True)
        elapsed = round((time.perf_counter() - started) * 1000, 2)
        logger.info("Verification completed", extra={"document_id": document.document_id, "duration_ms": elapsed})
        normalized = self.normalizer.normalize(models, processed.validation, processed.ocr)
        risk, explanations, limitations = self.risk_engine.assess(normalized, processed.document_type.name)
        result = {
            "document_id": document.document_id,
            "status": "completed",
            "processing": {"status": "completed", "duration_ms": elapsed},
            "document_type": processed.document_type.model_dump(),
            "ocr": processed.ocr,
            "extracted_data": processed.extracted_data,
            "models": models,
            "validation": processed.validation,
            "normalized_signals": normalized,
            "risk": risk,
            "explanations": explanations,
            "limitations": limitations,
            "processing_time_ms": elapsed,
        }
        verification_history_service.record(result)
        return result

    def incomplete(self, document: StagedDocument, reason: str) -> dict[str, object]:
        """Return a safe, reportable result when preprocessing or OCR cannot run."""
        normalized = self.normalizer.normalize({}, {}, {"status": "error"})
        risk, explanations, limitations = self.risk_engine.assess(normalized, "pending")
        limitations.append("OCR/preprocessing failed: " + reason)
        result = {"document_id": document.document_id, "status": "completed", "processing": {"status": "incomplete"}, "document_type": {"name": "pending", "confidence": 0.0, "method": "not_available"}, "ocr": {"status": "error"}, "extracted_data": {}, "models": {}, "validation": {}, "normalized_signals": normalized, "risk": risk, "explanations": explanations, "limitations": limitations, "processing_time_ms": None}
        verification_history_service.record(result)
        return result

    @staticmethod
    def _run(label: str, operation, *args) -> dict[str, object]:
        logger.info("Model inference started", extra={"model": label})
        started = time.perf_counter()
        try:
            result = operation(*args)
            duration = round((time.perf_counter() - started) * 1000, 2)
            result["execution_time_ms"] = duration
            logger.info("Model inference completed", extra={"model": label, "status": result.get("status"), "duration_ms": duration})
            return result
        except Exception as exc:
            logger.exception("Model inference failed", extra={"model": label})
            return {"model": label, "status": "error", "error": f"Unexpected adapter error: {exc.__class__.__name__}", "execution_time_ms": round((time.perf_counter() - started) * 1000, 2)}


verification_service = VerificationService()
