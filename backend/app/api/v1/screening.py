"""
screening.py – Cases CRUD endpoints backed by MongoDB Atlas.

Routes:
  POST   /cases               Save a new screening case
  GET    /cases               List all cases (with optional filters)
  GET    /cases/{case_id}     Get a single case
  PATCH  /cases/{case_id}     Update status / review notes
  POST   /screening/orchestrate  (legacy) Run risk orchestration
"""
import logging
from copy import deepcopy
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from ...models.case_models import SaveCaseRequest, UpdateCaseRequest, CaseDocument
from ...models.request_models import ScreeningOrchestrateRequest
from ...models.response_models import ScreeningResponse
from ...services.orchestration_service import run_screening
from ...database.mongodb import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Seed data — written once to MongoDB if the collection is empty
# ---------------------------------------------------------------------------
SEED_CASES = [
    {
        "id": "BR-2026-00125", "date": "25 Aug 2026, 10:25 AM", "name": "Kumar Sandeep",
        "docType": "Aadhaar Card", "docNo": "1234 5678 9012", "riskLevel": "Low",
        "status": "Approved", "officer": "Rajesh K.",
        "reviewNotes": "Document validated successfully.",
        "details": {"dob": "15/08/1990", "nationality": "Indian", "gender": "Male", "issueDate": "12/04/2018", "expiryDate": "N/A"},
        "iqa": {"blurScore": 0.04, "glareDetected": False, "passQualityCheck": True},
        "ocr": {"rawText": "GOVERNMENT OF INDIA\nKumar Sandeep\nDOB: 15/08/1990\nMALE\n1234 5678 9012",
                "parsedFields": {"Document Type": "Aadhaar Card", "Document Number": "1234 5678 9012", "Full Name": "Kumar Sandeep", "Date of Birth": "15/08/1990"},
                "confidenceScores": {"Document Number": 99.4, "Full Name": 98.2, "Date of Birth": 97.8}},
        "forensics": {"tamperDetected": False, "tamperConfidenceScore": 0.05, "anomalyRegions": [], "elaHeatmapBase64": None, "elaFlags": []},
        "biometrics": {"faceMatchScore": 94.6, "verificationStatus": "MATCH_CONFIRMED",
                       "livenessCheck": {"isLive": True, "blinkDetected": True, "minimumEar": 0.18, "padScore": 0.96},
                       "earFrameSeries": [0.32, 0.31, 0.33, 0.18, 0.16, 0.32]},
        "warnings": []
    },
    {
        "id": "BR-2026-00124", "date": "25 Aug 2026, 10:18 AM", "name": "Ramesh Yadav",
        "docType": "PAN Card", "docNo": "ABCDE1234F", "riskLevel": "Medium",
        "status": "Pending", "officer": "Rajesh K.", "reviewNotes": "",
        "details": {"dob": "22/11/1985", "nationality": "Indian", "gender": "Male", "issueDate": "10/06/2015", "expiryDate": "N/A"},
        "iqa": {"blurScore": 0.11, "glareDetected": True, "passQualityCheck": True},
        "ocr": {"rawText": "INCOME TAX DEPARTMENT\nRAMESH YADAV\nDOB: 22/11/1985\nABCDE1234F",
                "parsedFields": {"Document Type": "PAN Card", "Document Number": "ABCDE1234F", "Full Name": "Ramesh Yadav", "Date of Birth": "22/11/1985"},
                "confidenceScores": {"Document Number": 96.1, "Full Name": 95.5, "Date of Birth": 92.0}},
        "forensics": {"tamperDetected": False, "tamperConfidenceScore": 0.15, "anomalyRegions": [], "elaHeatmapBase64": None, "elaFlags": []},
        "biometrics": {"faceMatchScore": 78.4, "verificationStatus": "MANUAL_REVIEW_REQUIRED",
                       "livenessCheck": {"isLive": True, "blinkDetected": False, "minimumEar": 0.28, "padScore": 0.72},
                       "earFrameSeries": [0.30, 0.29, 0.30, 0.28, 0.29, 0.30]},
        "warnings": ["GLARE_DETECTED: Optical reflection near signature zone.", "BIOMETRIC_BORDERLINE: Face score 78.4% (threshold 80%)."]
    },
    {
        "id": "BR-2026-00123", "date": "25 Aug 2026, 10:10 AM", "name": "Mohd. Arif",
        "docType": "Passport", "docNo": "P9876543", "riskLevel": "High",
        "status": "Rejected", "officer": "Rajesh K.",
        "reviewNotes": "Document exhibits structural alteration under ELA. Photo mismatch.",
        "details": {"dob": "05/04/1993", "nationality": "Indian", "gender": "Male", "issueDate": "15/01/2016", "expiryDate": "14/01/2026"},
        "iqa": {"blurScore": 0.02, "glareDetected": False, "passQualityCheck": True},
        "ocr": {"rawText": "REPUBLIC OF INDIA\nPASSPORT\nP9876543\nARIF MOHAMMED",
                "parsedFields": {"Document Type": "Passport", "Document Number": "P9876543", "Full Name": "Mohammed Arif", "Date of Birth": "05/04/1993"},
                "confidenceScores": {"Document Number": 99.8, "Full Name": 99.5, "MRZ Text": 98.7}},
        "forensics": {"tamperDetected": True, "tamperConfidenceScore": 91.2,
                      "anomalyRegions": [{"region_label": "Photo Alteration Region", "bounding_box": {"x": 45, "y": 80, "width": 110, "height": 135}, "error_variance": 64.2}],
                      "elaHeatmapBase64": None, "elaFlags": ["HIGH_ELA_DIFFERENTIAL"]},
        "biometrics": {"faceMatchScore": 42.1, "verificationStatus": "MISMATCH",
                       "livenessCheck": {"isLive": False, "blinkDetected": False, "minimumEar": 0.31, "padScore": 0.34},
                       "earFrameSeries": [0.33, 0.32, 0.33, 0.33, 0.32, 0.31]},
        "warnings": ["DOCUMENT_EXPIRED: Expiry date 14/01/2026 is in the past.", "ELA_TAMPERING_DETECTED.", "BIOMETRIC_MISMATCH: Score 42.1%."]
    },
    {
        "id": "BR-2026-00122", "date": "25 Aug 2026, 10:02 AM", "name": "Pooja Sharma",
        "docType": "Driving Licence", "docNo": "DL-1220150034", "riskLevel": "Low",
        "status": "Approved", "officer": "Rajesh K.", "reviewNotes": "Driving license matches credentials.",
        "details": {"dob": "18/02/1995", "nationality": "Indian", "gender": "Female", "issueDate": "20/03/2015", "expiryDate": "19/03/2035"},
        "iqa": {"blurScore": 0.05, "glareDetected": False, "passQualityCheck": True},
        "ocr": {"rawText": "INDIAN UNION DRIVING LICENCE\nDL-1220150034\nPOOJA SHARMA",
                "parsedFields": {"Document Type": "Driving Licence", "Document Number": "DL-1220150034", "Full Name": "Pooja Sharma", "Date of Birth": "18/02/1995"},
                "confidenceScores": {"Document Number": 98.9, "Full Name": 98.4, "Date of Birth": 97.2}},
        "forensics": {"tamperDetected": False, "tamperConfidenceScore": 0.08, "anomalyRegions": [], "elaHeatmapBase64": None, "elaFlags": []},
        "biometrics": {"faceMatchScore": 91.2, "verificationStatus": "MATCH_CONFIRMED",
                       "livenessCheck": {"isLive": True, "blinkDetected": True, "minimumEar": 0.15, "padScore": 0.94},
                       "earFrameSeries": [0.31, 0.32, 0.15, 0.16, 0.32, 0.32]},
        "warnings": []
    }
]


