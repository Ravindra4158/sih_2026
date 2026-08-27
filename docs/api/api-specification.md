# API specification

## `GET /api/v1/health`

Returns `{"status": "ok"}` for service liveness.

## `POST /api/v1/documents/upload`

Accepts one `multipart/form-data` field named `file`. JPEG, PNG, and PDF uploads are accepted up to 10 MB by default. The backend validates the file metadata and signature, writes it only to short-lived temporary storage while validating it, then removes that temporary file.

Successful response (`201 Created`):

```json
{
  "document_id": "b8d55085-1fb0-4d50-9f06-794a5d39e0fb",
  "filename": "synthetic-id.png",
  "status": "uploaded"
}
```

Errors include `415` for unsupported file types, `413` for an upload over the configured size limit, and `422` when `file` is missing.

## `POST /api/v1/documents/process`

Accepts the same `file` form field and runs: preprocessing, local OCR, rule-based document classification, document-specific field extraction, and structural validation. It does **not** decide whether a document is genuine.

Successful response (`200 OK`, abbreviated):

```json
{
  "document_id": "b8d55085-1fb0-4d50-9f06-794a5d39e0fb",
  "filename": "synthetic-pan.pdf",
  "document_type": {"name": "pan", "confidence": 0.85, "method": "rule_based"},
  "pages": 1,
  "ocr": {"status": "success", "pages": []},
  "extracted_data": {"pan_number": {"value": "ABCDE1234F", "confidence": null, "source": {"page": 1}}},
  "validation": {"pan_number_format": {"status": "passed"}}
}
```

Returns `422` when a valid upload cannot be preprocessed or OCR cannot read it. A classifier result of `unknown` is a successful processing result, not an error.
