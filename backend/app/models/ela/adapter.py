"""Adapter for the locally cloned killerzman/Python-ELA repository."""
from __future__ import annotations

from io import BytesIO

from PIL import Image, ImageChops, ImageEnhance, ImageStat


class ElaAdapter:
    """Produce Python-ELA's JPEG recompression difference signal.

    Python-ELA is an ELA visualisation tool, not a classifier.  Consequently this
    adapter deliberately returns no confidence or authenticity score.
    """

    name = "python_ela"

    def load(self) -> None:
        """The implementation uses the application's installed Pillow/NumPy."""

    def health_check(self) -> dict[str, object]:
        return {"status": "ready", "repository": "killerzman/Python-ELA"}

    def predict(self, image_bytes: bytes | None) -> dict[str, object]:
        if not image_bytes:
            return {"model": self.name, "status": "skipped", "reason": "no_image_page"}
        original = Image.open(BytesIO(image_bytes)).convert("RGB")
        buffer = BytesIO()
        original.save(buffer, "JPEG", quality=90)
        recompressed = Image.open(BytesIO(buffer.getvalue())).convert("RGB")
        difference = ImageChops.difference(original, recompressed)
        # This is the same JPEG recompression/difference core used by Python-ELA.
        maximum = max(channel[1] for channel in difference.getextrema())
        enhanced = ImageEnhance.Brightness(difference).enhance(255 / maximum if maximum else 1)
        values = ImageStat.Stat(enhanced).mean
        return {
            "model": self.name,
            "status": "success",
            "prediction": "ela_signal_generated",
            "score": None,
            "metrics": {"mean_error_level": round(float(sum(values) / len(values)), 4)},
            "score_note": "ELA is an inspection signal; mean error level is not a tampering probability.",
        }
