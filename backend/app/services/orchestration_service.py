"""
orchestration_service.py – Risk assessment and flag engine.

Policy (never auto-decides):
  • Tampering detected  → risk_level = "High",  flag DOCUMENT_TAMPERING_DETECTED
  • Face not matched    → risk_level = "High",  flag FACE_MISMATCH
  • Liveness failed     → risk_level = "High",  flag LIVENESS_FAILED
  • MRZ invalid         → risk_level = "High",  flag CHECKSUM_INVALID
  • Glare / blur only   → risk_level = "Medium", advisory flags only
  • All clear           → risk_level = "Low"

  final_action is ALWAYS "Pending" — the human officer makes every decision.
"""
import logging
from datetime import datetime
from typing import Dict, Any
from ..utils.common import SessionStore

logger = logging.getLogger(__name__)


async def run_screening(session_id: str) -> Dict[str, Any]:
    """
    Consolidates data from all pipeline steps and produces a risk assessment.
    The AI NEVER sets final_action to Approved or Rejected.
    final_action is always 'Pending' — the human officer decides.
    """
    timestamp = datetime.utcnow().isoformat() + "Z"

    try:
        session_data = await SessionStore.get_all(session_id)
        if not session_data:
            return {
                "session_id": session_id,
                "timestamp": timestamp,
                "overall_risk_score": 0.0,
                "risk_level": "High",
                "final_action": "Pending",
                "summary_flags": ["SESSION_NOT_FOUND: Data unavailable — manual check required."],
                "officer_routing": {"officer": "Rajesh K.", "checkpoint": "Terminal 3"},
            }

        # ── Gather results ─────────────────────────────────────────────────
        ocr_data        = session_data.get("ocr", {})
        checksum_data   = session_data.get("checksum", {})
        ela_data        = session_data.get("forensics", {})
        biometrics_data = session_data.get("biometrics", {})

        flags       = []
        risk_score  = 0.0
        critical    = False   # any critical flag → High Risk

        # ── 1. Document quality (advisory only, not critical) ──────────────
        iqa = ocr_data.get("iqa_metrics", {})
        if iqa.get("glare_detected", False):
            flags.append("GLARE_DETECTED: High glare may have reduced OCR accuracy.")
            risk_score += 12.0

        if iqa.get("blur_score", 0.0) > 0.15:
            flags.append("BLUR_ALERT: Document image is blurry — re-scan recommended.")
            risk_score += 8.0

        # ── 2. MRZ / Checksum integrity ────────────────────────────────────
        if not checksum_data.get("is_mrz_valid", True):
            flags.append("CHECKSUM_INVALID: MRZ checksum mismatch — document may be forged.")
            risk_score += 50.0
            critical = True

        # ── 3. Forensics — ELA tampering detection ─────────────────────────
        tampering_prob = ela_data.get("tampering_probability", 0.0)
        tampering_detected = tampering_prob > 0.4

        if tampering_detected:
            ela_flags = ela_data.get("flags_raised", [])
            flags.append(
                f"DOCUMENT_TAMPERING_DETECTED: ELA confidence {round(tampering_prob * 100, 1)}% "
                f"— digital modification suspected. Officer review required."
            )
            for f in ela_flags:
                if f not in flags:
                    flags.append(f)
            risk_score += min(tampering_prob * 100.0, 50.0)
            critical = True

        # ── 4. Biometric face match ────────────────────────────────────────
        face_mismatch = False
        if biometrics_data:
            is_match   = biometrics_data.get("is_match", True)
            face_score = biometrics_data.get("face_match_score", 100.0)

            if not is_match or face_score < 75.0:
                flags.append(
                    f"FACE_MISMATCH: Biometric similarity {round(face_score, 1)}% "
                    f"is below 75% threshold — traveller identity unconfirmed."
                )
                risk_score += 40.0
                critical = True
                face_mismatch = True

            liveness = biometrics_data.get("liveness_check", {})
            if not liveness.get("is_live", True):
                flags.append("LIVENESS_FAILED: No blink detected — possible photo spoofing.")
                risk_score += 45.0
                critical = True

        # ── 5. Determine risk level (AI never sets final decision) ─────────
        risk_score = min(max(risk_score, 0.0), 100.0)

        if critical:
            risk_level = "High"
        elif risk_score >= 20.0:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # ── AI NEVER DECIDES ───────────────────────────────────────────────
        # final_action is ALWAYS "Pending".
        # The human officer must press Approve or Reject in the dashboard.
        final_action = "Pending"

        # Add a summary recommendation note (not a decision)
        if not flags:
            flags.append("ALL_CHECKS_PASSED: No anomalies detected — awaiting officer clearance.")

        return {
            "session_id": session_id,
            "timestamp": timestamp,
            "overall_risk_score": round(risk_score, 1),
            "risk_level": risk_level,
            "final_action": final_action,   # always "Pending"
            "summary_flags": flags,
            "officer_routing": {
                "officer": "Rajesh K.",
                "checkpoint": "Terminal 3, Alpha",
            },
        }

    except Exception as e:
        logger.error(f"Screening orchestration failed: {e}")
        return {
            "session_id": session_id,
            "timestamp": timestamp,
            "overall_risk_score": 0.0,
            "risk_level": "High",
            "final_action": "Pending",
            "summary_flags": ["ORCHESTRATION_ERROR: System error — manual verification required."],
            "officer_routing": {"officer": "Rajesh K.", "checkpoint": "Terminal 3"},
        }
