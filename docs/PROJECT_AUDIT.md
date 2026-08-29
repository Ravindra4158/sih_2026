# Project Audit

Date: 2026-08-28
Scope: repository inspection plus executed backend tests and frontend production build.

## Status Matrix

| Feature | Status | Evidence and problems |
|---|---|---|
| Upload | COMPLETE | FastAPI multipart upload validates extension, MIME, magic signature, size, empty files, sanitized filename, and cleans temporary files. Covered by tests. |
| OCR | PARTIAL | Tesseract and PDF text extraction work in tests; OCR provider availability is not independently probed and confidence is not field-level. |
| Document classification | PARTIAL | Rule-based keyword classifier works for supported labels, but is not an AI classifier and is vulnerable to weak/absent OCR evidence. |
| Model 1: Python-ELA | COMPLETE | Pillow-based ELA adapter executes and explicitly returns an inspection signal, not a tampering probability. |
| Model 2: MRZ Passport Reader | PARTIAL | Adapter is wired and skips non-passports; optional EasyOCR/TFLite weights/runtime were not available in the audit environment. |
| Model 3: DeepFace | PARTIAL | Adapter is wired for passport portrait/selfie comparison; optional DeepFace runtime/model weights were not available in the audit environment. |
| Face verification | PARTIAL | Correct match/mismatch/not-applicable states are represented, but only applies when the MRZ adapter supplies a face crop. |
| Validation | COMPLETE | Supported document number/date/MRZ structural checks execute; these are not authenticity checks. |
| Risk scoring | PARTIAL | Configurable deterministic scoring handles validation failures, expiry, unavailable stages, unknown type, and face mismatch. It intentionally does not turn ELA/OCR confidence into fraud probability. Calibration and broader consistency signals are missing. |
| Explainable results | COMPLETE | Results separate model outputs, validation signals, risk decision, explanations, and limitations. |
| Verification history | PARTIAL | Metadata-only in-memory list/detail/report endpoints now exist. Data is lost on restart and is not suitable for production persistence. |
| Report generation | PARTIAL | JSON report exists and carries a disclaimer; PDF/export and durable storage are missing. |
| Frontend | PARTIAL | Upload, selfie selection, result, model/validation/error display build successfully. Drag/drop, staged progress, history view, and polished dashboard behavior are incomplete in the reachable `App.jsx`. |
| Backend | COMPLETE | FastAPI app routes upload, processing, verification, report, history, and liveness/readiness health. Placeholder cases/screenings remain. |
| Testing | PARTIAL | 27 baseline tests passed; one new health compatibility failure was found and fixed, then must be rerun. No frontend test runner or model integration fixtures are configured. |
| Security | PARTIAL | Upload controls, signature checks, generated paths, cleanup, and no raw history storage are present. Authentication, authorization, rate limiting, malware scanning, and durable secret management are absent. |
| Documentation | PARTIAL | README and API docs existed but described the project as pre-model integration; this audit and knowledge graph update that status. |
| Configuration | PARTIAL | Settings and `.env.example` cover core limits and CORS; risk thresholds, model paths, timeouts, and health behavior are not fully environment-configurable. |
| Deployment | PARTIAL | Dockerfiles and Compose exist, but Compose uses demo database credentials and no production auth/secret strategy. |

## Verified Checks

- Backend baseline: `27 passed` before the audit changes.
- Frontend: `npm run build` passed.
- Post-change backend run found and fixed the stale exact health assertion; rerun is required after that fix.
- No real identity documents or personal information were used.

## Priority Backlog

### P0 - Critical

- Persist metadata history in a protected database with retention and access control.
- Add explicit per-stage timeout/error envelopes and stage timing data to the public verification response.
- Make model readiness and inference failure visible in the frontend without implying authenticity.
- Add API tests for health, history list/detail, invalid uploads, and report not-found behavior.

### P1 - Important

- Add drag/drop, staged progress, result panels, and a history table to the reachable frontend route.
- Add calibrated/documented consistency signals and configurable risk weights after a representative evaluation set exists.
- Add synthetic fixtures for each adapter and optional-runtime integration tests.
- Add authentication, rate limiting, structured redacted logs, and production secret handling.
- Generate downloadable JSON/PDF reports with the same disclaimer.

### P2 - Nice to Have

- Demo mode selector limited to labelled synthetic samples.
- Perspective correction and better field-level OCR confidence.
- Background job processing and queueing after measured latency justifies it.
- Frontend unit/e2e tests and accessibility review.

## Model Limitations

Python-ELA is a visual recompression signal. MRZ Reader provides MRZ/OCR/face-crop evidence only for passports. DeepFace provides a model-threshold comparison and distance, not identity certainty. None of the three proves authenticity or fraud probability.
