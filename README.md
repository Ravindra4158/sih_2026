# AI Border Screening

An officer-assist prototype for screening identity-document images. It combines OCR, image-quality checks, machine-readable-code checks, Error Level Analysis (ELA), optional face comparison, and a rule-based risk summary. The React dashboard lets an officer review and manage cases.

This is a demo/prototype for synthetic or otherwise legally authorised material. Its outputs are screening signals, not proof that a document is genuine or that a person’s identity has been verified.

## What is implemented

- Upload JPEG, PNG, or PDF documents. PDFs are rendered from their first page before image processing.
- EasyOCR-based text extraction, document-type heuristics, and field extraction for Aadhaar, PAN, and passport/MRZ-style documents; other inputs are treated as general IDs.
- Image-quality measurements for blur and glare.
- ICAO MRZ checksum validation.
- QR-code and barcode extraction, Aadhaar QR decoding where supported, and OCR-to-QR cross-reference signals.
- Template-style layout checks for Aadhaar, PAN, and passport documents.
- ELA heatmaps, anomaly regions, and EXIF editing-software flags as tampering indicators.
- Document-portrait detection with OpenCV, face comparison using DeepFace when available, and a simple EAR-series blink check.
- Session-based aggregation into low, medium, or high risk. The orchestration endpoint always returns `final_action: "Pending"`; an officer must make any approval or rejection decision.
- MongoDB-backed case CRUD, including four seeded demonstration cases when the `cases` collection is empty.

## Important limitations

- OCR, type detection, layout checks, ELA, liveness, and facial similarity are heuristic/prototype components. They are not calibrated fraud probabilities and can produce false positives and false negatives.
- ELA identifies unusual recompression differences; it does not establish that a document has been altered. It is especially limited for PNG images.
- Blink liveness is derived only from the EAR values supplied by the client. It is not a complete presentation-attack-detection solution.
- DeepFace may download or initialise model assets on first use. If DeepFace is unavailable, the current backend falls back to a heuristic result and marks it with `BIOMETRICS_HEURISTIC_MODE`.
- There is no authentication, authorization, rate limiting, malware scanning, encrypted-at-rest document storage, government/watchlist integration, or audit-grade retention policy.
- OCR results and uploaded document images are written to the session store, and cases can contain base64 document/live images. Do not use real personal or biometric data without an appropriate legal, security, and retention design.

## Architecture

```text
React/Vite dashboard
        |
        v
FastAPI API (`/api/v1`)
        |
        +-- Document OCR / quality / layout / MRZ / QR checks
        +-- ELA forensics
        +-- Face match and EAR-based blink signal
        +-- Risk orchestration (officer decision remains pending)
        |
        v
MongoDB (`border_screening` database): sessions and cases
```

## Repository layout

- `frontend/` — React and Vite officer dashboard.
- `backend/app/` — FastAPI routes, services, Pydantic models, MongoDB access, and utilities.
- `ml/` — preprocessing, training, and evaluation scripts/notes.
- `scripts/` — dataset and pipeline utility scripts.
- `docs/` — design, security, API, research, and hackathon notes. Some documents describe earlier iterations; the source routes below and Swagger are the current API reference.

## Prerequisites

- Python 3.11 or later.
- Node.js and npm for the frontend.
- MongoDB reachable at `MONGODB_URI`, or a local MongoDB instance at `mongodb://localhost:27017`.
- System packages required by the OCR/barcode stack: Tesseract, ZBar, and OpenCV runtime libraries. On Debian/Ubuntu:

```bash
sudo apt-get install tesseract-ocr libzbar0 libgl1 libglib2.0-0
```

The backend requirements include DeepFace, TensorFlow/Keras, EasyOCR, PyTorch-dependent components, and MongoDB drivers. Installation can therefore be sizeable.

## Run locally

Create a virtual environment and install the full backend requirement set:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Set a MongoDB connection string if the database is not running locally:

```bash
export MONGODB_URI='mongodb://localhost:27017'
```

Start the API from the repository root:

