# AI-Based Fake Identity & Document Screening System

A modular hackathon MVP scaffold for reviewing identity documents. It is designed to grow into a production-grade system without claiming unimplemented integrations or verification capabilities.

## Current working flow

```text
React/Vite upload form → `POST /api/v1/documents/process` → validation → preprocessing → OCR → rule-based type detection → field extraction → structural validation → JSON result in the browser
```

The implementation accepts a single PDF, JPEG, or PNG document (10 MB maximum by default), validates its metadata and signature, uses short-lived temporary storage, then returns available extracted fields. Documents are not retained. It supports Aadhaar, passport, PAN, driving licence, and `unknown` classification. Type detection is currently rule-based—not an AI model.

## Processing pipeline

```text
Document
   ↓
File validation
   ↓
PDF rendering / image normalization
   ↓
Tesseract OCR
   ↓
Rule-based document type detection
   ↓
Document-specific field extraction
   ↓
Structural validation signals
   ↓
Future authenticity, biometric, and risk stages
```

## Current MVP scope

Tesseract OCR, PyMuPDF PDF rendering, rule-based classification, field extraction, and format/date validation are implemented. Tampering detection, face verification, government verification, watchlists, risk scoring, and all external AI-model integrations are not implemented in this phase.

## Layout

- `frontend/` — React/Vite officer dashboard placeholders.
- `backend/` — FastAPI API, domain modules, and future persistence/integration boundaries.
- `ml/` — dataset guidance, preprocessing, training, and evaluation placeholders.
- `data/` — synthetic and legally obtained sample-data locations only.

Never add real Aadhaar, passports, biometric samples, credentials, or other personal data. Use only synthetic or legally obtained data.

## Project layout

- `frontend/` — React/Vite upload interface and API client.
- `backend/app/api/routes/` — FastAPI HTTP endpoints.
- `backend/app/services/document_service.py` — upload validation and temporary-file lifecycle.
- `backend/app/services/document_processing_service.py` — orchestration only; stages remain independent.
- `backend/app/modules/ocr/` — preprocessing, swappable OCR adapter, and document-specific extraction.
- `backend/app/modules/document_classifier.py` — replaceable, initial rule-based classifier.
- `backend/app/modules/validation/` — non-authenticity structural validation signals.
- `tests/` — unit and integration tests using only mock/synthetic file data.
- `ml/` — dataset guidance, preprocessing, training, and evaluation placeholders.

## Configuration

The backend reads environment variables (or a root `.env` file). Defaults are safe for local development:

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_PREFIX` | `/api/v1` | API route prefix |
| `MAX_UPLOAD_SIZE_BYTES` | `10485760` | Maximum accepted upload size |
| `UPLOAD_TEMP_DIR` | `/tmp/ai-border-screening-uploads` | Short-lived upload workspace |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Permitted frontend origins |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Frontend backend URL |

Do not put credentials or real identity documents in `.env`, source control, or test fixtures.

## Start development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
uvicorn app.main:app --app-dir backend --reload
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173`). The frontend uploads to `http://localhost:8000/api/v1` unless `VITE_API_BASE_URL` is set.

## API

`POST /api/v1/documents/upload` accepts multipart form data with a `file` field.

```bash
curl -F 'file=@path/to/synthetic-id.png;type=image/png' \
  http://localhost:8000/api/v1/documents/upload
```

It returns `201 Created` with `document_id`, sanitized `filename`, and `status: "uploaded"`. See [the API specification](docs/api/api-specification.md) for error responses.

`POST /api/v1/documents/process` accepts the same form data and runs the processing pipeline:

```bash
curl -F 'file=@path/to/synthetic-pan.pdf;type=application/pdf' \
  http://localhost:8000/api/v1/documents/process
```

It returns document type, processed page count, OCR page text, extracted fields, and structural validation signals. `confidence: null` on extracted fields is intentional: Tesseract token confidence is not reliable field-level evidence.

Image preparation corrects EXIF orientation, resizes, applies median noise reduction, and normalizes contrast. Automatic perspective correction is not yet available because no reliable corner-detection model has been integrated; this is intentionally reported as a limitation rather than silently claiming correction.

## Development workflow

1. Start the backend, then the frontend.
2. Upload only synthetic, dummy, or legally usable sample documents.
3. Add later pipeline stages behind their existing modular service/module boundaries; do not make the upload controller perform OCR or model inference.

## Tests

```bash
pytest
```

The tests cover upload validation, temporary-file cleanup, image/PDF processing, OCR failures, unknown documents, Aadhaar/passport/PAN extraction, and date/number validation with synthetic data.

Or run the development containers:

```bash
docker compose up --build
```
