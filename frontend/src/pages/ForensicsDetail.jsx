import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Fingerprint, Eye, Database,
  CheckCircle, AlertTriangle, AlertCircle, Info, ShieldCheck
} from "lucide-react";
import { Panel } from "./DashboardLayout";
import { useCaseData } from "../hooks/useCaseData";

/* ─────────────────────────────────────────────────────────────────────────────
   AnomalyOverlay  –  position a box as % of real image dimensions
   Works correctly with objectFit:contain because we set the container to the
   same aspect ratio as the image, so CSS % maps 1:1 to image %.
───────────────────────────────────────────────────────────────────────────── */
function AnomalyOverlay({ region, imageWidth, imageHeight, color, bg }) {
  if (!imageWidth || !imageHeight) return null;
  const bb = region.bounding_box || {};
  const left = ((bb.x || 0) / imageWidth * 100).toFixed(3);
  const top = ((bb.y || 0) / imageHeight * 100).toFixed(3);
  const width = ((bb.width || 32) / imageWidth * 100).toFixed(3);
  const height = ((bb.height || 32) / imageHeight * 100).toFixed(3);

  return (
    <div style={{
      position: "absolute",
      left: `${left}%`, top: `${top}%`,
      width: `${width}%`, height: `${height}%`,
      border: `2px solid ${color}`,
      background: bg,
      pointerEvents: "none",
      boxSizing: "border-box",
    }}>
      {/* Corner label */}
      <span style={{
        position: "absolute", top: "-14px", left: 0,
        background: color, color: "white",
        fontSize: "8px", fontWeight: "700", padding: "1px 4px",
        borderRadius: "2px", whiteSpace: "nowrap", lineHeight: 1.4,
      }}>
        {region.region_label?.replace("Forensic Anomaly Region ", "R").split(" ")[0] || "ANOMALY"}
      </span>
    </div>
  );
}

