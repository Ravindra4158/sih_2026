import { Fragment, useState } from "react";

import { listVerifications, verifyDocument } from "./services/api";

/** Upload boundary for the future officer review dashboard. */
export default function App() {
  const [file, setFile] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [status, setStatus] = useState("Select a PDF, JPEG, or PNG document to begin.");
  const [result, setResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [history, setHistory] = useState([]);

  async function loadHistory() {
    try {
      setHistory(await listVerifications());
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setStatus("Choose a document before uploading.");
      return;
    }

    setIsUploading(true);
    setResult(null);
    setStatus("Uploading, preprocessing, and running available verification models…");
    try {
      const processingResult = await verifyDocument(file, selfie);
      setResult(processingResult);
      loadHistory();
      setStatus("Processing complete.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", margin: "3rem auto", maxWidth: 680, padding: "0 1rem" }}>
      <h1>AI-Based Fake Identity &amp; Document Screening</h1>
      <p>Upload a document to inspect processing, model outputs, and validation signals.</p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label>
          Identity document (PDF, JPEG, or PNG; max 10 MB)
          <input
            accept="application/pdf,image/jpeg,image/png"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            style={{ display: "block", marginTop: "0.5rem" }}
            type="file"
          />
        </label>
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setFile(event.dataTransfer.files?.[0] ?? null);
          }}
          style={{ border: "1px dashed #4175a3", padding: "1rem", textAlign: "center" }}
        >
          Drop a supported synthetic document here
        </div>
        {file && <p>Selected: {file.name} ({Math.ceil(file.size / 1024)} KB)</p>}
        <label>
          Selfie (optional; used only when a passport portrait is detected)
          <input accept="image/jpeg,image/png" onChange={(event) => setSelfie(event.target.files?.[0] ?? null)} style={{ display: "block", marginTop: "0.5rem" }} type="file" />
        </label>
        <button disabled={isUploading} type="submit">
          {isUploading ? "Processing…" : "Process document"}
        </button>
      </form>
      <p aria-live="polite"><strong>Status:</strong> {status}</p>
      {result && (
        <section aria-label="Upload result">
          <h2>Verification result</h2>
          <dl>
            <dt>Document ID</dt><dd>{result.document_id}</dd>
            <dt>Document type</dt><dd>{result.document_type.name} ({Math.round(result.document_type.confidence * 100)}%, {result.document_type.method})</dd>
            <dt>OCR status</dt><dd>{result.ocr.status}</dd>
          </dl>
          <h3>Extracted fields</h3>
          {Object.keys(result.extracted_data).length ? (
            <dl>{Object.entries(result.extracted_data).map(([key, field]) => <Fragment key={key}><dt>{key}</dt><dd>{field.value}</dd></Fragment>)}</dl>
          ) : <p>No supported fields were found.</p>}
          <h3>Validation signals</h3>
          <ul>{Object.entries(result.validation).map(([key, check]) => <li key={key}>{key}: {check.status}</li>)}</ul>
          <h3>AI model outputs</h3>
          <ul>{Object.entries(result.models).map(([key, model]) => (
            <li key={key}>{key}: {model.status}{model.prediction ? ` — ${model.prediction}` : ""}{model.score !== null && model.score !== undefined ? ` (score: ${model.score})` : ""}{model.reason ? ` (${model.reason})` : ""}{model.error ? ` (${model.error})` : ""}</li>
          ))}</ul>
          <h2>Overall result</h2>
          <dl>
            <dt>Decision</dt><dd>{result.risk.decision}</dd>
            <dt>Risk score</dt><dd>{result.risk.score} / 100</dd>
            <dt>Risk level</dt><dd>{result.risk.level}</dd>
          </dl>
          <h3>Why?</h3>
          {result.explanations.length ? <ul>{result.explanations.map((item, index) => <li key={`${item.source}-${index}`}>{item.message}</li>)}</ul> : <p>No risk-elevating calibrated or deterministic signal was produced.</p>}
          <h3>Limitations</h3>
          <ul>{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      )}
      <section aria-label="Verification history">
        <h2>Recent verification history</h2>
        <button onClick={loadHistory} type="button">Refresh history</button>
        {history.length ? <ul>{history.map((item) => <li key={item.document_id}>{item.document_id}: {item.document_type.name} - {item.risk_level} ({item.risk_score})</li>)}</ul> : <p>No metadata-only history loaded.</p>}
      </section>
    </main>
  );
}
