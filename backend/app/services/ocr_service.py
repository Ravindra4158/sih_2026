import asyncio
import cv2
import numpy as np
import pytesseract
import easyocr
import re
import os
from typing import Dict, Any, List, Tuple
from mrz.checker.td3 import TD3CodeChecker
from mrz.checker.td1 import TD1CodeChecker
from mrz.checker.td2 import TD2CodeChecker

# Global singleton EasyOCR reader (initialized once in memory)
_EASYOCR_READER = None

def get_easyocr_reader():
    global _EASYOCR_READER
    if _EASYOCR_READER is None:
        # Load English model on CPU
        _EASYOCR_READER = easyocr.Reader(['en'], gpu=False)
    return _EASYOCR_READER

def preprocess_image(image_path: str) -> np.ndarray:
    """Resize & prepare image for OCR."""
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")
    
    max_dim = 1600
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    
    return img

def _compute_iqa(img: np.ndarray) -> Dict[str, Any]:
    """Image Quality Assessment (Blur & Glare detection)."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    blur_score = float(laplacian_var)
    
    _, thresholded = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
    glare_ratio = cv2.countNonZero(thresholded) / (gray.shape[0] * gray.shape[1])
    glare_detected = glare_ratio > 0.08
    
    return {
        "blur_score": round(blur_score, 2),
        "glare_detected": glare_detected,
        "pass_quality_check": blur_score > 60.0 and not glare_detected
    }

def run_easyocr(img: np.ndarray) -> List[Tuple[Any, str, float]]:
    """Run EasyOCR and return list of (bbox, text, confidence)."""
    reader = get_easyocr_reader()
    results = reader.readtext(img)
    return results

def sort_and_group_lines(ocr_results: List[Tuple[Any, str, float]]) -> List[str]:
    """Sort detected text boxes top-to-bottom, left-to-right into coherent lines."""
    if not ocr_results:
        return []
    
    items = []
    for bbox, text, conf in ocr_results:
        text = text.strip()
        if not text:
            continue
        ys = [p[1] for p in bbox]
        xs = [p[0] for p in bbox]
        y_center = sum(ys) / len(ys)
        x_min = min(xs)
        height = max(ys) - min(ys)
        items.append({"text": text, "conf": conf, "y": y_center, "x": x_min, "h": height})
    
    items.sort(key=lambda item: item["y"])
    
    lines = []
    if not items:
        return lines
    
    current_line = [items[0]]
    for item in items[1:]:
        prev_item = current_line[-1]
        line_h = max(item["h"], prev_item["h"], 15)
        if abs(item["y"] - prev_item["y"]) < line_h * 0.6:
            current_line.append(item)
        else:
            current_line.sort(key=lambda it: it["x"])
            lines.append(" ".join(it["text"] for it in current_line))
            current_line = [item]
            
    if current_line:
        current_line.sort(key=lambda it: it["x"])
        lines.append(" ".join(it["text"] for it in current_line))
        
    return lines

def extract_date_tolerant(text: str) -> str:
    """Tolerantly extract DD/MM/YYYY dates from OCR text with punctuation variations."""
    # Match standard or noisy dates e.g. 15,08 '1995, 15/08/1995, 15-08-1995, 15.08.1995
    m = re.search(r"\b(\d{2})[\s,\.\/\-_]+(\d{2})[\s,\.\/\-_'`]*(\d{4})\b", text)
    if m:
        day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if 1 <= day <= 31 and 1 <= month <= 12 and 1900 <= year <= 2050:
            return f"{m.group(1).zfill(2)}/{m.group(2).zfill(2)}/{m.group(3)}"
    return ""

# ---------------------------------------------------------------------------
# Aadhaar Extraction Logic
# ---------------------------------------------------------------------------

AADHAAR_HEADER_NOISE = {
    "GOVERNMENT", "INDIA", "GOVT", "UNIQUE", "IDENTIFICATION", "AUTHORITY",
    "AADHAAR", "UIDAI", "ENROLMENT", "ENROLLMENT", "HELP", "WWW", "DOWNLOAD",
    "ISSUE", "DATE", "MERA", "PEHCHAN", "BHARAT", "SARKAR", "VID", "ELECTRONIC",
    "INFORMATION", "ADDRESS", "CARD", "TO", "DOB", "YEAR", "BIRTH", "GENDER", "MALE", "FEMALE"
}

def extract_aadhaar_fields_from_lines(lines: List[str], raw_text: str) -> Dict[str, str]:
    """Extract Aadhaar UID, Name, DOB, Gender from parsed lines."""
    fields: Dict[str, str] = {}
    
    # 1. Extract 12-digit UID
    uid_match = re.search(r"\b(\d{4})[\s\-]?(\d{4})[\s\-]?(\d{4})\b", raw_text)
    if uid_match:
        fields["aadhaar_number"] = f"{uid_match.group(1)} {uid_match.group(2)} {uid_match.group(3)}"
        fields["document_number"] = f"{uid_match.group(1)}{uid_match.group(2)}{uid_match.group(3)}"

    # 2. Extract Date of Birth
    dob = extract_date_tolerant(raw_text)
    if dob:
        fields["date_of_birth"] = dob
    else:
        # Check Year only (e.g. Year of Birth : 1985)
        yob_match = re.search(r"(?:Year of Birth|YOB)[\s:\.\-]*(\d{4})\b", raw_text, re.IGNORECASE)
        if yob_match:
            fields["date_of_birth"] = f"01/01/{yob_match.group(1)}"

    # 3. Extract Gender / Sex
    if re.search(r"\b(FEMALE|WOMAN|MAHILA)\b", raw_text, re.IGNORECASE):
        fields["sex"] = "F"
    elif re.search(r"\b(MALE|MAN|PURUSH)\b", raw_text, re.IGNORECASE):
        fields["sex"] = "M"
    elif re.search(r"\b(TRANSGENDER)\b", raw_text, re.IGNORECASE):
        fields["sex"] = "T"
    elif re.search(r"\bGender[:\s]*([MF])\b", raw_text, re.IGNORECASE):
        fields["sex"] = re.search(r"\bGender[:\s]*([MF])\b", raw_text, re.IGNORECASE).group(1).upper()

    # 4. Extract Name
    # Strategy A: Line explicitly labelled Name:
    for line in lines:
        if re.search(r"^Name[\s:\.\-]+", line, re.IGNORECASE):
            cleaned = re.sub(r"^Name[\s:\.\-]+", "", line, flags=re.IGNORECASE).strip()
            # Strip any trailing label like DOB or Gender if on the same line
            cleaned = re.sub(r"(DOB|Birth|Gender|Male|Female).*$", "", cleaned, flags=re.IGNORECASE).strip()
            words = [w for w in cleaned.split() if w.isalpha() and w.upper() not in AADHAAR_HEADER_NOISE]
            if words:
                fields["name"] = " ".join(words).title()
                break

    # Strategy B: Line immediately preceding DOB / Gender
    if not fields.get("name"):
        dob_line_idx = -1
        for idx, line in enumerate(lines):
            if "DOB" in line.upper() or "BIRTH" in line.upper() or extract_date_tolerant(line):
                dob_line_idx = idx
                break
        
        if dob_line_idx > 0:
            for check_idx in range(dob_line_idx - 1, -1, -1):
                candidate_line = lines[check_idx].strip()
                candidate_line = re.sub(r"(Name|DOB|Birth|Gender)[\s:\.\-]*", "", candidate_line, flags=re.IGNORECASE).strip()
                words = [w for w in candidate_line.split() if w.isalpha() and w.upper() not in AADHAAR_HEADER_NOISE and len(w) > 1]
                if len(words) >= 1:
                    fields["name"] = " ".join(words).title()
                    break

    # Strategy C: First line with 2+ alphabetic words not in noise list
    if not fields.get("name"):
        for line in lines:
            words = [w for w in line.split() if w.isalpha() and w.upper() not in AADHAAR_HEADER_NOISE and len(w) > 1]
            if len(words) >= 2:
                fields["name"] = " ".join(words).title()
                break

    fields["nationality"] = "IND"
    return fields

# ---------------------------------------------------------------------------
# PAN Card Extraction Logic
# ---------------------------------------------------------------------------

PAN_HEADER_NOISE = {
    "INCOME", "TAX", "DEPARTMENT", "GOVT", "GOVERNMENT", "INDIA", "PERMANENT",
    "ACCOUNT", "NUMBER", "CARD", "SIGNATURE", "FATHER", "NAME", "DATE", "BIRTH",
    "GOVTOF", "FERMANENT", "FERMANENTACCOUNTNUMBER"
}

def extract_pan_fields_from_lines(lines: List[str], raw_text: str) -> Dict[str, str]:
    """Extract PAN Number, Name, Father's Name, DOB from parsed lines."""
    fields: Dict[str, str] = {}
    
    # 1. PAN Number (5 letters + 4 digits + 1 letter)
    pan_match = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b", raw_text)
    if pan_match:
        fields["pan_number"] = pan_match.group(1)
        fields["document_number"] = pan_match.group(1)
        
    # 2. Date of Birth
    dob = extract_date_tolerant(raw_text)
    if dob:
        fields["date_of_birth"] = dob

    # 3. Names extraction
    candidate_name_lines = []
    for line in lines:
        cleaned_line = line.strip()
        # Skip PAN number line, date line, or short junk
        if re.search(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", cleaned_line) or extract_date_tolerant(cleaned_line):
            continue
            
        upper_l = cleaned_line.upper()
        # Check if line contains any header keywords
        if any(keyword in upper_l for keyword in ["INCOME", "TAX", "GOVT", "INDIA", "ACCOUNT", "DEPARTMENT", "PERMANENT", "FERMANENT", "SIGNATURE", "CARD"]):
            continue
            
        words = [w for w in cleaned_line.split() if w.isalpha() and len(w) > 1 and w.upper() not in PAN_HEADER_NOISE]
        if len(words) >= 1:
            candidate_name_lines.append(" ".join(words).title())

    if len(candidate_name_lines) >= 1:
        fields["name"] = candidate_name_lines[0]
    if len(candidate_name_lines) >= 2:
        fields["father_name"] = candidate_name_lines[1]

    fields["nationality"] = "IND"
    return fields

# ---------------------------------------------------------------------------
# Passport / MRZ Extraction Logic
# ---------------------------------------------------------------------------

def parse_mrz(raw_text: str) -> Dict[str, Any]:
    """Convert MRZ text into structured fields: Passport number, Name, Nationality, DOB, Expiry, Sex."""
    lines = raw_text.split('\n')
    mrz_lines = [line.strip().replace(" ", "").upper() for line in lines if "<" in line and len(line.strip().replace(" ", "")) >= 28]
    
    raw_mrz = "\n".join(mrz_lines)
    if not mrz_lines:
        return {"raw_mrz_text": "", "parsed": {}, "valid": False}
        
    try:
        checker = None
        if len(mrz_lines) >= 2 and len(mrz_lines[0]) == 44:
            checker = TD3CodeChecker("\n".join(mrz_lines[:2]))
        elif len(mrz_lines) >= 3 and len(mrz_lines[0]) == 30:
            checker = TD1CodeChecker("\n".join(mrz_lines[:3]))
        elif len(mrz_lines) >= 2 and len(mrz_lines[0]) == 36:
            checker = TD2CodeChecker("\n".join(mrz_lines[:2]))
        
        if checker:
            f = checker.fields()
            parsed_fields = {
                "document_number": f.document_number,
                "first_name": f.name,
                "last_name": f.surname,
                "name": f"{f.name} {f.surname}".strip(),
                "nationality": f.nationality,
                "date_of_birth": f.birth_date,
                "sex": f.sex,
                "expiry_date": f.expiry_date,
            }
            return {
                "raw_mrz_text": raw_mrz,
                "parsed": parsed_fields,
                "valid": bool(checker)
            }
    except Exception as e:
        return {"raw_mrz_text": raw_mrz, "parsed": {}, "valid": False, "error": str(e)}

    return {"raw_mrz_text": raw_mrz, "parsed": {}, "valid": False}

# ---------------------------------------------------------------------------
# Main Pipeline Processor
# ---------------------------------------------------------------------------

async def process_ocr_image(image_path: str, document_hint: str = "AUTO") -> Dict[str, Any]:
    """Process an identity document image using EasyOCR and intelligent field extraction."""
    # 1. Preprocess Image
    img = preprocess_image(image_path)
    iqa = _compute_iqa(img)
    
    # 2. Run EasyOCR asynchronously in thread pool
    loop = asyncio.get_event_loop()
    ocr_results = await loop.run_in_executor(None, run_easyocr, img)
    
    # Group into sorted lines
    lines = sort_and_group_lines(ocr_results)
    raw_text = "\n".join(lines)
    
    # Calculate average confidence
    confidences = [conf for _, _, conf in ocr_results]
    avg_conf = float(np.mean(confidences)) if confidences else 0.85

    # 3. Detect Document Type
    upper_text = raw_text.upper()
    doc_type = document_hint.upper() if document_hint != "AUTO" else "UNKNOWN"
    
    if doc_type in ["UNKNOWN", "AUTO", "AADHAR", "ADHAR"]:
        if "AADHAAR" in upper_text or "AADHAR" in upper_text or "UNIQUE IDENTIFICATION" in upper_text or re.search(r"\b\d{4}\s\d{4}\s\d{4}\b", raw_text):
            doc_type = "AADHAAR"
        elif "INCOME TAX" in upper_text or "PERMANENT ACCOUNT" in upper_text or re.search(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", raw_text):
            doc_type = "PAN"
        elif "<" in raw_text and ("PASSPORT" in upper_text or len([l for l in lines if "<" in l]) >= 2):
            doc_type = "PASSPORT"
        else:
            doc_type = "GENERAL_ID"

    # 4. Extract Structured Fields
    parsed_fields: Dict[str, str] = {}
    mrz_data = {"raw_mrz_text": "", "parsed": {}, "valid": False}

    if doc_type in ["AADHAAR", "AADHAR", "ADHAR"] or "AADHAAR" in upper_text:
        parsed_fields = extract_aadhaar_fields_from_lines(lines, raw_text)
        doc_type = "AADHAAR"
    elif doc_type == "PAN" or "INCOME TAX" in upper_text:
        parsed_fields = extract_pan_fields_from_lines(lines, raw_text)
        doc_type = "PAN"
    elif doc_type == "PASSPORT" or "<" in raw_text:
        mrz_data = parse_mrz(raw_text)
        if mrz_data.get("parsed"):
            parsed_fields.update(mrz_data["parsed"])
            doc_type = "PASSPORT"

    # Fallback general field extraction
    if not parsed_fields.get("date_of_birth"):
        dob = extract_date_tolerant(raw_text)
        if dob:
            parsed_fields["date_of_birth"] = dob
            
    if not parsed_fields.get("sex"):
        if re.search(r"\b(FEMALE|F)\b", raw_text, re.IGNORECASE):
            parsed_fields["sex"] = "F"
        elif re.search(r"\b(MALE|M)\b", raw_text, re.IGNORECASE):
            parsed_fields["sex"] = "M"

    return {
        "document_type": doc_type,
        "iqa_metrics": iqa,
        "raw_text": raw_text,
        "raw_mrz_text": mrz_data.get("raw_mrz_text", ""),
        "parsed_fields": parsed_fields,
        "confidence_scores": {
            "mrz_ocr_confidence": avg_conf if mrz_data.get("raw_mrz_text") else 0.0,
            "viz_ocr_confidence": round(avg_conf, 2),
        },
    }
