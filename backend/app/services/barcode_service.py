import logging
from typing import List, Dict, Any
import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

def _format_result(barcode_type: str, data: str, bbox: Dict[str, int]) -> Dict[str, Any]:
    return {
        "type": barcode_type,
        "data": data,
        "bounding_box": bbox
    }

def extract_barcodes_and_qr(image_path: str) -> List[Dict[str, Any]]:
    """
    Extracts QR codes and Barcodes from an image.
    Uses pyzbar for general barcodes, with OpenCV image preprocessing and 
    cv2.QRCodeDetector as a fallback for stubborn QR codes.
    """
    results = []
    
    # 1. Load image using OpenCV
    cv_img = cv2.imread(image_path)
    if cv_img is None:
        logger.error(f"Could not load image for barcode extraction: {image_path}")
        return results

    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    
    # Track found data to avoid duplicates between pyzbar and OpenCV
    found_data = set()

    # --- ATTEMPT 1: pyzbar on grayscale (best for standard barcodes/QR) ---
    try:
        from pyzbar.pyzbar import decode
        
        # Test on grayscale
        decoded_objects = decode(gray)
        
        # If nothing, test on a binary thresholded image (helps with glare/contrast on IDs)
        if not decoded_objects:
            _, thresh = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            decoded_objects = decode(thresh)

        for obj in decoded_objects:
            try:
                data_str = obj.data.decode('utf-8')
            except UnicodeDecodeError:
                data_str = str(obj.data)
                
            if data_str not in found_data:
                found_data.add(data_str)
                results.append(_format_result(
                    barcode_type=obj.type,
                    data=data_str,
                    bbox={
                        "x": obj.rect.left,
                        "y": obj.rect.top,
                        "width": obj.rect.width,
                        "height": obj.rect.height
                    }
                ))
    except ImportError:
        logger.error("pyzbar is not installed. Falling back to OpenCV for QR codes.")
    except Exception as e:
        logger.error(f"Error during pyzbar decoding: {e}")

    # --- ATTEMPT 2: OpenCV QRCodeDetector (often better at handling angled/skewed QR codes) ---
    try:
        qr_detector = cv2.QRCodeDetector()
        data, bbox, _ = qr_detector.detectAndDecode(cv_img)
        
        if data and data not in found_data:
            # OpenCV bbox is a list of 4 points [[x,y], [x,y], [x,y], [x,y]]
            if bbox is not None and len(bbox) > 0:
                pts = bbox[0]
                x_coords = [p[0] for p in pts]
                y_coords = [p[1] for p in pts]
                x, y = int(min(x_coords)), int(min(y_coords))
                w, h = int(max(x_coords) - x), int(max(y_coords) - y)
                
                results.append(_format_result(
                    barcode_type="QRCODE",
                    data=data,
                    bbox={"x": x, "y": y, "width": w, "height": h}
                ))
    except Exception as e:
        logger.error(f"Error during OpenCV QR decoding: {e}")
        
    return results