def _build_demo_cases():
    demo_cases = deepcopy(SEED_CASES)
    for index in range(582):
        template = deepcopy(SEED_CASES[index % len(SEED_CASES)])
        sequence = index + 1
        day = (index % 31) + 1
        hour = 8 + (index % 10)
        minute = (index * 7) % 60
        status = "Approved" if index % 3 == 0 else "Pending" if index % 3 == 1 else "Rejected"
        template.update({
            "id": f"BR-2026-TEST-{sequence:04d}",
            "date": f"{day} Aug 2026, {hour:02d}:{minute:02d} {'AM' if hour < 12 else 'PM'}",
            "name": f"Test Candidate {sequence:03d}",
            "riskLevel": "Low" if status == "Approved" else "Medium" if status == "Pending" else "High",
            "status": status,
            "reviewNotes": "Generated August test record.",
        })
        demo_cases.append(template)
    return demo_cases


DEMO_CASES = _build_demo_cases()


async def _ensure_seeded():
    """Insert seed cases if the cases collection is empty."""
    try:
        db = get_db()
        col = db["cases"]
        count = await col.count_documents({})
        if count == 0:
            await col.insert_many(DEMO_CASES)
            logger.info("Seeded 586 August demo cases into MongoDB.")
        else:
            test_cursor = col.find({"id": {"$regex": r"^BR-2026-TEST-"}}, {"id": 1})
            existing_test_ids = {doc["id"] async for doc in test_cursor}
            missing_demo_cases = [
                case for case in DEMO_CASES[4:]
                if case["id"] not in existing_test_ids
            ]
            if missing_demo_cases:
                await col.insert_many(missing_demo_cases)
                logger.info("Added %d missing August demo cases to MongoDB.", len(missing_demo_cases))
    except Exception as e:
        logger.warning(f"Seeding skipped: {e}")


