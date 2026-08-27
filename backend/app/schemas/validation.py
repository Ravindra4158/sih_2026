"""Validation schema placeholder."""
from pydantic import BaseModel


class ValidationResult(BaseModel):
    valid: bool = False
