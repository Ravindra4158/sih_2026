import logging
import base64
from typing import Dict, Any

logger = logging.getLogger(__name__)

def decode_aadhaar_qr(raw_qr_data: str) -> Dict[str, Any]:
    """
    Attempts to decode a Secure Aadhaar QR code binary string.
    Returns structured demographic data and a base64 encoded photo if present.
    """
    result = {
        "is_valid_aadhaar_qr": False,
        "demographics": {},
        "photo_base64": None,
        "error": None
    }
    
    try:
        from pyaadhaar.decode import AadhaarSecureQr
        
        # Determine if data is old XML or new Secure QR (integer sequence)
        if raw_qr_data.isdigit():
            # --- Custom V5 parsing block ---
            is_v5 = False
            try:
                import binascii
                import gzip
                import io
                
                qr_data_int = int(raw_qr_data)
                hex_data = hex(qr_data_int)[2:]
                if len(hex_data) % 2 != 0:
                    hex_data = '0' + hex_data
                byte_data = binascii.unhexlify(hex_data)
                
                decompressed_array = None
                for i in range(len(byte_data)):
                    try:
                        if byte_data[i:i+2] == b'\x1f\x8b':
                            buf = io.BytesIO(byte_data[i:])
                            with gzip.GzipFile(fileobj=buf) as f:
                                decompressed_array = f.read()
                            break
                    except Exception:
                        pass
                
                if decompressed_array and decompressed_array.startswith(b'V'):
                    parts = decompressed_array.split(b'\xff')
                    # Standard format: V5\xff... or similar
                    if len(parts) > 17:
                        result["is_valid_aadhaar_qr"] = True
                        result["demographics"]["name"] = parts[3].decode('utf-8', errors='ignore')
                        result["demographics"]["dob"] = parts[4].decode('utf-8', errors='ignore')
                        result["demographics"]["gender"] = parts[5].decode('utf-8', errors='ignore')
                        result["demographics"]["uid_masked"] = parts[17].decode('utf-8', errors='ignore')
                        # Construct a basic address from available parts
                        addr_parts = []
                        for idx in [6, 16, 12, 15, 13, 11]:
                            if len(parts) > idx and parts[idx]:
                                addr_parts.append(parts[idx].decode('utf-8', errors='ignore'))
                        result["demographics"]["address"] = ", ".join(addr_parts).strip(", ")
                        is_v5 = True
            except Exception as e:
                logger.warning(f"V5 custom parsing failed: {e}")
                
            if is_v5:
                return result
            # --- End Custom V5 parsing block ---
            
            # Fallback to pyaadhaar if not V5
            qr_obj = AadhaarSecureQr(int(raw_qr_data))
            decoded = qr_obj.decodeddata()
            
            result["is_valid_aadhaar_qr"] = True
            
            # The pyaadhaar library returns a dict with demographic keys
            # and a 'image' key containing bytes of the JPEG2000 image.
            
            if "name" in decoded:
                result["demographics"]["name"] = decoded.get("name")
            if "dob" in decoded:
                result["demographics"]["dob"] = decoded.get("dob")
            if "gender" in decoded:
                result["demographics"]["gender"] = decoded.get("gender")
            if "uid" in decoded:
                result["demographics"]["uid_masked"] = decoded.get("uid") # Last 4 digits
                
            # Handle Address
            addr_parts = [decoded.get(k) for k in ["house", "street", "lm", "loc", "vtc", "po", "dist", "subdist", "state", "pc"] if decoded.get(k)]
            if addr_parts:
                result["demographics"]["address"] = ", ".join(addr_parts)

            # Handle Photo
            if "image" in decoded and decoded["image"]:
                try:
                    # image is jpeg2000 bytes. Convert directly to base64 for the frontend
                    b64_img = base64.b64encode(decoded["image"]).decode('utf-8')
                    result["photo_base64"] = f"data:image/jp2;base64,{b64_img}"
                except Exception as e:
                    logger.warning(f"Failed to encode Aadhaar QR image: {e}")
                    
        elif "<PrintLetterBarcodeData" in raw_qr_data:
            # Old XML format
            from pyaadhaar.decode import AadhaarOldQr
            qr_obj = AadhaarOldQr(raw_qr_data)
            decoded = qr_obj.decodeddata()
            
            result["is_valid_aadhaar_qr"] = True
            result["demographics"] = {
                "name": decoded.get("name"),
                "dob": decoded.get("dob"),
                "gender": decoded.get("gender"),
                "uid_masked": decoded.get("uid"),
                "address": f"{decoded.get('lm', '')} {decoded.get('loc', '')} {decoded.get('dist', '')} {decoded.get('state', '')}".strip()
            }
        else:
            result["error"] = "Data format is not recognized as a valid Aadhaar QR."

    except ImportError:
        result["error"] = "pyaadhaar or pylibjpeg is not installed."
        logger.error(result["error"])
    except Exception as e:
        result["error"] = str(e)
        logger.error(f"Failed to decode Aadhaar QR: {e}")
        
    return result