# ---------------------------------------------------------------------------
# Cases CRUD
# ---------------------------------------------------------------------------

@router.post("/cases", status_code=201)
async def save_case(payload: SaveCaseRequest):
    """Save a new screening case to MongoDB."""
    await _ensure_seeded()
    db = get_db()
    col = db["cases"]
    doc = payload.model_dump()
    # Upsert by case id
    await col.replace_one({"id": doc["id"]}, doc, upsert=True)
    return {"ok": True, "id": doc["id"]}


@router.get("/cases")
async def list_cases(
    risk: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    """List all cases with optional filters for risk level, status, and name/id search."""
    await _ensure_seeded()
    db = get_db()
    col = db["cases"]

    query: dict = {}
    if risk and risk != "All":
        query["riskLevel"] = risk
    if status and status != "All":
        query["status"] = status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"id": {"$regex": search, "$options": "i"}},
            {"docNo": {"$regex": search, "$options": "i"}},
        ]

    cursor = col.find(query, {"_id": 0}).sort("date", -1)
    cases = await cursor.to_list(length=500)
    return cases


@router.get("/cases/{case_id}")
async def get_case(case_id: str):
    """Retrieve a single case by its ID."""
    await _ensure_seeded()
    db = get_db()
    col = db["cases"]
    doc = await col.find_one({"id": case_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
    return doc


@router.patch("/cases/{case_id}")
async def update_case(case_id: str, payload: UpdateCaseRequest):
    """Update the status, risk level, or review notes of a case."""
    db = get_db()
    col = db["cases"]
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    result = await col.update_one({"id": case_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
    return {"ok": True, "id": case_id, "updated": updates}


# ---------------------------------------------------------------------------
# Legacy orchestration endpoint
# ---------------------------------------------------------------------------

@router.post("/screening/orchestrate", response_model=ScreeningResponse)
async def orchestrate_screening(payload: ScreeningOrchestrateRequest):
    """Aggregate earlier step results and compute final decision."""
    try:
        result = await run_screening(payload.session_id)
        return ScreeningResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
