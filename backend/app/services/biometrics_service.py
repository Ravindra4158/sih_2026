"""Lightweight OpenCV face matching and liveness checking."""
import asyncio
import base64
import logging
import os
from pathlib import Path

import cv2
import numpy as np

logger = logging.getLogger(__name__)

_MODEL_DIR = Path(os.getenv("BIOMETRIC_MODEL_DIR", "models/face"))
_YUNET_PATH = Path(os.getenv(
    "YUNET_MODEL_PATH",
    str(_MODEL_DIR / "face_detection_yunet_2023mar.onnx")
))
_SFACE_PATH = Path(os.getenv(
    "SFACE_MODEL_PATH",
    str(_MODEL_DIR / "face_recognition_sface_2021dec.onnx")
))
_face_detector = None
_face_recognizer = None


def _load_models():
    global _face_detector, _face_recognizer
    if _face_detector is None or _face_recognizer is None:
        if not _YUNET_PATH.is_file() or not _SFACE_PATH.is_file():
            raise FileNotFoundError(
                f"Biometric models not found. Expected {_YUNET_PATH} and {_SFACE_PATH}."
            )
        _face_detector = cv2.FaceDetectorYN.create(
            str(_YUNET_PATH), "", (320, 320), 0.8, 0.8, 5000
        )
        _face_recognizer = cv2.FaceRecognizerSF.create(str(_SFACE_PATH), "")
    return _face_detector, _face_recognizer


def _decode_image(value: str) -> np.ndarray:
    encoded = value.split(",", 1)[1] if "," in value else value
    image = cv2.imdecode(np.frombuffer(base64.b64decode(encoded), np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Unable to decode biometric image")
    return image


def _face_feature(image: np.ndarray, detector, recognizer) -> np.ndarray:
    detector.setInputSize((image.shape[1], image.shape[0]))
    _, faces = detector.detect(image)
    if faces is None or len(faces) == 0:
        raise ValueError("No face detected")
    face = max(faces, key=lambda item: item[2] * item[3])
    aligned = recognizer.alignCrop(image, face)
    feature = recognizer.feature(aligned)
    return feature


def _match_faces(document_photo_base64: str, live_capture_base64: str) -> float:
    detector, recognizer = _load_models()
    document_image = _decode_image(document_photo_base64)
    live_image = _decode_image(live_capture_base64)
    document_feature = _face_feature(document_image, detector, recognizer)
    live_feature = _face_feature(live_image, detector, recognizer)
    cosine_score = recognizer.match(
        document_feature, live_feature, cv2.FaceRecognizerSF_FR_COSINE
    )
    return round(max(0.0, min(100.0, float(cosine_score) * 100.0)), 1)

async def verify_match(
    session_id: str,
    document_photo_base64: str,
    live_capture_base64: str,
    ear_frame_series: list[float] = None
) -> dict:
    """
    Verify facial match between a document portrait and a live capture.
    Includes Eye Aspect Ratio (EAR) blink detection liveness check.
    """
    ear_series = ear_frame_series or []
    
    # Calculate EAR liveness metrics
    minimum_ear = float(min(ear_series)) if ear_series else 0.28
    
    # Blink detection: look for a drop below 0.20 and rise back up
    blink_detected = False
    if len(ear_series) >= 3:
        # Simple local minima search for blink
        for i in range(1, len(ear_series) - 1):
            if ear_series[i] < 0.20 and ear_series[i] < ear_series[i-1] and ear_series[i] < ear_series[i+1]:
                blink_detected = True
                break
    else:
        # Fallback if no frames sent: check if minimum EAR is low
        blink_detected = minimum_ear < 0.22

    pad_score = 0.95 if blink_detected else 0.35
    is_live = pad_score >= 0.5

    face_match_score = 0.0
    verification_status = "MISMATCH"
    flags = []
    try:
        face_match_score = await asyncio.to_thread(
            _match_faces, document_photo_base64, live_capture_base64
        )
        if face_match_score >= 36.0:
            verification_status = "MATCH_CONFIRMED"
        else:
            flags.append(f"BIOMETRIC_MISMATCH (Similarity: {face_match_score:.1f}%)")
    except FileNotFoundError as error:
        logger.warning(str(error))
        flags.append("BIOMETRIC_MODEL_UNAVAILABLE")
    except (ValueError, cv2.error) as error:
        logger.info("Biometric verification rejected: %s", error)
        flags.append("BIOMETRIC_FACE_MATCH_FAILED")

    if not is_live:
        flags.append("LIVENESS_WARNING_NO_BLINK")
        if verification_status == "MATCH_CONFIRMED":
            verification_status = "MANUAL_REVIEW_REQUIRED"

    return {
        "session_id": session_id,
        "face_match_score": round(face_match_score, 1),
        "verification_status": verification_status,
        "liveness_check": {
            "is_live": is_live,
            "blink_detected": blink_detected,
            "minimum_ear": round(minimum_ear, 3),
            "pad_score": round(pad_score, 2)
        },
        "flags_raised": flags
    }
