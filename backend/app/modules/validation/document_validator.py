"""Structural validation signals only; never a document-authenticity decision."""
from __future__ import annotations

import re
from datetime import date, datetime


def _value(fields: dict[str, dict[str, object]], name: str) -> str | None:
    field = fields.get(name)
    return str(field["value"]) if field and field.get("value") else None


def _date_status(value: str | None, must_not_expire: bool = False) -> dict[str, object]:
    if not value:
        return {"status": "not_available"}
    for pattern in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            parsed = datetime.strptime(value, pattern).date()
            return {"status": "passed" if not must_not_expire or parsed >= date.today() else "failed"}
        except ValueError:
            continue
    return {"status": "failed", "reason": "Unrecognised date format"}


class DocumentValidator:
    """Provide basic format, date, and required-field validation signals."""

    def validate(self, document_type: str, fields: dict[str, dict[str, object]]) -> dict[str, object]:
        checks: dict[str, object] = {}
        if document_type == "aadhaar":
            checks["aadhaar_number_format"] = self._format(_value(fields, "aadhaar_number"), r"\d{4}\s?\d{4}\s?\d{4}")
            checks["date_of_birth"] = _date_status(_value(fields, "date_of_birth"))
        elif document_type == "pan":
            checks["pan_number_format"] = self._format(_value(fields, "pan_number"), r"[A-Z]{5}\d{4}[A-Z]")
            checks["date_of_birth"] = _date_status(_value(fields, "date_of_birth"))
        elif document_type == "passport":
            checks["passport_number_format"] = self._format(_value(fields, "passport_number"), r"[A-Z0-9]{8,9}")
            checks["expiry_date"] = _date_status(_value(fields, "expiry_date"), must_not_expire=True)
            checks["mrz_structure"] = self._mrz(_value(fields, "mrz"))
        elif document_type == "driving_licence":
            checks["licence_number_format"] = self._format(_value(fields, "licence_number"), r"[A-Z0-9/-]{8,}")
            checks["validity"] = _date_status(_value(fields, "validity"), must_not_expire=True)
        checks["required_fields"] = {"status": "passed" if fields else "failed"}
        return checks

    @staticmethod
    def _format(value: str | None, pattern: str) -> dict[str, object]:
        if not value:
            return {"status": "not_available"}
        return {"status": "passed" if re.fullmatch(pattern, value.replace(" ", "")) else "failed"}

    @staticmethod
    def _mrz(value: str | None) -> dict[str, object]:
        if not value:
            return {"status": "not_available"}
        lines = value.splitlines()
        return {"status": "passed" if len(lines) >= 2 and all(len(line) >= 30 for line in lines) else "failed"}
