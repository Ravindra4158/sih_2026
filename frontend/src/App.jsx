import { useMemo, useState } from "react";
import { processDocument } from "./services/api";
import "./styles.css";

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

function Header({ label }) { return <header className="topbar"><div><h1>BORDER SCREENING SYSTEM</h1><p>AI-Based Fake Identity &amp; Document Screening System</p></div><div className="officer"><strong>Officer_102</strong><span><i /> Online</span></div></header>; }
function Panel({ title, children, className = "" }) { return <section className={`panel ${className}`}><div className="panel-title">{title}</div>{children}</section>; }
function Stat({ number, label, tone = "blue", foot }) { return <div className="stat"><strong className={tone}>{number}</strong><span>{label}</span><small>{foot}</small></div>; }
function Donut() { return <div className="donut" />; }
function Bars({ colors = false }) { return <div className={`bars ${colors ? "color-bars" : ""}`}>{[38, 60, 46, 75, 62, 82, 69].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>; }

function Dashboard({ setPage }) {
  return <><Header /><main className="content"><div className="page-heading"><div><span className="eyebrow">OPERATIONS CENTER</span><h2>Dashboard Overview</h2><p>Monitor border screening activity and risk signals in real time.</p></div><button className="primary" onClick={() => setPage("screening")}>+ New Screening</button></div>
    <div className="stats"><Stat number="1,248" label="Documents Screened" foot="Today" /><Stat number="1,201" label="Cleared (Low Risk)" tone="green" foot="96.2%" /><Stat number="34" label="Review (Medium Risk)" tone="amber" foot="2.7%" /><Stat number="13" label="High Risk" tone="red" foot="1.0%" /></div>
    <div className="grid-2"><Panel title="RISK DISTRIBUTION (TODAY)"><div className="donut-row"><Donut /><div className="legend"><span><i className="green-bg" />Low Risk (0-40) <b>96.2%</b></span><span><i className="amber-bg" />Medium Risk (40-75) <b>2.7%</b></span><span><i className="red-bg" />High Risk (75-100) <b>1.0%</b></span></div></div></Panel><Panel title="RECENT ALERTS"><div className="alerts">{[["High tampering detected", "Passport: P7654321", "2 min ago", "red"], ["Face mismatch", "Passport: P1239876", "5 min ago", "amber"], ["Expired document", "Visa No: V998877", "9 min ago", "amber"], ["Watchlist match found", "ID No: Z8877665", "15 min ago", "red"]].map(a => <div className="alert" key={a[0]}><i className={a[3]}>{a[3] === "red" ? "!" : ""}</i><span><b>{a[0]}</b><small>{a[1]}</small></span><time>{a[2]}</time></div>)}</div></Panel></div>
    <div className="grid-activity"><Panel title="TODAY'S ACTIVITY"><div className="chart"><Bars /><div className="axis"><span>12 AM</span><span>4 AM</span><span>8 AM</span><span>12 PM</span><span>4 PM</span><span>8 PM</span></div></div></Panel><Panel title="AVG. PROCESSING TIME"><div className="processing"><span>◷</span><strong>3.6</strong><small>Seconds</small><b>-12% vs yesterday</b></div></Panel></div>
  </main></>;
}

function Screening({ setPage }) {
  const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [status, setStatus] = useState("Ready for document input");
  async function submit(e) { e.preventDefault(); if (!file) return setStatus("Choose a document first"); setBusy(true); setStatus("Processing document…"); try { await processDocument(file); setStatus("Processing complete"); setPage("result"); } catch (err) { setStatus(err.message); } finally { setBusy(false); } }
  return <><Header /><main className="content"><div className="page-heading"><div><span className="eyebrow">LIVE PROCESSING</span><h2>New Document Screening</h2><p>Upload an identity document and capture a live face match.</p></div><span className="case-chip">Case BR-2026-00125</span></div><form onSubmit={submit} className="screen-grid"><Panel title="DOCUMENT INPUT"><div className="upload-box"><div className="doc-placeholder">PASSPORT<br /><strong>{file ? file.name : "DOCUMENT"}</strong></div><label className="upload-button">{file ? "Replace Document" : "Upload Document"}<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] || null)} /></label><small>PDF, JPEG or PNG · max 10 MB</small></div></Panel><Panel title="LIVE FACE CAPTURE"><div className="face-box"><div className="face">◉</div><span className="online-text">● Camera On</span><button type="button" className="secondary">Capture Again</button></div></Panel><Panel title="PROCESSING PIPELINE" className="pipeline"><div className="steps">{["Document Detection", "OCR Extraction", "Document Validation", "Tampering Analysis", "Face Verification", "Risk Assessment"].map((s, i) => <div key={s}><i className={i < 3 ? "done" : i === 3 ? "working" : "pending"}>{i < 3 ? "✓" : ""}</i><span>{s}</span><b>{i < 3 ? "Completed" : i === 3 ? "In Progress…" : "Pending"}</b><em><u style={{ width: `${i < 3 ? 92 - i * 5 : i === 3 ? 65 : 0}%` }} /></em></div>)}</div></Panel><div className="form-actions"><span aria-live="polite">{status}</span><button className="primary" disabled={busy} type="submit">{busy ? "Processing…" : "Start Screening"}</button></div></form></main></>;
}

