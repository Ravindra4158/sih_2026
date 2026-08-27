"""Synthetic integration tests for the document preprocessing-to-OCR endpoint."""
import asyncio
from io import BytesIO

import httpx
import pymupdf
from PIL import Image

from app.main import app
from app.services.document_processing_service import document_processing_service


def post_process(**kwargs) -> httpx.Response:
    async def send() -> httpx.Response:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://testserver"
        ) as client:
            return await client.post("/api/v1/documents/process", **kwargs)

    return asyncio.run(send())


def png_bytes() -> bytes:
    output = BytesIO()
    Image.new("RGB", (20, 20), "white").save(output, "PNG")
    return output.getvalue()


def text_pdf_bytes(text: str) -> bytes:
    document = pymupdf.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    payload = document.tobytes()
    document.close()
    return payload


def test_process_image_upload_returns_unknown_document() -> None:
    response = post_process(files={"file": ("blank.png", png_bytes(), "image/png")})

    assert response.status_code == 200
    assert response.json()["document_type"]["name"] == "unknown"
    assert response.json()["pages"] == 1


def test_process_text_pdf_extracts_pan_fields() -> None:
    content = "INCOME TAX DEPARTMENT\nPAN CARD\nName: TEST USER\nDOB: 01/01/2000\nABCDE1234F"
    response = post_process(files={"file": ("synthetic-pan.pdf", text_pdf_bytes(content), "application/pdf")})

    assert response.status_code == 200
    payload = response.json()
    assert payload["document_type"]["name"] == "pan"
    assert payload["extracted_data"]["pan_number"]["value"] == "ABCDE1234F"
    assert payload["validation"]["pan_number_format"]["status"] == "passed"


def test_process_rejects_invalid_file() -> None:
    response = post_process(files={"file": ("not-a-document.txt", b"text", "text/plain")})

    assert response.status_code == 415


def test_process_returns_ocr_failure(monkeypatch) -> None:
    class BrokenOcr:
        def extract_text(self, document):
            raise RuntimeError("synthetic OCR failure")

    monkeypatch.setattr(document_processing_service, "ocr_engine", BrokenOcr())
    response = post_process(files={"file": ("blank.png", png_bytes(), "image/png")})

    assert response.status_code == 422
    assert "could not be preprocessed" in response.json()["detail"]
