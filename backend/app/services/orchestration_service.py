"""
orchestration_service.py – Risk scoring and final orchestration engine.
Gathers OCR, forensics, checksum, and biometric verification results from session storage,
calculates final risk indicators, and generates a routing decision.
"""
import logging
from datetime import datetime
from typing import Dict, Any
from ..utils.common import SessionStore

logger = logging.getLogger(__name__)

async def run_screening(session_id: str) -> Dict[str, Any]:
    """
    Consolidates data from previous steps and issues a final risk rating and decision.
    """
    timestamp = datetime.utcnow().isoformat() + "Z"
    try:
        session_data = await SessionStore.get_all(session_id)
        if not session_data:
            return {
                "session_id": session_id,
                "timestamp": timestamp,
                "overall_risk_score": 100.0,
                "risk_level": "CRITICAL",
                "final_action": "REJECT",
                "summary_flags": ["SESSION_NOT_FOUND"],
                "officer_routing": {"officer": "Rajesh K.", "checkpoint": "Terminal 3"}
            }

        # Gather results from session store
        ocr_data = session_data.get("ocr", {})
        checksum_data = session_data.get("checksum", {})
        ela_data = session_data.get("forensics", {})
        biometrics_data = session_data.get("biometrics", {})

        flags = []
        risk_score = 0.0

        # OCR Image Quality check
        iqa = ocr_data.get("iqa_metrics", {})
        if iqa.get("glare_detected", False):
            flags.append("GLARE_DETECTED")
            risk_score += 15.0
        if iqa.get("blur_score", 0.0) > 0.15:
            flags.append("BLUR_ALERT")
            risk_score += 10.0

        # Checksum check
        if not checksum_data.get("is_mrz_valid", True):
            flags.extend(checksum_data.get("flags_raised", ["CHECKSUM_INVALID"]))
            risk_score += 45.0

        # Forensics (ELA) check
        tampering_prob = ela_data.get("tampering_probability", 0.0)
        if tampering_prob > 0.4:
            flags.extend(ela_data.get("flags_raised", ["HIGH_ELA_DIFFERENTIAL"]))
            risk_score += (tampering_prob * 100.0)

        # Biometrics verification
        if biometrics_data:
            is_match = biometrics_data.get("is_match", True)
            face_score = biometrics_data.get("face_match_score", 100.0)
            
            # If mismatch or face score is low
            if not is_match or face_score < 75.0:
                flags.append("FACE_MISMATCH")
                risk_score += 45.0
            
            liveness = biometrics_data.get("liveness_check", {})
            if not liveness.get("is_live", True):
                flags.append("LIVENESS_FAILED")
                risk_score += 50.0

        # Normalize risk score
        risk_score = min(max(risk_score, 0.0), 100.0)
        
        # Risk level assessment
        risk_level = "Low"
        final_action = "Approved"
        
        if risk_score >= 70.0:
            risk_level = "High"
            final_action = "Rejected"
        elif risk_score >= 30.0:
            risk_level = "Medium"
            final_action = "Pending"

        return {
            "session_id": session_id,
            "timestamp": timestamp,
            "overall_risk_score": round(risk_score, 1),
            "risk_level": risk_level,
            "final_action": final_action,
            "summary_flags": flags,
            "officer_routing": {
                "officer": "Rajesh K.",
                "checkpoint": "Terminal 3, Alpha"
            }
        }

    except Exception as e:
        logger.error(f"Screening orchestration failed: {e}")
        return {
            "session_id": session_id,
            "timestamp": timestamp,
            "overall_risk_score": 100.0,
            "risk_level": "High",
            "final_action": "Rejected",
            "summary_flags": ["ORCHESTRATION_ERROR"],
            "officer_routing": {"officer": "Rajesh K.", "checkpoint": "Terminal 3"}
        }