function Result({ setPage }) { return <><Header /><main className="content"><div className="page-heading"><div><span className="eyebrow">SCREENING RESULT</span><h2>Risk &amp; Findings</h2><p>Case BR-2026-00124 · 25 Aug 2026, 01:42 PM</p></div><button className="secondary" onClick={() => setPage("screening")}>← New Screening</button></div><div className="result-hero"><div><span>OVERALL RISK SCORE</span><strong>64 <small>/ 100</small></strong><b>MEDIUM RISK</b></div><div className="gauge"><div /><span>Risk assessment</span></div><div className="recommend"><span>RECOMMENDED ACTION</span><strong>! &nbsp; MANUAL REVIEW<br />&nbsp;&nbsp;&nbsp;&nbsp;REQUIRED</strong><p>Please verify document and<br />individual before proceeding.</p><button className="green-button">Approve</button><button className="amber-button">Refer</button><button className="red-button">Reject</button></div></div><div className="result-grid"><Panel title="DOCUMENT DETAILS"><dl>{[["Document Type", "Passport"], ["Passport Number", "P1234567"], ["Name", "Rahul Sharma"], ["Nationality", "Indian"], ["Date of Birth", "12/05/1998"], ["Gender", "Male"], ["Date of Issue", "10/06/2020"], ["Date of Expiry", "09/08/2030"], ["MRZ Status", "Match ✓"]].map(x => <div key={x[0]}><dt>{x[0]}</dt><dd>{x[1]}</dd></div>)}</dl></Panel><Panel title="FINDINGS"><div className="finding-list">{[["Document Format", "Valid", "green"], ["MRZ Consistency", "Match", "green"], ["Expiry Date Check", "Valid", "green"], ["Watchlist Check", "Clear", "green"], ["Tampering Analysis", "Suspicious", "red"], ["Face Verification", "Match (96%)", "green"]].map(x => <div key={x[0]}><span>✓ {x[0]}</span><b className={x[2]}>{x[1]}</b></div>)}</div></Panel><Panel title="TAMPERING HEATMAP"><div className="heatmap">REPUBLIC OF INDIA<br /><br />P1234567<br /><strong>●</strong></div></Panel></div></main></> }

function Cases() { return <><Header /><main className="content"><div className="page-heading"><div><span className="eyebrow">AUDIT TRAIL</span><h2>Case History</h2><p>Search and review previously screened documents.</p></div><button className="secondary">Download Report</button></div><Panel title="CASE RECORDS"><div className="filters"><input placeholder="Search name, passport, ID or case" /><select><option>Risk Level: All</option></select><select><option>Status: All</option></select><button className="secondary">Filter</button></div><div className="table-wrap"><table><thead><tr>{["Case ID", "Date & Time", "Name", "Document No.", "Risk Level", "Result", "Action", "Officer"].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{cases.map((r) => <tr key={r[0]}>{r.map((v, i) => <td key={i}><span className={i === 4 ? `pill ${v.toLowerCase()}` : i === 5 ? `result-pill ${v.includes("Clear") ? "cleared" : "review"}` : ""}>{v}</span></td>)}</tr>)}</tbody></table></div></Panel><div className="case-bottom"><Panel title="CASE DETAILS"><p><b>Selected case</b></p><p>Rahul Sharma · P1234567</p><p className="green">MRZ Match · Valid</p></Panel><Panel title="FINDINGS SUMMARY"><p>Document authenticity verified.</p><p className="red">Tampering score: 72/100</p><p className="green">Face match: 96%</p></Panel></div></main></> }
function Analytics() { return <><Header /><main className="content"><div className="page-heading"><div><span className="eyebrow">INSIGHTS &amp; REPORTS</span><h2>Analytics</h2><p>Performance trends across the border screening operation.</p></div><button className="secondary">Download Report</button></div><div className="stats five"><Stat number="1,248" label="Total Screened" /><Stat number="96.2%" label="Cleared (Low Risk)" tone="green" /><Stat number="2.7%" label="Review (Medium Risk)" tone="amber" /><Stat number="1.0%" label="High Risk" tone="red" /><Stat number="3.6s" label="Avg. Processing Time" /></div><div className="analytics-grid"><Panel title="RISK LEVEL TREND"><div className="chart tall"><Bars colors /><div className="axis"><span>12 AM</span><span>4 AM</span><span>8 AM</span><span>12 PM</span><span>4 PM</span><span>8 PM</span></div></div></Panel><Panel title="DOCUMENT TYPE DISTRIBUTION"><div className="donut-row"><div className="donut blue-donut" /><div className="legend"><span>■ Passport <b>78%</b></span><span>■ Visa <b>12%</b></span><span>■ ID Card <b>6%</b></span><span>■ License / Permit <b>4%</b></span></div></div></Panel><Panel title="TOP TAMPERING CASES"><div className="rank-list">{[["Text Manipulation", 42], ["Photo Replacement", 31], ["Stamp Forgery", 18], ["Metadata Anomaly", 11]].map(x => <div key={x[0]}><span>{x[0]}</span><i><u style={{ width: `${x[1] * 2}%` }} /></i><b>{x[1]}</b></div>)}</div></Panel><Panel title="MONTHLY COMPARISON"><div className="mini-columns">{[45, 60, 58, 70, 72].map((x, i) => <i key={i} style={{ height: `${x}%` }} />)}</div><div className="axis"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div></Panel></div></main></> }

export default function App() { const [page, setPage] = useState("dashboard"); const active = page === "result" ? "screening" : page; const view = useMemo(() => ({ dashboard: <Dashboard setPage={setPage} />, screening: <Screening setPage={setPage} />, result: <Result setPage={setPage} />, cases: <Cases />, analytics: <Analytics /> }[page] || <Dashboard setPage={setPage} />), [page]); return <div className="app"><Sidebar page={active} setPage={setPage} /><div className="main">{view}</div></div>; }
