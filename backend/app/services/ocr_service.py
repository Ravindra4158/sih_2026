import asyncio
from typing import Dict

async def process_ocr_image(image_path: str, document_hint: str) -> Dict:
    """Placeholder OCR processing.
    In production this would call the MRZ_Passport_Reader microservice.
    Returns a dict compatible with ProcessOCRResponse fields (except session_id).
    """
    # Simulated processing delay
    await asyncio.sleep(0.1)
    # Dummy data matching the response model
    return {
        "document_type": "TD3",
        "iqa_metrics": {
            "blur_score": 120.0,
            "glare_detected": False,
            "pass_quality_check": True,
        },
        "raw_mrz_text": "P<INDGUPTA<<RAHUL<<<<<<<<<<<<<<<<<<<<<<<<<<\nZ1234567<4IND9001015M3001011<<<<<<<<<<<<<<06",
        "parsed_fields": {
            "first_name": "RAHUL",
            "last_name": "GUPTA",
            "nationality": "IND",
            "document_number": "Z1234567",
            "date_of_birth": "1990-01-01",
            "gender": "M",
            "expiry_date": "2030-01-01",
        },
        "confidence_scores": {
            "mrz_ocr_confidence": 0.98,
            "viz_ocr_confidence": 0.92,
        },
    }
