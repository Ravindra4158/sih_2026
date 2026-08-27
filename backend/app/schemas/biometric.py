"""Biometric schema placeholder."""
from pydantic import BaseModel


class BiometricResult(BaseModel):
    verified: bool = False
