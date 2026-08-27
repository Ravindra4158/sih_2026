"""HTTP-level tests for the document upload boundary."""
import asyncio

import httpx

from app.config.settings import settings
from app.main import app


def post_upload(**kwargs) -> httpx.Response:
    """Exercise the ASGI app without relying on an external server."""

    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.post("/api/v1/documents/upload", **kwargs)

    return asyncio.run(send())


def test_upload_valid_png_returns_submission_metadata(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(settings, "upload_temp_dir", str(tmp_path))
    response = post_upload(
        files={"file": ("synthetic-id.png", b"\x89PNG\r\n\x1a\nsynthetic", "image/png")},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["filename"] == "synthetic-id.png"
    assert payload["status"] == "uploaded"
    assert payload["document_id"]
    assert list(tmp_path.iterdir()) == []


def test_upload_rejects_unsupported_file_type() -> None:
    response = post_upload(
        files={"file": ("document.txt", b"invalid", "text/plain")},
    )

    assert response.status_code == 415
    assert response.json()["detail"] == "Only PDF, JPEG, and PNG documents are supported."


def test_upload_rejects_oversized_file(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(settings, "upload_temp_dir", str(tmp_path))
    monkeypatch.setattr(settings, "max_upload_size_bytes", 3)
    response = post_upload(
        files={"file": ("synthetic-id.png", b"\x89PNG\r\n\x1a\nfour", "image/png")},
    )

    assert response.status_code == 413
    assert list(tmp_path.iterdir()) == []


def test_upload_requires_file() -> None:
    response = post_upload()

    assert response.status_code == 422
