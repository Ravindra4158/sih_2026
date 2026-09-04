"""Explainable, heuristic tampering signals for identity-document images.

These checks prioritise reviewable evidence over an automated authenticity verdict.
They are intentionally conservative: an anomaly is a reason for an officer to
inspect the document, not evidence that a document is forged.
"""

from __future__ import annotations

from typing import Any

import cv2
import numpy as np
from PIL import ExifTags, Image

from .ela_service import analyze_ela_image


def _overlap_ratio(first: dict[str, int], second: dict[str, int]) -> float:
    """Return the fraction of the first rectangle covered by the second."""
    left = max(first["x"], second["x"])
    top = max(first["y"], second["y"])
    right = min(first["x"] + first["width"], second["x"] + second["width"])
    bottom = min(first["y"] + first["height"], second["y"] + second["height"])
    if right <= left or bottom <= top:
        return 0.0
    intersection = (right - left) * (bottom - top)
    area = max(1, first["width"] * first["height"])
    return intersection / area


def _detect_portrait_region(image: np.ndarray) -> dict[str, int] | None:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    faces = cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40)
    )
    if len(faces) == 0:
        return None
    x, y, width, height = max(faces, key=lambda item: item[2] * item[3])
    return {"x": int(x), "y": int(y), "width": int(width), "height": int(height)}


def _metadata_analysis(image_path: str) -> dict[str, Any]:
    """Extract a small, review-safe set of metadata fields and editing clues."""
    fields: dict[str, str] = {}
    flags: list[str] = []
    try:
        with Image.open(image_path) as image:
            exif = image.getexif()
            for tag_id, value in exif.items():
                tag = ExifTags.TAGS.get(tag_id, str(tag_id))
                if tag in {"Software", "DateTime", "DateTimeOriginal", "Make", "Model"}:
                    fields[tag] = str(value)[:200]

            software = fields.get("Software", "").lower()
            editors = (
                "photoshop", "gimp", "lightroom", "canva", "affinity", "pixelmator", "paint"
            )
            if any(editor in software for editor in editors):
                flags.append("EDITING_SOFTWARE_METADATA")
            if not exif:
                flags.append("NO_EXIF_METADATA")
    except Exception:
        flags.append("METADATA_UNAVAILABLE")

    return {
        "metadata_present": bool(fields),
        "fields": fields,
        "flags": flags,
    }


def _stamp_signals(image: np.ndarray) -> tuple[list[dict[str, Any]], list[str]]:
    """Find stamp-like circular, coloured regions for manual review.

    Official stamps vary widely, so this routine deliberately reports candidates
    rather than asserting that a stamp is forged.
    """
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    # Common blue/red stamp-ink ranges. The mask only proposes review regions.
    red = cv2.inRange(hsv, (0, 70, 50), (10, 255, 255)) | cv2.inRange(
        hsv, (170, 70, 50), (180, 255, 255)
    )
    blue = cv2.inRange(hsv, (90, 50, 40), (135, 255, 255))
    mask = cv2.morphologyEx(red | blue, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    candidates: list[dict[str, Any]] = []
    flags: list[str] = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 400:
            continue
        perimeter = cv2.arcLength(contour, True)
        if perimeter <= 0:
            continue
        circularity = 4 * np.pi * area / (perimeter * perimeter)
        x, y, width, height = cv2.boundingRect(contour)
        if circularity >= 0.35:
            candidates.append(
                {
                    "bounding_box": {"x": x, "y": y, "width": width, "height": height},
                    "circularity": round(float(circularity), 3),
                    "area": int(area),
                }
            )
    if candidates:
        flags.append("STAMP_LIKE_COLOURED_REGION")
    return candidates[:10], flags


def _detect_text_regions(image: np.ndarray) -> tuple[list[dict[str, int]], list[str]]:
    """Return OCR word boxes, without retaining or returning recognised text."""
    try:
        import pytesseract

        data = pytesseract.image_to_data(
            image, output_type=pytesseract.Output.DICT, config="--psm 6"
        )
        boxes = []
        for index, confidence in enumerate(data["conf"]):
            if float(confidence) < 30:
                continue
            width, height = int(data["width"][index]), int(data["height"][index])
            if width > 2 and height > 2:
                boxes.append(
                    {
                        "x": int(data["left"][index]),
                        "y": int(data["top"][index]),
                        "width": width,
                        "height": height,
                    }
                )
        return boxes, []
    except Exception:
        # The ELA analysis remains useful when Tesseract is unavailable, but
        # no text-specific conclusion should be made in that case.
        return [], ["TEXT_REGION_DETECTION_UNAVAILABLE"]


async def analyze_tampering(image_path: str, jpeg_quality: int = 90) -> dict[str, Any]:
    """Run all supported tampering checks and return explainable review signals."""
    ela = await analyze_ela_image(image_path, jpeg_quality)
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Could not decode document image for tampering analysis.")

    regions = ela.get("suspicious_regions", [])
    portrait = _detect_portrait_region(image)
    portrait_flags: list[str] = []
    portrait_overlap = 0.0
    if portrait:
        portrait_overlap = max(
            (_overlap_ratio(portrait, region.get("bounding_box", {})) for region in regions),
            default=0.0,
        )
        if portrait_overlap >= 0.20:
            portrait_flags.append("ELA_ANOMALY_OVERLAPS_PORTRAIT")

    text_boxes, text_flags = _detect_text_regions(image)
    text_regions = []
    for region in regions:
        region_box = region.get("bounding_box", {})
        if any(_overlap_ratio(text_box, region_box) >= 0.10 for text_box in text_boxes):
            text_regions.append(region)
    if text_regions:
        text_flags.append("ELA_ANOMALY_OVERLAPS_TEXT")

    stamp_candidates, stamp_flags = _stamp_signals(image)
    metadata = _metadata_analysis(image_path)
    all_flags = list(dict.fromkeys(
        ela.get("flags_raised", []) + portrait_flags + text_flags + stamp_flags + metadata["flags"]
    ))

    return {
        "tamper_detected": ela.get("tampering_probability", 0.0) > 0.4,
        "tamper_confidence_score": round(ela.get("tampering_probability", 0.0) * 100, 1),
        "anomaly_regions": regions,
        "ela_heatmap_base64": ela.get("ela_heatmap_url"),
        "photo_replacement": {
            "portrait_detected": portrait is not None,
            "portrait_bounding_box": portrait,
            "ela_overlap_ratio": round(portrait_overlap, 3),
            "requires_manual_review": bool(portrait_flags),
            "flags": portrait_flags,
        },
        "text_manipulation": {
            "text_regions_analysed": len(text_boxes),
            "anomalous_regions": text_regions,
            "requires_manual_review": bool(text_flags),
            "flags": text_flags,
        },
        "stamp_forgery": {
            "stamp_candidates": stamp_candidates,
            "requires_manual_review": bool(stamp_candidates),
            "flags": stamp_flags,
        },
        "image_metadata": metadata,
        "flags_raised": all_flags,
        "limitations": [
            "These are heuristic screening signals, not proof of alteration or authenticity.",
            "Stamp candidates are based on coloured circular regions and require officer review.",
            "Photo-replacement signals require a detected portrait and an overlapping ELA anomaly.",
        ],
    }
