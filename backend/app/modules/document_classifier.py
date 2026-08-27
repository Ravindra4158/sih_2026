"""Replaceable document-type classification boundary.

The initial implementation is deliberately rule-based, using visible OCR labels and
filename hints. It is not an ML classifier and should be replaced by a trained adapter
when one is available.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class DocumentClassification:
    name: str
    confidence: float
    method: str = "rule_based"


class RuleBasedDocumentClassifier:
    """Classify supported Indian identity documents from non-sensitive indicators."""

    KEYWORDS = {
        "aadhaar": ("aadhaar", "uidai", "government of india", "unique identification"),
        "passport": ("passport", "republic of india", "nationality", "p<ind"),
        "pan": ("permanent account number", "income tax department", "pan card"),
        "driving_licence": ("driving licence", "driving license", "licence no", "dl no"),
    }

    def classify(self, text: str = "", filename: str = "") -> DocumentClassification:
        corpus = f"{filename} {text}".lower()
        scores = {kind: sum(keyword in corpus for keyword in keywords) for kind, keywords in self.KEYWORDS.items()}
        document_type, matches = max(scores.items(), key=lambda item: item[1])
        if not matches:
            return DocumentClassification(name="unknown", confidence=0.0)
        return DocumentClassification(name=document_type, confidence=min(0.55 + 0.15 * matches, 0.95))
