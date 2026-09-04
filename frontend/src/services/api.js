/**
 * api.js – Centralised API client for the AI Border Screening backend.
 *
 * Base URL: http://localhost:8000/api/v1  (overridable via VITE_API_BASE_URL)
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

// ---------------------------------------------------------------------------
// Helper: JSON fetch wrapper
// ---------------------------------------------------------------------------
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 15000; // 15s timeout
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    let body;
    try {
      body = await response.json();
    } catch {
      body = { detail: `Server returned ${response.status} with no JSON body.` };
    }
    if (!response.ok) {
      const msg = body?.detail ?? `Request failed with status ${response.status}`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return body;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`Request to ${path} timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Cases – MongoDB CRUD
// ---------------------------------------------------------------------------

/**
 * Save (upsert) a full screening case to MongoDB.
 * @param {object} caseData – full case object matching CaseDocument schema
 */
export async function saveCase(caseData) {
  return apiFetch("/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(caseData),
  });
}

/**
 * Fetch all cases, with optional filters.
 * @param {{ risk?: string, status?: string, search?: string }} filters
 */
export async function getCases(filters = {}) {
  const params = new URLSearchParams();
  if (filters.risk && filters.risk !== "All") params.set("risk", filters.risk);
  if (filters.status && filters.status !== "All") params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString() ? `?${params}` : "";
  return apiFetch(`/cases${qs}`);
}

/**
 * Fetch a single case by its ID.
 * @param {string} caseId
 */
export async function getCaseById(caseId) {
  return apiFetch(`/cases/${encodeURIComponent(caseId)}`);
}

/**
 * Update a case's status, riskLevel, or reviewNotes.
 * @param {string} caseId
 * @param {{ status?: string, riskLevel?: string, reviewNotes?: string }} updates
 */