```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

In another terminal, start the dashboard:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). The frontend defaults to `http://localhost:8000/api/v1`; set `VITE_API_BASE_URL` before starting Vite to use another API location.

Interactive API documentation is available at `http://localhost:8000/swagger`.

### Configuration

| Variable | Default | Used by |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://localhost:27017` fallback | MongoDB connection for sessions and cases |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Frontend API base URL |
| `APP_NAME` | `AI-Based Fake Identity & Document Screening System` | Settings object |
| `ENVIRONMENT` | `development` | Settings object |
| `LOG_LEVEL` | `INFO` | Settings object |
| `API_PREFIX` | `/api/v1` | Settings object; routes currently use `/api/v1` directly in `main.py` |
| `MAX_UPLOAD_SIZE_BYTES` | `10485760` | Settings object; upload routes currently validate type/signature but do not enforce this value |
| `UPLOAD_TEMP_DIR` | `/tmp/ai-border-screening-uploads` | Settings object; routes currently use the system temporary directory |

`backend/app/database/mongodb.py` loads `MONGODB_URI` from the environment first and otherwise searches upward for a root `.env` file. Never commit credentials or real identity data.

## API overview

All routes below are prefixed with `/api/v1` and are defined in `backend/app/api/v1/`.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/document/process-ocr` | Upload `image_file`; run OCR, image-quality checks, document detection, and field extraction. Accepts optional `session_id` and `document_hint`. |
| `POST` | `/document/validate-layout` | Upload `image_file`; check a document layout. Accepts optional `session_id` and `document_type`. |
| `POST` | `/document/verify-machine-readable` | Upload `image_file`; inspect MRZ, barcode/QR data, Aadhaar QR, and cross-reference signals. |
| `POST` | `/document/validate-checksum` | Validate supplied MRZ text for a supplied `session_id`. |
| `POST` | `/document/detect-face` | Upload `image_file`; return an OpenCV portrait crop or a document-layout fallback crop. |
| `POST` | `/forensics/ela-analysis` | Upload `image_file`; return ELA signal, heatmap, and anomaly regions. |
| `POST` | `/biometrics/verify-match` | Compare supplied document and live-capture base64 images for a session. |
| `POST` | `/biometrics/verify-by-id` | Load a document image from a case/session and compare it with a supplied live capture. |
| `POST` | `/screening/orchestrate` | Consolidate stored session signals into a risk summary; never makes a final officer decision. |
| `POST` | `/cases` | Create or replace a case by ID. |
| `GET` | `/cases` | List cases; supports `risk`, `status`, and `search` query filters. |
| `GET` | `/cases/{case_id}` | Retrieve a case. |
| `PATCH` | `/cases/{case_id}` | Update a case’s status, risk level, or review notes. |

Document upload endpoints accept `.jpg`, `.jpeg`, `.png`, and `.pdf`; extension and magic bytes are checked. The current implementation processes only the first PDF page. Use `image_file` for multipart uploads, not `file`.

Example OCR request:

```bash
curl -X POST \
  -F 'image_file=@path/to/synthetic-document.jpg' \
  'http://localhost:8000/api/v1/document/process-ocr?document_hint=AUTO'
```

The service does not currently expose the legacy `/health`, `/documents/upload`, `/documents/process`, or `/verification/documents/verify` routes described by older documentation.

## Containers and tests

The root `Dockerfile` builds the backend and starts it on port 8000. The present `docker-compose.yml` refers to `deployment/Dockerfile.backend` and `deployment/Dockerfile.frontend`, which are not in this repository, so `docker compose up --build` is not currently a working setup.

`pyproject.toml` defines a `dev` extra with pytest, HTTPX, and Ruff, but there is no `tests/` directory in the current checkout. Add representative synthetic-only tests before treating this prototype as production-ready.

## Data handling

Use only synthetic data or data for which you have a clear legal basis and explicit operational approval. Never commit identity documents, face images, credentials, production database URIs, or other personal data. See `docs/security/` for project security notes.
