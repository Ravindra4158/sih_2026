"""
file_utils.py – Shared helpers for upload validation & PDF→image conversion.

Supported formats: JPEG (.jpg / .jpeg), PNG (.png), PDF (.pdf)
"""
import os
import tempfile
import logging
from fastapi import HTTPException, UploadFile

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Allowed MIME types & extensions
# ---------------------------------------------------------------------------

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
}

# Magic-byte signatures for each supported format
_MAGIC = {
    b"\xff\xd8\xff": "image/jpeg",      # JPEG
    b"\x89PNG\r\n\x1a\n": "image/png",  # PNG
    b"%PDF": "application/pdf",         # PDF
}


def _sniff_mime(header: bytes) -> str | None:
    """Return MIME type by inspecting the first few bytes of a file."""
    for sig, mime in _MAGIC.items():
        if header[: len(sig)] == sig:
            return mime
    return None


def validate_upload(file: UploadFile) -> None:
    """
    Raise HTTPException 415 if the uploaded file is not a supported type.
    Checks both the file extension AND the magic bytes (first 8 bytes).

    Supported: .jpg / .jpeg / .png / .pdf
    """
    # --- Extension check ---
    filename = file.filename or ""
    ext = os.path.splitext(filename)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file extension '{ext}'. "
                f"Accepted formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )

    # --- Magic-byte check (protects against disguised files) ---
    header = file.file.read(8)
    file.file.seek(0)  # rewind so downstream reads the full content

    detected = _sniff_mime(header)
    if detected is None or detected not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                "File content does not match a supported format. "
                "Please upload a valid JPEG, PNG, or PDF file."
            ),
        )


def pdf_to_image_path(pdf_path: str) -> str:
    """
    Convert the first page of a PDF to a temporary PNG file.
    Returns the path to the generated PNG.

    Requires PyMuPDF (fitz), already listed in requirements.txt.
    Renders at 2× zoom (~300 dpi) for better OCR accuracy.
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PDF processing library (PyMuPDF) is not installed.",
        )

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not open PDF: {e}")

    if doc.page_count == 0:
        raise HTTPException(status_code=422, detail="Uploaded PDF has no pages.")

    page = doc[0]
    # Render at 2× zoom for higher resolution (≈300 dpi equivalent)
    mat = fitz.Matrix(2.0, 2.0)
    pix = page.get_pixmap(matrix=mat, alpha=False)

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    pix.save(tmp.name)
    tmp.close()
    doc.close()

    logger.info(f"PDF page 1 converted to image: {tmp.name}")
    return tmp.name


def resolve_image_path(original_path: str, original_filename: str) -> str:
    """
    If the uploaded file is a PDF, convert its first page to a PNG and return
    that path.  For JPEG/PNG, returns the original path unchanged.
    """
    ext = os.path.splitext(original_filename)[-1].lower()
    if ext == ".pdf":
        return pdf_to_image_path(original_path)
    return original_path
