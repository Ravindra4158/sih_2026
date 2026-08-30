import logging
from typing import Dict, Any, List
import difflib

logger = logging.getLogger(__name__)

def _calculate_similarity(str1: str, str2: str) -> float:
    """Calculate string similarity ratio between 0.0 and 1.0"""
    if not str1 or not str2:
        return 0.0
    return difflib.SequenceMatcher(None, str1.lower().strip(), str2.lower().strip()).ratio()

def cross_reference_document_data(ocr_data: Dict[str, str], qr_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cross-references OCR data printed on the document with the Secure QR data.
    If the name or DOB differs significantly, it flags the document as likely tampered.
    """
    flags_raised = []
    confidence_penalty = 0.0
    
    ocr_name = ocr_data.get("name", "")
    qr_name = qr_data.get("name", "")
    
    ocr_dob = ocr_data.get("dob", "")
    qr_dob = qr_data.get("dob", "")
    
    name_match_score = _calculate_similarity(ocr_name, qr_name)
    dob_match_score = _calculate_similarity(ocr_dob, qr_dob)
    
    match_details = {
        "name_match": {
            "ocr_value": ocr_name,
            "qr_value": qr_name,
            "score": name_match_score,
            "passed": True
        },
        "dob_match": {
            "ocr_value": ocr_dob,
            "qr_value": qr_dob,
            "score": dob_match_score,
            "passed": True
        }
    }
    
    # Check Name
    if qr_name and ocr_name:
        if name_match_score < 0.7:
            flags_raised.append("NAME_MISMATCH_OCR_VS_QR")
            match_details["name_match"]["passed"] = False
            confidence_penalty += 0.4
            
    # Check DOB
    if qr_dob and ocr_dob:
        if dob_match_score < 0.8:
            flags_raised.append("DOB_MISMATCH_OCR_VS_QR")
            match_details["dob_match"]["passed"] = False
            confidence_penalty += 0.4

    is_verified = len(flags_raised) == 0
    
    return {
        "is_verified": is_verified,
        "overall_match_confidence": max(0.0, 1.0 - confidence_penalty),
        "flags_raised": flags_raised,
        "match_details": match_details
    }