export async function updateCaseStatus(caseId, updates) {
  return apiFetch(`/cases/${encodeURIComponent(caseId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

// ---------------------------------------------------------------------------
// OCR – Document text extraction
// ---------------------------------------------------------------------------

/**
 * Submit a document image or PDF to the EasyOCR pipeline.
 * @param {File|Blob} file         – JPEG, PNG, or PDF
 * @param {string} documentHint    – "AUTO" | "AADHAAR" | "PAN" | "PASSPORT"
 */
export async function processOcrDocument(file, documentHint = "AUTO", sessionId = null) {
  const formData = new FormData();
  formData.append("image_file", file, file.name ?? "document.jpg");

  const params = new URLSearchParams();
  params.set("document_hint", documentHint);
  if (sessionId) params.set("session_id", sessionId);

  return apiFetch(
    `/document/process-ocr?${params}`,
    { method: "POST", body: formData }
  );
}

/**
 * Validate document layout bounding boxes against known document templates.
 * @param {File|Blob} file         – JPEG, PNG, or PDF
 * @param {string} documentType    – "AUTO" | "AADHAAR" | "PAN" | "PASSPORT"
 * @param {string} sessionId       – Optional session ID
 */
export async function validateLayout(file, documentType = "AUTO", sessionId = null) {
  const formData = new FormData();
  formData.append("image_file", file, file.name ?? "document.jpg");

  const params = new URLSearchParams();
  params.set("document_type", documentType);
  if (sessionId) params.set("session_id", sessionId);

  return apiFetch(
    `/document/validate-layout?${params}`,
    { method: "POST", body: formData }
  );
}

/**
 * Verify machine readable zones (MRZ, QR code, PDF417/Barcodes).
 * @param {File|Blob} file         – JPEG, PNG, or PDF
 * @param {string} sessionId       – Optional session ID
 */
export async function verifyMachineReadable(file, sessionId = null) {
  const formData = new FormData();
  formData.append("image_file", file, file.name ?? "document.jpg");

  const params = new URLSearchParams();
  if (sessionId) params.set("session_id", sessionId);

  return apiFetch(
    `/document/verify-machine-readable?${params}`,
    { method: "POST", body: formData }
  );
}

// ---------------------------------------------------------------------------
// ELA Forensics – Tampering detection
// ---------------------------------------------------------------------------

/**
 * Upload a document image or PDF for Error Level Analysis.
 * @param {File|Blob} file       – JPEG, PNG, or PDF
 * @param {number} jpegQuality   – Re-compression quality (default 90)
 * @param {string} sessionId     – Optional session ID to link steps
 */
export async function runElaAnalysis(file, jpegQuality = 90, sessionId = null) {
  const formData = new FormData();
  formData.append("image_file", file, file.name ?? "document.jpg");

  const params = new URLSearchParams();
  params.set("jpeg_quality", jpegQuality.toString());
  if (sessionId) params.set("session_id", sessionId);

  return apiFetch(
    `/forensics/ela-analysis?${params}`,
    { method: "POST", body: formData }
  );
}


// ---------------------------------------------------------------------------
// MRZ Checksum Validation
// ---------------------------------------------------------------------------

/**
 * Validate ICAO checksums for a raw MRZ string.
 * @param {string} sessionId
 * @param {string} rawMrzText
 */
export async function validateChecksum(sessionId, rawMrzText) {
  return apiFetch("/document/validate-checksum", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, raw_mrz_text: rawMrzText }),
  });
}

// ---------------------------------------------------------------------------
// Biometrics – Face match & liveness
// ---------------------------------------------------------------------------

/**
 * Verify facial match between a document photo and a live capture.
 * @param {string}   sessionId
 * @param {string}   documentPhotoBase64
 * @param {string}   liveCaptureBase64
 * @param {number[]} earFrameSeries
 */
export async function verifyBiometrics(
  sessionId,
  documentPhotoBase64,
  liveCaptureBase64,
  earFrameSeries = []
) {
  return apiFetch("/biometrics/verify-match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      document_photo_base64: documentPhotoBase64,
      live_capture_base64: liveCaptureBase64,
      ear_frame_series: earFrameSeries,
    }),
  });
}

/**
 * Verify live camera capture against an existing Case ID or Session ID using DeepFace.
 * @param {string}   id                 – Case ID or Session ID
 * @param {string}   liveCaptureBase64  – Base64 string of camera capture
 * @param {number[]} earFrameSeries     – Optional EAR series for blink liveness
 */
export async function verifyFaceById(
  id,
  liveCaptureBase64,
  earFrameSeries = []
) {
  return apiFetch("/biometrics/verify-by-id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: id,
      live_capture_base64: liveCaptureBase64,
      ear_frame_series: earFrameSeries,
    }),
  });
}


// ---------------------------------------------------------------------------
// Orchestration – Final risk screening
// ---------------------------------------------------------------------------

/** Run the final orchestration / risk scoring for a session. */
export async function runScreening(sessionId) {
  return apiFetch("/screening/orchestrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
}

// ---------------------------------------------------------------------------
// Face Detection in Document Image
// ---------------------------------------------------------------------------

/**
 * Detect a face in a document image using the backend OpenCV pipeline.
 * @param {Blob|File} blob       – The document image blob
 * @param {string}    docHint   – "AADHAAR" | "PAN" | "PASSPORT" | "DRIVING_LICENCE" | "AUTO"
 */
export async function detectFaceInDocument(blob, docHint = "AUTO") {
  const formData = new FormData();
  formData.append("image_file", blob, "document.jpg");
  const params = new URLSearchParams({ document_hint: docHint });
  return apiFetch(`/document/detect-face?${params}`, {
    method: "POST",
    body: formData,
    timeoutMs: 20000,
  });
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
export async function healthCheck() {
  return apiFetch("/health");
}

// ---------------------------------------------------------------------------
// Deprecated stubs (kept for backward compat)
// ---------------------------------------------------------------------------
/** @deprecated */
export async function uploadDocument(file) { return processOcrDocument(file); }
/** @deprecated */
export async function processDocument(file) { return processOcrDocument(file); }
/** @deprecated */
export async function verifyDocument(file) { return processOcrDocument(file); }
/** @deprecated */
export async function listVerifications() { return getCases(); }
