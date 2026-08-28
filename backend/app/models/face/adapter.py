"""Adapter for the locally cloned serengil/deepface repository."""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

REPOSITORY_ROOT = Path(__file__).resolve().parents[4] / "third_party" / "face_model" / "source"


class DeepFaceAdapter:
    """Compare a document portrait with an optional user-supplied selfie."""

    name = "deepface"

    def __init__(self) -> None:
        self._deepface: Any | None = None
        self._load_error: str | None = None

    def load(self) -> None:
        if self._deepface is not None or self._load_error:
            return
        try:
            if str(REPOSITORY_ROOT) not in sys.path:
                sys.path.insert(0, str(REPOSITORY_ROOT))
            from deepface import DeepFace

            self._deepface = DeepFace
        except Exception as exc:
            self._load_error = f"DeepFace unavailable: {exc.__class__.__name__}"

    def health_check(self) -> dict[str, object]:
        self.load()
        return {"status": "ready" if self._deepface else "unavailable", "error": self._load_error}

    def predict(self, document_face_path: str | None, selfie_path: str | None) -> dict[str, object]:
        if not selfie_path:
            return {"model": self.name, "status": "skipped", "reason": "selfie_required"}
        if not document_face_path:
            return {"model": self.name, "status": "skipped", "reason": "document_face_not_available"}
        self.load()
        if not self._deepface:
            return {"model": self.name, "status": "error", "error": self._load_error}
        try:
            result = self._deepface.verify(
                img1_path=document_face_path,
                img2_path=selfie_path,
                model_name="Facenet512",
                detector_backend="opencv",
                enforce_detection=True,
            )
            return {
                "model": self.name,
                "status": "success",
                "prediction": "same_face" if result.get("verified") else "different_face",
                "score": result.get("distance"),
                "score_name": "distance",
                "threshold": result.get("threshold"),
                "score_note": "Lower distance indicates greater embedding similarity; it is not a probability.",
            }
        except Exception as exc:
            return {"model": self.name, "status": "error", "error": f"Face verification failed: {exc.__class__.__name__}"}