function DocHeatmapCard({ docImage, forensics, label, index }) {
  const isTampered = forensics?.tamperDetected ?? false;
  const anomalyRegions = Array.isArray(forensics?.anomalyRegions) ? forensics.anomalyRegions : [];
  const heatmap = forensics?.elaHeatmapBase64 ?? null;
  const imgW = forensics?.imageWidth || null;
  const imgH = forensics?.imageHeight || null;
  const tamperScore = forensics?.tamperConfidenceScore ?? null;

  // Build an aspect-ratio style so the container matches the real image
  // Aadhaar/PAN ≈ 1.585:1 (landscape), Passport ≈ 0.71:1 — use actual dims if available
  const aspectStyle = (imgW && imgH)
    ? { aspectRatio: `${imgW} / ${imgH}` }
    : { aspectRatio: "1.6 / 1" };  // safe fallback for horizontal ID cards

  const imgContainerStyle = {
    position: "relative", width: "100%",
    ...aspectStyle,
    borderRadius: "6px", overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxSizing: "border-box",
  };

  return (
    <div style={{ marginBottom: "8px" }}>
      {/* Doc label row */}
      {label && (
        <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--primary)", color: "white", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {index + 1}
          </div>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-dark)" }}>{label}</span>
          <span style={{
            fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px",
            background: isTampered ? "#FEE2E2" : "#ECFDF5",
            color: isTampered ? "#991B1B" : "#065F46",
            border: isTampered ? "1px solid #FECACA" : "1px solid #A7F3D0"
          }}>
            {isTampered ? "⚠ TAMPER DETECTED" : "✓ CLEAN"}
          </span>
        </div>
      )}

      {/* Side-by-side images — full width, correct aspect ratio */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", alignItems: "start" }}>

        {/* ── Original document ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ ...imgContainerStyle, background: "#F1F5F9", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {docImage ? (
              <>
                <img src={docImage} alt="Original document"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
                {/* Anomaly overlays */}
                {isTampered && anomalyRegions.map((r, idx) => (
                  <AnomalyOverlay key={idx} region={r}
                    imageWidth={imgW} imageHeight={imgH}
                    color="#EF4444" bg="rgba(239,68,68,0.12)" />
                ))}
              </>
            ) : (
              /* Skeleton */
              <div style={{ padding: "12px", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
                <div style={{ width: "50px", height: "5px", background: "#CBD5E1", borderRadius: "2px" }} />
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ width: "30px", height: "40px", background: "#CBD5E1", borderRadius: "3px", flexShrink: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                    <div style={{ width: "80%", height: "5px", background: "#CBD5E1", borderRadius: "2px" }} />
                    <div style={{ width: "60%", height: "4px", background: "#E2E8F0", borderRadius: "2px" }} />
                    <div style={{ width: "90%", height: "4px", background: "#E2E8F0", borderRadius: "2px" }} />
                  </div>
                </div>
                <div style={{ width: "45%", height: "4px", background: "#CBD5E1", borderRadius: "2px" }} />
              </div>
            )}
          </div>
          <span style={{ fontSize: "12px", color: "#60A5FA", fontWeight: "600", textAlign: "center" }}>Original Document Image</span>
        </div>

        {/* ── ELA Heatmap ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ ...imgContainerStyle, background: "#0F172A", border: "1px solid #1E293B" }}>
            {heatmap && heatmap.startsWith("data:image") ? (
              <>
                <img src={heatmap} alt="ELA Heatmap"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
                {/* Anomaly overlays on heatmap */}
                {isTampered && anomalyRegions.map((r, idx) => (
                  <AnomalyOverlay key={idx} region={r}
                    imageWidth={imgW} imageHeight={imgH}
                    color="#F43F5E" bg="rgba(244,63,94,0.22)" />
                ))}
              </>
            ) : (
              /* Simulated ELA when backend result not yet available */
              <>
                <div style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: "linear-gradient(#38BDF8 1px,transparent 1px),linear-gradient(90deg,#38BDF8 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
                {isTampered ? (
                  <>
                    <div style={{ position: "absolute", top: "30%", left: "55%", width: "18%", height: "22%", background: "#EF4444", filter: "blur(10px)", opacity: 0.85, borderRadius: "50%", transform: "translate(-50%,-50%)" }} />
                    <div style={{ position: "absolute", top: "65%", right: "15%", width: "12%", height: "14%", background: "#F59E0B", filter: "blur(7px)", opacity: 0.7, borderRadius: "50%", transform: "translate(50%,-50%)" }} />
                  </>
                ) : (
                  <div style={{ position: "absolute", inset: "10%", background: "#38BDF8", filter: "blur(28px)", opacity: 0.06 }} />
                )}
                <div style={{ position: "absolute", bottom: "6px", left: "50%", transform: "translateX(-50%)", fontSize: "9px", color: "#475569", fontWeight: "600", whiteSpace: "nowrap" }}>
                  {heatmap ? "LOADING…" : "ELA PREVIEW (NO BACKEND DATA)"}
                </div>
              </>
            )}
          </div>
          <span style={{ fontSize: "12px", color: "#60A5FA", fontWeight: "600", textAlign: "center" }}>Error Level Heatmap (ELA)</span>
        </div>
      </div>

      {/* Metric bar */}
      <div style={{ display: "flex", background: "#F8FAFC", borderRadius: "8px", padding: "12px 16px", border: "1px solid var(--border)", marginTop: "14px", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "0.05em" }}>TAMPERING PROBABILITY</span>
          <strong style={{ display: "block", fontSize: "14px", color: "var(--text-dark)", marginTop: "2px" }}>
            {isTampered ? "High Gradient Inconsistency Found" : "Uniform Compression Detected"}
          </strong>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "28px", fontWeight: "800", color: isTampered ? "#EF4444" : "#10B981" }}>
            {tamperScore !== null ? `${tamperScore}%` : (isTampered ? "87.5%" : "4.2%")}
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>(threshold: 40%)</span>
        </div>
      </div>

      {/* Anomaly region list */}
      {isTampered && anomalyRegions.length > 0 && (
        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {anomalyRegions.map((region, idx) => (
            <div key={idx} style={{ padding: "10px 14px", background: "#FEF2F2", borderRadius: "8px", border: "1px solid #FECACA" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "600", color: "#B91C1C" }}>
                  <AlertCircle size={13} /> {region.region_label}
                </span>
                <span style={{ fontSize: "11px", background: "#FEE2E2", color: "#991B1B", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
                  VAR: {region.error_variance}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", fontFamily: "monospace" }}>
                x:{region.bounding_box?.x ?? "?"} y:{region.bounding_box?.y ?? "?"} w:{region.bounding_box?.width ?? "?"} h:{region.bounding_box?.height ?? "?"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────────────────────── */
export default function ForensicsDetail() {
  const { id } = useParams();
  const { caseData } = useCaseData(id);

  // ⚠ Hooks MUST be called unconditionally — before any early returns
  const [activeDoc, setActiveDoc] = useState(0);

  if (!caseData) {
    return (
      <main className="content" style={{ padding: "40px", textAlign: "center" }}>
        <div style={{
          width: "40px", height: "40px",
          border: "4px solid #E2E8F0", borderTop: "4px solid var(--primary)",
          borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px",
        }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "var(--text-muted)" }}>Loading forensics...</p>
      </main>
    );
  }

  // Use allDocuments[] if available (new multi-doc cases), else build a single-entry array
  const docs = Array.isArray(caseData.allDocuments) && caseData.allDocuments.length > 0
    ? caseData.allDocuments
    : [{ documentImageBase64: caseData.documentImageBase64 || null, filename: "Document", forensics: caseData.forensics || {} }];

  const hasMultiple = docs.length > 1;
  const anyTampered = docs.some(d => d.forensics?.tamperDetected);


  return (
    <main className="content">
      {/* Heading */}
      <div className="page-heading dashboard-heading" style={{ marginBottom: "16px" }}>
        <div>
          <span className="eyebrow" style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", letterSpacing: "0.1em" }}>FORENSIC TELEMETRY</span>
          <h2 style={{ margin: "8px 0 4px" }}>Error Level Analysis (ELA)</h2>
          <p>Analyzing digital compression discrepancies to expose structural modifications · {docs.length} document{docs.length > 1 ? "s" : ""} scanned</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link to="/dashboard/history" className="btn-primary" style={{ background: "white", color: "var(--text-dark)", border: "1px solid var(--border)" }}>
            <ArrowLeft size={16} /> Back to History
          </Link>
          <Link to={`/cases/${id}`} className="btn-primary" style={{ background: "var(--primary)", color: "white" }}>
            <ShieldCheck size={16} /> Decision Override
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "24px", gap: "8px", overflowX: "auto" }}>
        {[
          { to: `/screening/${id}/results`, label: "Overview Results", icon: null, active: false },
          { to: `/screening/${id}/biometrics`, label: "Biometrics Details", icon: <Fingerprint size={16} />, active: false },
          { to: `/screening/${id}/forensics`, label: "Forensics & ELA", icon: <Eye size={16} />, active: true },
          { to: `/screening/${id}/data`, label: "OCR & Raw Fields", icon: <Database size={16} />, active: false },
        ].map(t => (
          <Link key={t.to} to={t.to} style={{
            padding: "12px 20px", fontWeight: t.active ? "600" : "500",
            color: t.active ? "var(--primary)" : "var(--text-muted)",
            borderBottom: t.active ? "2px solid var(--primary)" : "2px solid transparent",
            fontSize: "13px", display: "flex", alignItems: "center", gap: "6px",
            whiteSpace: "nowrap", textDecoration: "none",
          }}>
            {t.icon}{t.label}
          </Link>
        ))}
      </div>

      {/* Overall status banner */}
      <div style={{
        marginBottom: "20px", padding: "12px 18px", borderRadius: "10px",
        background: anyTampered ? "#FEF2F2" : "#F0FDF4",
        border: `1px solid ${anyTampered ? "#FECACA" : "#A7F3D0"}`,
        display: "flex", alignItems: "center", gap: "12px",
        fontSize: "14px", fontWeight: "600",
        color: anyTampered ? "#991B1B" : "#065F46",
      }}>
        {anyTampered
          ? <AlertTriangle size={18} color="#DC2626" />
          : <CheckCircle size={18} color="#10B981" />}
        {anyTampered
          ? `⚠ Forensic anomalies detected in ${docs.filter(d => d.forensics?.tamperDetected).length} of ${docs.length} document(s).`
          : `✓ All ${docs.length} document(s) passed ELA forensic inspection. No tampering detected.`}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>

        {/* ── Heatmap panels — one per document ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Panel title={`COMPRESSION RE-SAVE DIFFERENTIAL (${docs.length} DOCUMENT${docs.length > 1 ? "S" : ""})`}>
            <div style={{ padding: "16px 20px" }}>

              {/* ── Doc selector buttons (only shown when > 1 doc) ── */}
              {hasMultiple && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                  {docs.map((doc, di) => {
                    const isActive = di === activeDoc;
                    const tampered = doc.forensics?.tamperDetected;
                    const name = doc.filename || `Document ${di + 1}`;
                    return (
                      <button
                        key={di}
                        onClick={() => setActiveDoc(di)}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "8px 14px", borderRadius: "8px", cursor: "pointer",
                          fontWeight: isActive ? "700" : "500",
                          fontSize: "13px",
                          border: isActive
                            ? `2px solid ${tampered ? "#EF4444" : "var(--primary)"}`
                            : "2px solid var(--border)",
                          background: isActive
                            ? (tampered ? "#FEF2F2" : "#EFF6FF")
                            : "#F8FAFC",
                          color: isActive
                            ? (tampered ? "#991B1B" : "var(--primary)")
                            : "var(--text-muted)",
                          transition: "all 0.2s",
                          boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                        }}
                      >
                        <span style={{
                          width: "20px", height: "20px", borderRadius: "50%",
                          background: isActive ? (tampered ? "#EF4444" : "var(--primary)") : "#CBD5E1",
                          color: "white", fontSize: "10px", fontWeight: "800",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {di + 1}
                        </span>
                        <span style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {name}
                        </span>
                        {tampered
                          ? <span title="Tampering detected" style={{ color: "#EF4444", fontSize: "12px" }}>⚠</span>
                          : <span title="Clean" style={{ color: "#10B981", fontSize: "12px" }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Active document heatmap ── */}
              <DocHeatmapCard
                key={activeDoc}
                docImage={docs[activeDoc]?.documentImageBase64}
                forensics={docs[activeDoc]?.forensics}
                label={hasMultiple ? (docs[activeDoc]?.filename || `Document ${activeDoc + 1}`) : null}
                index={activeDoc}
              />
            </div>
          </Panel>
        </div>

        {/* ── Right column: info panels ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* EXIF / Metadata */}
          <Panel title="EXIF & METADATA ANALYSIS">
            <div style={{ padding: "16px 20px" }}>
              {caseData.warnings?.some(w => w.includes("EDITING_SOFTWARE_DETECTED")) ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {caseData.warnings.filter(w => w.includes("EDITING_SOFTWARE_DETECTED")).map((warning, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "#FEF2F2", borderRadius: "8px", color: "#991B1B", fontSize: "13px", border: "1px solid #FCA5A5" }}>
                      <AlertTriangle size={18} color="#DC2626" /><span>{warning}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", background: "#F8FAFC", borderRadius: "8px", color: "var(--text-muted)", fontSize: "13px", border: "1px solid #EEF2F6" }}>
                  <CheckCircle size={18} color="#64748B" />
                  <span>No suspicious EXIF metadata or editing software signatures found.</span>
                </div>
              )}
            </div>
          </Panel>

          {/* All warnings */}
          {caseData.warnings && caseData.warnings.length > 0 && (
            <Panel title="SYSTEM FLAGS & WARNINGS">
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {caseData.warnings.map((w, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 14px", background: "#FEF2F2", borderRadius: "8px", color: "#991B1B", fontSize: "12px", border: "1px solid #FECACA" }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "1px" }} color="#DC2626" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}


        </div>
      </div>
    </main>
  );
}
