import logging

logger = logging.getLogger(__name__)

async def verify_match(face_image_path: str, reference_image_path: str) -> dict:
    """
    Verify if the face in face_image matches reference_image using DeepFace.
    Implements a fallback to prevent blocking if deepface is not installed due to heavy dependencies.
    """
    try:
        from deepface import DeepFace
    except ImportError as e:
        logger.warning(f"Biometrics dependencies missing: {e}. Returning mock result.")
        return {
            "match_probability": 0.0,
            "is_match": False,
            "flags_raised": ["BIOMETRICS_DEPENDENCIES_MISSING"]
        }

    try:
        # Use deepface for facial recognition
        result = DeepFace.verify(
            img1_path=face_image_path,
            img2_path=reference_image_path,
            enforce_detection=False,
            model_name="VGG-Face"
        )
        
        is_match = result.get("verified", False)
        # DeepFace provides distance, convert it to a probability score (mocked as 1 - distance)
        distance = result.get("distance", 1.0)
        match_probability = max(0.0, 1.0 - distance)

        flags = []
        if not is_match:
            flags.append("FACE_MISMATCH")

        return {
            "match_probability": match_probability,
            "is_match": is_match,
            "flags_raised": flags
        }
    except Exception as e:
        logger.error(f"Biometrics processing failed: {e}")
        return {
            "match_probability": 0.0,
            "is_match": False,
            "flags_raised": ["BIOMETRICS_PROCESSING_ERROR"]
        }
