import logging
from typing import Dict, Any
from app.utils.common import SessionStore

logger = logging.getLogger(__name__)

async def run_screening(session_id: str) -> Dict[str, Any]:
    """
    Run final orchestration by gathering session state from MongoDB and calculating risk.
    """
    try:
        session_data = await SessionStore.get_all(session_id)
        if not session_data:
            return {
                "session_id": session_id,
                "overall_risk_score": 100.0,
                "risk_level": "CRITICAL",
                "screening_summary": "Session not found or expired.",
                "flags_raised": ["SESSION_NOT_FOUND"],
                "recommendation": "REJECT"
            }

        # Retrieve scores from individual endpoints
        ocr_data = session_data.get("ocr", {})
        checksum_data = session_data.get("checksum", {})
        ela_data = session_data.get("forensics", {})
        biometrics_data = session_data.get("biometrics", {})

        flags = []
        risk_score = 0.0

        if not checksum_data.get("is_mrz_valid", False):
            flags.extend(checksum_data.get("flags_raised", ["CHECKSUM_INVALID"]))
            risk_score += 40.0

        if not biometrics_data.get("is_match", False):
            flags.extend(biometrics_data.get("flags_raised", ["FACE_MISMATCH"]))
            risk_score += 40.0

        tampering_prob = ela_data.get("tampering_probability", 0.0)
        if tampering_prob > 0.4:
            flags.extend(ela_data.get("flags_raised", ["HIGH_ELA_DIFFERENTIAL"]))
            risk_score += (tampering_prob * 100)

        # Normalize score
        risk_score = min(risk_score, 100.0)
        
        risk_level = "LOW"
        recommendation = "APPROVE"
        
        if risk_score > 70:
            risk_level = "CRITICAL"
            recommendation = "REJECT"
        elif risk_score > 30:
            risk_level = "MEDIUM"
            recommendation = "MANUAL_REVIEW"

        return {
            "session_id": session_id,
            "overall_risk_score": risk_score,
            "risk_level": risk_level,
            "screening_summary": f"Orchestration complete. Flags: {len(flags)}",
            "flags_raised": flags,
            "recommendation": recommendation
        }

    except Exception as e:
        logger.error(f"Orchestration failed: {e}")
        return {
            "session_id": session_id,
            "overall_risk_score": 100.0,
            "risk_level": "CRITICAL",
            "screening_summary": f"Orchestration Error: {e}",
            "flags_raised": ["ORCHESTRATION_ERROR"],
            "recommendation": "REJECT"
        }
