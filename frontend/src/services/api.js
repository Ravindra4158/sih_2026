const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}

/**
 * Submit a document image to the backend EasyOCR service.
 * @param {File|Blob} file - The image file to process
 * @param {string} documentHint - "AUTO" | "AADHAAR" | "PAN" | "PASSPORT"
 */
export async function processOcrDocument(file, documentHint = "AUTO") {
  const formData = new FormData();
  formData.append("image_file", file, file.name || "document.jpg");

  const response = await fetch(`${API_BASE_URL}/document/process-ocr?document_hint=${encodeURIComponent(documentHint)}`, {
    method: "POST",
    body: formData,
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.detail ?? "Unable to process document OCR.");
  }
  return body;
}

/** Upload a document to the backend's validation boundary. */
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.detail ?? "Unable to upload document.");
  }
  return body;
}

/** Submit a document to the preprocessing and OCR pipeline. */
export async function processDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/documents/process`, { method: "POST", body: formData });
  const body = await response.json();
  if (!response.ok) throw new Error(body.detail ?? "Unable to process document.");
  return body;
}

/** Submit a document (and optional selfie) to the complete verification pipeline. */
export async function verifyDocument(file, selfie) {
  const formData = new FormData();
  formData.append("file", file);
  if (selfie) formData.append("selfie", selfie);
  const response = await fetch(`${API_BASE_URL}/verification/documents/verify`, { method: "POST", body: formData });
  const body = await response.json();
  if (!response.ok) throw new Error(body.detail ?? "Unable to verify document.");
  return body;
}

export async function listVerifications() {
  const response = await fetch(`${API_BASE_URL}/verification`);
  const body = await response.json();
  if (!response.ok) throw new Error(body.detail ?? "Unable to load verification history.");
  return body;
}
