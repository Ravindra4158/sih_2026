"""Preserve raw evidence while deriving only technically justified risk signals."""
from __future__ import annotations


class SignalNormalizer:
    """Turn heterogeneous result fields into categorical/limited risk signals.

    ELA mean-error-level and EasyOCR confidence are intentionally *not* mapped to
    risk: neither is calibrated as a probability of fraud. DeepFace's verified
    decision is categorical because it already compares distance to its own
    model-specific threshold.
    """

    def normalize(self, models: dict[str, dict[str, object]], validation: dict[str, object], ocr: dict[str, object]) -> dict[str, list[dict[str, object]]]:
        items: list[dict[str, object]] = []
        for source, result in models.items():
            status = result.get("status")
            if status == "error":
                items.append({"source": source, "kind": "availability", "state": "unavailable", "raw_score": result.get("score"), "normalized_risk": None, "calibrated": False})
            elif source == "deepface" and status == "success":
                state = "face_mismatch" if result.get("prediction") == "different_face" else "face_match"
                items.append({"source": source, "kind": "identity", "state": state, "raw_score": result.get("score"), "normalized_risk": None, "calibrated": False, "interpretation": "DeepFace threshold decision; raw distance retained."})
            elif status == "success":
                items.append({"source": source, "kind": "uncalibrated", "state": "observed", "raw_score": result.get("score"), "normalized_risk": None, "calibrated": False})
            elif status == "skipped":
                items.append({"source": source, "kind": "availability", "state": "not_applicable", "raw_score": None, "normalized_risk": None, "calibrated": False, "reason": result.get("reason")})

        for name, check in validation.items():
            state = check.get("status") if isinstance(check, dict) else "not_available"
            items.append({"source": f"validation.{name}", "kind": "validation", "state": state, "raw_score": None, "normalized_risk": None, "calibrated": False})
        items.append({"source": "ocr", "kind": "ocr", "state": ocr.get("status", "error"), "raw_score": ocr.get("confidence"), "normalized_risk": None, "calibrated": False, "interpretation": "OCR confidence is not converted to risk."})
        return {"signals": items}
