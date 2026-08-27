"""Risk schema placeholder."""
from pydantic import BaseModel


class RiskResult(BaseModel):
    score: int = 0
