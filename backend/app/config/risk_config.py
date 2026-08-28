"""Prototype risk-policy configuration, not regulatory or calibrated thresholds."""
from dataclasses import dataclass


@dataclass(frozen=True)
class RiskConfig:
    low_max: int = 29
    medium_max: int = 59
    validation_failure_points: int = 15
    validation_failure_cap: int = 30
    face_mismatch_points: int = 45


risk_config = RiskConfig()
