"""Dependency-free binary-classification metrics for future labelled evaluations."""
from __future__ import annotations


def binary_metrics(labels: list[bool], predictions: list[bool]) -> dict[str, float | int]:
    if len(labels) != len(predictions) or not labels:
        raise ValueError("Labels and predictions must be non-empty lists of equal length.")
    tp = sum(actual and predicted for actual, predicted in zip(labels, predictions))
    tn = sum(not actual and not predicted for actual, predicted in zip(labels, predictions))
    fp = sum(not actual and predicted for actual, predicted in zip(labels, predictions))
    fn = sum(actual and not predicted for actual, predicted in zip(labels, predictions))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    return {"true_positive": tp, "true_negative": tn, "false_positive": fp, "false_negative": fn, "accuracy": (tp + tn) / len(labels), "precision": precision, "recall": recall, "f1": 2 * precision * recall / (precision + recall) if precision + recall else 0.0, "false_positive_rate": fp / (fp + tn) if fp + tn else 0.0, "false_negative_rate": fn / (fn + tp) if fn + tp else 0.0}
