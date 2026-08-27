"""Swappable OCR-provider interface and Tesseract implementation."""
from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Protocol

import pytesseract
from PIL import Image

from app.modules.ocr.image_preprocessor import ProcessedDocument


@dataclass(frozen=True)
class OCRPageResult:
    page_number: int
    text: str
    confidence: float | None


@dataclass(frozen=True)
class OCRDocumentResult:
    pages: list[OCRPageResult]

    @property
    def text(self) -> str:
        return "\n".join(page.text for page in self.pages)


class OcrEngine(Protocol):
    def extract_text(self, document: ProcessedDocument) -> OCRDocumentResult: ...


class TesseractOcrEngine:
    """Local, open-source OCR implementation; replaceable through ``OcrEngine``."""

    def extract_text(self, document: ProcessedDocument) -> OCRDocumentResult:
        results = []
        for page in document.pages:
            try:
                if page.text_hint:
                    results.append(OCRPageResult(page.page_number, page.text_hint, None))
                    continue
                data = pytesseract.image_to_data(
                    Image.open(BytesIO(page.image_bytes or b"")), output_type=pytesseract.Output.DICT
                )
                text = " ".join(word for word in data["text"] if word.strip())
                confidence_values = [float(value) for value in data["conf"] if float(value) >= 0]
                confidence = sum(confidence_values) / len(confidence_values) / 100 if confidence_values else None
                results.append(OCRPageResult(page.page_number, text, confidence))
            except (OSError, pytesseract.TesseractError) as exc:
                raise RuntimeError(f"OCR failed for page {page.page_number}.") from exc
        return OCRDocumentResult(pages=results)
