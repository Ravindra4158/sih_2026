# Data flow

```text
multipart upload
  → validation (extension, MIME type, signature, size)
  → short-lived request workspace
  → image normalization or multi-page PDF rendering
  → OCR adapter (currently local Tesseract)
  → rule-based document classification
  → document-specific extraction
  → structural format/date/MRZ checks
  → JSON response and frontend display
  → workspace deletion
```

The classifier and OCR engine are interfaces so trained document classifiers or hosted OCR can replace their initial implementations. Field confidence remains `null` because token-level OCR confidence cannot truthfully establish confidence for regex-derived identity fields.

Tampering checks, biometrics, authenticity decisions, and risk scoring remain future stages. Storage, retention, consent, and access policies must be defined before handling any personal data.
