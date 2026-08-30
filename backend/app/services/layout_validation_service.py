import easyocr
import re
import numpy as np
import logging
from PIL import Image

logger = logging.getLogger(__name__)

# Initialize the EasyOCR reader once to save memory and load time
# We use 'en' (English), can add 'hi' (Hindi) if needed
try:
    # Use gpu=False to prevent CUDA Out Of Memory errors
    reader = easyocr.Reader(['en'], gpu=False)
except Exception as e:
    logger.error(f"Failed to initialize EasyOCR: {e}")
    reader = None

def _get_image_dimensions(image_path: str):
    with Image.open(image_path) as img:
        return img.width, img.height

def _find_text_block(results, pattern: str, is_regex: bool = False):
    """Find a text block matching a string or regex, returning its relative Y position and text."""
    for bbox, text, prob in results:
        if prob < 0.3:
            continue
        
        match = False
        if is_regex:
            if re.search(pattern, text, re.IGNORECASE):
                match = True
        else:
            if pattern.lower() in text.lower():
                match = True
                
        if match:
            # bbox is [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
            # Top-left y is bbox[0][1], bottom-right y is bbox[2][1]
            center_y = (bbox[0][1] + bbox[2][1]) / 2.0
            return {"text": text, "y": center_y, "prob": prob}
    return None

async def validate_document_layout(image_path: str, document_type: str = "AUTO") -> dict:
    """
    Validates the layout of a document (Aadhar, PAN, Passport) using OCR bounding boxes.
    Checks if expected text fields are present and in the expected vertical order/position.
    """
    if reader is None:
        raise RuntimeError("EasyOCR not initialized")

    width, height = _get_image_dimensions(image_path)
    
    # Run OCR on the image
    results = reader.readtext(image_path)
    
    is_valid = True
    anomalies = []
    doc_type = document_type.upper()

    # Determine document type if AUTO
    if doc_type == "AUTO":
        if _find_text_block(results, "INCOME TAX DEPARTMENT"):
            doc_type = "PAN"
        elif _find_text_block(results, "GOVERNMENT OF INDIA"):
            doc_type = "AADHAR"
        elif _find_text_block(results, r"P<", is_regex=True) or _find_text_block(results, "PASSPORT"):
            doc_type = "PASSPORT"
        else:
            doc_type = "UNKNOWN"
            anomalies.append("Could not auto-detect document type from layout.")
            is_valid = False

    if doc_type == "AADHAR":
        header = _find_text_block(results, "GOVERNMENT OF INDIA")
        if not header:
            anomalies.append("Missing 'GOVERNMENT OF INDIA' header.")
            is_valid = False
        elif header['y'] / height > 0.4:
            anomalies.append(f"'GOVERNMENT OF INDIA' found too low on document (y={header['y']/height:.2f}).")
            is_valid = False

        # Look for a 12 digit number (Aadhar format: XXXX XXXX XXXX)
        aadhar_num = _find_text_block(results, r"\b\d{4}\s\d{4}\s\d{4}\b", is_regex=True)
        if not aadhar_num:
            anomalies.append("Could not find a 12-digit Aadhar number in standard format.")
            is_valid = False
        else:
            if aadhar_num['y'] / height < 0.5:
                 anomalies.append("Aadhar number found too high on the document (expected in lower half).")
                 is_valid = False

    elif doc_type == "PAN":
        header = _find_text_block(results, "INCOME TAX DEPARTMENT")
        if not header:
            anomalies.append("Missing 'INCOME TAX DEPARTMENT' header.")
            is_valid = False
        elif header['y'] / height > 0.4:
            anomalies.append("PAN header found too low on document.")
            is_valid = False
            
        # Look for 10-char PAN number (5 letters, 4 numbers, 1 letter)
        pan_num = _find_text_block(results, r"[A-Z]{5}[0-9]{4}[A-Z]{1}", is_regex=True)
        if not pan_num:
            anomalies.append("Could not find a valid PAN number format.")
            is_valid = False

    elif doc_type == "PASSPORT":
        # Look for MRZ lines at the bottom
        mrz_lines = []
        for bbox, text, prob in results:
            if "<" in text and len(text) > 20:
                center_y = (bbox[0][1] + bbox[2][1]) / 2.0
                mrz_lines.append(center_y / height)
                
        if len(mrz_lines) < 2:
            anomalies.append("Missing standard 2-line or 3-line MRZ zone.")
            is_valid = False
        else:
            for y_rel in mrz_lines:
                if y_rel < 0.6:
                    anomalies.append(f"MRZ line found too high on document (y={y_rel:.2f}).")
                    is_valid = False

    return {
        "is_valid": is_valid,
        "document_type": doc_type,
        "confidence_score": 0.9 if is_valid else max(0.0, 0.9 - (len(anomalies) * 0.2)),
        "layout_anomalies": anomalies
    }
