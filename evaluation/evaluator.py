"""Evaluate documented risk decisions against a labelled synthetic/redacted set."""
from __future__ import annotations

from .metrics import binary_metrics


def evaluate(records: list[dict[str, object]]) -> dict[str, float | int]:
    """Treat suspicious/high-risk decisions as positive; records need `label` and `decision`."""
    labels = [record["label"] in {"suspicious", "manipulated"} for record in records]
    predictions = [record["decision"] in {"SUSPICIOUS", "HIGH_RISK"} for record in records]
    return binary_metrics(labels, predictions)
