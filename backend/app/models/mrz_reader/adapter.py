"""Adapter for the locally cloned SerdarHelli MRZ Passport Reader."""
from __future__ import annotations

import sys
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image

REPOSITORY_ROOT = Path(__file__).resolve().parents[4] / "third_party" / "mrz_model" / "source"


class MrzReaderAdapter:
    """Run MRZ segmentation/EasyOCR only for passport images."""

    name = "mrz_passport_reader"

    def __init__(self) -> None:
        self._reader: Any | None = None
        self._load_error: str | None = None

    def load(self) -> None:
        if self._reader is not None or self._load_error:
            return
        try:
            if str(REPOSITORY_ROOT) not in sys.path:
                sys.path.insert(0, str(REPOSITORY_ROOT))
            from mrz_reader.reader import MRZReader

            weights = REPOSITORY_ROOT / "weights"
            self._reader = MRZReader(
                easy_ocr_params={"lang_list": ["en"], "gpu": False},
                facedetection_protxt=str(weights / "face_detector" / "deploy.prototxt"),
                facedetection_caffemodel=str(weights / "face_detector" / "res10_300x300_ssd_iter_140000.caffemodel"),
                segmentation_model=str(weights / "mrz_detector" / "mrz_seg.tflite"),
            )
        except Exception as exc:  # Optional heavy ML runtime is allowed to be unavailable.
            self._load_error = f"MRZ model unavailable: {exc.__class__.__name__}"

    def health_check(self) -> dict[str, object]:
        self.load()
        return {"status": "ready" if self._reader else "unavailable", "error": self._load_error}

    def predict(self, image_bytes: bytes | None, document_type: str) -> dict[str, object]:
        if document_type != "passport":
            return {"model": self.name, "status": "skipped", "reason": "passport_required"}
        if not image_bytes:
            return {"model": self.name, "status": "skipped", "reason": "no_image_page"}
        self.load()
        if not self._reader:
            return {"model": self.name, "status": "error", "error": self._load_error}
        try:
            import numpy as np

            image = np.asarray(Image.open(BytesIO(image_bytes)).convert("RGB"))[:, :, ::-1].copy()
            text_results, _segmented, face = self._reader.predict(image, do_facedetect=True, preprocess_config={})
            confidences = [float(item[2]) for item in text_results if len(item) >= 3]
            return {
                "model": self.name,
                "status": "success",
                "prediction": "mrz_detected" if text_results else "mrz_not_detected",
                "score": sum(confidences) / len(confidences) if confidences else None,
                "score_note": "Mean EasyOCR recognition confidence, not passport authenticity confidence.",
                "face_detected": face is not None,
                "_face_image": face,
            }
        except Exception as exc:
            return {"model": self.name, "status": "error", "error": f"MRZ inference failed: {exc.__class__.__name__}"}
