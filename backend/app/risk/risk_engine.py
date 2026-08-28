"""Transparent prototype risk scoring and controlled result overrides."""
from __future__ import annotations

from app.config.risk_config import RiskConfig, risk_config


class RiskEngine:
    """Score only documented prototype signals; never infer authenticity."""

    def __init__(self, config: RiskConfig | None = None) -> None:
        self.config = config or risk_config

    def assess(self, normalized: dict[str, list[dict[str, object]]], document_type: str) -> tuple[dict[str, object], list[dict[str, str]], list[str]]:
        signals = normalized["signals"]
        explanations: list[dict[str, str]] = []
        limitations = ["Automated screening result; not a legal or government authenticity determination.", "Prototype thresholds are not regulatory standards and are not calibrated to an operational dataset."]
        unavailable = [signal["source"] for signal in signals if signal["state"] == "unavailable"]
        validation_failures = [signal for signal in signals if signal["kind"] == "validation" and signal["state"] == "failed" and signal["source"] != "validation.required_fields"]
        expired = any(signal["source"] in {"validation.expiry_date", "validation.validity"} and signal["state"] == "failed" for signal in signals)
        ocr_failed = any(signal["source"] == "ocr" and signal["state"] != "success" for signal in signals)
        face_mismatch = any(signal["state"] == "face_mismatch" for signal in signals)

        score = min(len(validation_failures) * self.config.validation_failure_points, self.config.validation_failure_cap)
        if validation_failures:
            explanations.append({"severity": "MEDIUM", "source": "validation", "message": f"{len(validation_failures)} document validation check(s) failed."})
        if face_mismatch:
            score += self.config.face_mismatch_points
            explanations.append({"severity": "HIGH", "source": "deepface", "message": "Face verification did not meet DeepFace's model-specific match threshold."})
        if expired:
            return ({"score": score, "level": self._level(score), "decision": "EXPIRED", "override": True, "override_reason": "Document expiry/validity check failed."}, explanations + [{"severity": "HIGH", "source": "validation", "message": "Document appears expired based on OCR-extracted date."}], limitations)
        if unavailable or ocr_failed:
            reason = "Verification incomplete because " + (", ".join(unavailable) if unavailable else "OCR was unavailable") + " was unavailable."
            limitations.append(reason)
            return ({"score": score, "level": self._level(score), "decision": "VERIFICATION_INCOMPLETE", "override": True, "override_reason": reason}, explanations, limitations)
        if document_type == "unknown":
            return ({"score": score, "level": self._level(score), "decision": "UNSUPPORTED_DOCUMENT", "override": True, "override_reason": "Document type could not be identified."}, explanations, limitations)
        decision = "SUSPICIOUS" if score else "PASS"
        return ({"score": score, "level": self._level(score), "decision": decision, "override": False, "override_reason": None}, explanations, limitations)

    def _level(self, score: int) -> str:
        if score <= self.config.low_max:
            return "LOW"
        if score <= self.config.medium_max:
            return "MEDIUM"
        return "HIGH"
