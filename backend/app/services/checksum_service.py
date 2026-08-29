import asyncio
import logging
from typing import Dict

logger = logging.getLogger(__name__)

async def validate_checksum(raw_mrz: str) -> Dict:
    """
    Validate ICAO MRZ checksums using the `mrz` library.
    Returns a dict matching ValidateChecksumResponse fields.
    """
    try:
        from mrz.checker.td3 import TD3CodeChecker
        from mrz.checker.td1 import TD1CodeChecker
        from mrz.checker.td2 import TD2CodeChecker
    except ImportError as e:
        logger.warning(f"MRZ dependencies missing: {e}. Returning mock result.")
        return {
            "is_mrz_valid": False,
            "checksum_details": {},
            "flags_raised": ["MRZ_DEPENDENCIES_MISSING"]
        }

    try:
        # Determine the length to choose the correct checker
        mrz_lines = raw_mrz.strip().split('\n')
        mrz_lines = [line.strip() for line in mrz_lines if line.strip()]
        
        checker = None
        if len(mrz_lines) == 2 and len(mrz_lines[0]) == 44:
            checker = TD3CodeChecker(raw_mrz)
        elif len(mrz_lines) == 3 and len(mrz_lines[0]) == 30:
            checker = TD1CodeChecker(raw_mrz)
        elif len(mrz_lines) == 2 and len(mrz_lines[0]) == 36:
            checker = TD2CodeChecker(raw_mrz)
        else:
            return {
                "is_mrz_valid": False,
                "checksum_details": {},
                "flags_raised": ["INVALID_MRZ_FORMAT"]
            }

        is_valid = bool(checker)
        
        # We can extract details from the checker if needed
        # For now, just return valid or invalid based on boolean cast
        flags = []
        if not is_valid:
            flags.append("CHECKSUM_MISMATCH")

        return {
            "is_mrz_valid": is_valid,
            "checksum_details": {},
            "flags_raised": flags
        }

    except Exception as e:
        logger.error(f"Checksum processing failed: {e}")
        return {
            "is_mrz_valid": False,
            "checksum_details": {},
            "flags_raised": ["CHECKSUM_PROCESSING_ERROR"]
        }
