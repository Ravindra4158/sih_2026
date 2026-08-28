"""Synthetic end-to-end tests for the fault-tolerant verification endpoint."""
import asyncio
from io import BytesIO

import httpx
from PIL import Image

from app.main import app
from app.services.verification_history_service import verification_history_service
from app.services.verification_service import verification_service


def verify(**kwargs) -> httpx.Response:
    async def send() -> httpx.Response:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
            return await client.post("/api/v1/verification/documents/verify", **kwargs)

    return asyncio.run(send())


def image_bytes() -> bytes:
    result = BytesIO()
    Image.new("RGB", (40, 40), "white").save(result, "PNG")
    return result.getvalue()


def test_verify_returns_independent_model_results(monkeypatch) -> None:
    monkeypatch.setattr(verification_service.ela, "predict", lambda _image: {"model": "python_ela", "status": "success", "prediction": "ela_signal_generated", "score": None})
    monkeypatch.setattr(verification_service.mrz, "predict", lambda *_args: {"model": "mrz_passport_reader", "status": "skipped", "reason": "passport_required"})
    response = verify(files={"file": ("synthetic.png", image_bytes(), "image/png")})

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "completed"
    assert payload["models"]["python_ela"]["status"] == "success"
    assert payload["models"]["mrz_passport_reader"]["status"] == "skipped"
    assert payload["models"]["deepface"]["reason"] == "selfie_required"
    assert payload["risk"]["score"] == 0
    assert payload["risk"]["decision"] == "UNSUPPORTED_DOCUMENT"


def test_verify_continues_when_a_model_fails(monkeypatch) -> None:
    monkeypatch.setattr(verification_service.ela, "predict", lambda _image: {"model": "python_ela", "status": "error", "error": "synthetic failure"})
    response = verify(files={"file": ("synthetic.png", image_bytes(), "image/png")})

    assert response.status_code == 200
    assert response.json()["models"]["python_ela"]["status"] == "error"
    assert response.json()["risk"]["decision"] == "VERIFICATION_INCOMPLETE"


def test_verify_returns_incomplete_result_when_ocr_processing_fails(monkeypatch) -> None:
    monkeypatch.setattr(verification_service.processing, "process", lambda _document: (_ for _ in ()).throw(ValueError("synthetic OCR failure")))
    response = verify(files={"file": ("synthetic.png", image_bytes(), "image/png")})

    assert response.status_code == 200
    assert response.json()["risk"]["decision"] == "VERIFICATION_INCOMPLETE"


def test_report_returns_saved_verification_metadata() -> None:
    document_id = "synthetic-report"
    verification_history_service.record({"document_id": document_id, "document_type": {"name": "passport"}, "processing": {"status": "completed"}, "ocr": {"status": "success"}, "models": {}, "validation": {}, "risk": {"level": "LOW", "score": 0, "decision": "PASS"}, "explanations": [], "limitations": []})

    async def get_report() -> httpx.Response:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
            return await client.get(f"/api/v1/documents/{document_id}/report")

    report = asyncio.run(get_report())
    assert report.status_code == 200
    assert report.json()["document_id"] == document_id
