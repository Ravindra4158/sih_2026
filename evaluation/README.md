# Evaluation framework

Use only consented, synthetic, or securely redacted documents. Create labelled records with a known ground-truth label (`genuine`, `suspicious`, or `manipulated`) and a system decision, then call `evaluator.evaluate`.

The framework reports accuracy, precision, recall, F1, false-positive rate, false-negative rate, and confusion-matrix counts. It does not provide any accuracy claim until a documented dataset, split, sampling procedure, and evaluation run exist.

`datasets/` is intentionally empty and reserved for dataset manifests, not identity documents.
