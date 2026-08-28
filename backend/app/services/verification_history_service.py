"""Minimal in-memory metadata history. Original documents and OCR fields are excluded."""
from __future__ import annotations

from datetime import datetime, timezone


class VerificationHistoryService:
    def __init__(self) -> None:
        self._records: dict[str, dict[str, object]] = {}

    def record(self, result: dict[str, object]) -> None:
        risk = result["risk"]
        timestamp = datetime.now(timezone.utc).isoformat()
        # Keep only reportable metadata: never persist upload bytes, OCR text, or extracted identity fields.
        report = {"document_id": result["document_id"], "timestamp": timestamp, "document_type": result["document_type"], "processing": result["processing"], "ocr": {"status": result["ocr"].get("status")}, "models": result["models"], "validation": result["validation"], "risk": risk, "explanations": result["explanations"], "limitations": result["limitations"], "report_notice": "Automated screening report; not an official verification certificate."}
        self._records[str(result["document_id"])] = {"document_id": result["document_id"], "timestamp": timestamp, "document_type": result["document_type"], "risk_level": risk["level"], "risk_score": risk["score"], "decision": risk["decision"], "processing_status": result["processing"]["status"], "report": report}

    def report(self, document_id: str) -> dict[str, object] | None:
        return self._records.get(document_id, {}).get("report")


verification_history_service = VerificationHistoryService()
