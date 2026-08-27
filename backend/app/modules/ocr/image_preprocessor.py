"""Image and PDF preparation for downstream OCR providers."""
from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

import pymupdf
from PIL import Image, ImageEnhance, ImageFilter, ImageOps


@dataclass(frozen=True)
class ProcessedPage:
    page_number: int
    image_bytes: bytes | None
    text_hint: str = ""
    operations: tuple[str, ...] = ()


@dataclass(frozen=True)
class ProcessedDocument:
    pages: list[ProcessedPage]


class DocumentPreprocessor:
    """Normalize uploaded images and render every PDF page at OCR-friendly resolution."""

    def preprocess_document(self, path: Path, content_type: str) -> ProcessedDocument:
        if content_type == "application/pdf":
            return self._preprocess_pdf(path)
        return ProcessedDocument(pages=[self._preprocess_image(Image.open(path), 1)])

    def _preprocess_pdf(self, path: Path) -> ProcessedDocument:
        document = pymupdf.open(path)
        try:
            if document.page_count == 0:
                raise ValueError("The PDF contains no pages.")
            pages = []
            for index, page in enumerate(document):
                pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
                image = Image.open(BytesIO(pixmap.tobytes("png")))
                processed = self._preprocess_image(image, index + 1)
                pages.append(
                    ProcessedPage(
                        page_number=processed.page_number,
                        image_bytes=processed.image_bytes,
                        text_hint=page.get_text("text").strip(),
                        operations=("pdf_render_144dpi", *processed.operations),
                    )
                )
            return ProcessedDocument(pages=pages)
        finally:
            document.close()

    @staticmethod
    def _preprocess_image(image: Image.Image, page_number: int) -> ProcessedPage:
        image = ImageOps.exif_transpose(image).convert("L")
        image.thumbnail((2200, 2200))
        # Median filtering removes isolated noise; contrast normalization improves OCR.
        image = image.filter(ImageFilter.MedianFilter(size=3))
        image = ImageOps.autocontrast(ImageEnhance.Contrast(image).enhance(1.4))
        output = BytesIO()
        image.save(output, format="PNG", optimize=True)
        return ProcessedPage(
            page_number=page_number,
            image_bytes=output.getvalue(),
            operations=("exif_rotation", "resize", "median_noise_reduction", "contrast_normalization"),
        )
