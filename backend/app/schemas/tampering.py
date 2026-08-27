"""Tampering schema placeholder."""
from pydantic import BaseModel


class TamperingResult(BaseModel):
    suspected: bool = False
