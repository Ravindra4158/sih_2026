"""Document-specific, best-effort field extraction from OCR text."""
from __future__ import annotations

import re

FieldMap = dict[str, dict[str, object]]


def _field(value: str | None, page: int = 1) -> dict[str, object] | None:
    if not value:
        return None
    # Field confidence is intentionally unavailable: token OCR confidence cannot
    # reliably be attributed to regex-derived fields.
    return {"value": value.strip(), "confidence": None, "source": {"page": page}}


def _match(pattern: str, text: str, flags: int = re.IGNORECASE) -> str | None:
    found = re.search(pattern, text, flags)
    return found.group(1).strip() if found else None


class DocumentFieldExtractor:
    """Extract only fields supported by the detected document type."""

    def extract(self, document_type: str, text: str) -> FieldMap:
        extractors = {
            "aadhaar": self._aadhaar,
            "passport": self._passport,
            "pan": self._pan,
            "driving_licence": self._driving_licence,
        }
        return extractors.get(document_type, lambda _: {})(text)

    def _aadhaar(self, text: str) -> FieldMap:
        return self._without_missing(
            name=_field(_match(r"(?:name)\s*[:\-]?\s*([A-Z][A-Z .]{2,})", text)),
            date_of_birth=_field(_match(r"(?:dob|year of birth)\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4}|\d{4})", text)),
            gender=_field(_match(r"\b(MALE|FEMALE|OTHER)\b", text)),
            aadhaar_number=_field(_match(r"\b(\d{4}\s?\d{4}\s?\d{4})\b", text)),
            address=_field(_match(r"(?:address)\s*[:\-]?\s*(.+)", text)),
        )

    def _passport(self, text: str) -> FieldMap:
        mrz = "\n".join(line for line in text.splitlines() if "<" in line and len(line) >= 30)
        return self._without_missing(
            surname=_field(_match(r"(?:surname)\s*[:\-]?\s*([A-Z .'-]+)", text)),
            given_name=_field(_match(r"(?:given name|given names)\s*[:\-]?\s*([A-Z .'-]+)", text)),
            passport_number=_field(
                _match(r"(?:passport number|passport no)\s*[:\-]?\s*([A-Z][0-9]{7})", text)
                or _match(r"\b([A-Z][0-9]{7})\b", text)
            ),
            nationality=_field(_match(r"(?:nationality)\s*[:\-]?\s*([A-Z]{3}|INDIAN)", text)),
            date_of_birth=_field(_match(r"(?:date of birth|dob)\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4})", text)),
            sex=_field(_match(r"(?:sex)\s*[:\-]?\s*([MFX])\b", text)),
            expiry_date=_field(_match(r"(?:date of expiry|expiry date)\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4})", text)),
            mrz=_field(mrz),
        )

    def _pan(self, text: str) -> FieldMap:
        return self._without_missing(
            name=_field(_match(r"(?:name)\s*[:\-]?\s*([A-Z][A-Z .]{2,})", text)),
            father_name=_field(_match(r"(?:father'?s name)\s*[:\-]?\s*([A-Z][A-Z .]{2,})", text)),
            date_of_birth=_field(_match(r"(?:date of birth|dob)\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4})", text)),
            pan_number=_field(_match(r"\b([A-Z]{5}\d{4}[A-Z])\b", text)),
        )

    def _driving_licence(self, text: str) -> FieldMap:
        return self._without_missing(
            name=_field(_match(r"(?:name)\s*[:\-]?\s*([A-Z][A-Z .]{2,})", text)),
            date_of_birth=_field(_match(r"(?:date of birth|dob)\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4})", text)),
            licence_number=_field(_match(r"(?:licence no|license no|dl no)\s*[:\-]?\s*([A-Z0-9/-]{8,})", text)),
            validity=_field(_match(r"(?:valid(?:ity)?(?: till| up to)?)\s*[:\-]?\s*(\d{2}[/-]\d{2}[/-]\d{4})", text)),
            address=_field(_match(r"(?:address)\s*[:\-]?\s*(.+)", text)),
            vehicle_class=_field(_match(r"(?:class(?: of vehicle)?)\s*[:\-]?\s*([A-Z0-9, /-]+)", text)),
        )

    @staticmethod
    def _without_missing(**fields: dict[str, object] | None) -> FieldMap:
        return {name: value for name, value in fields.items() if value is not None}
