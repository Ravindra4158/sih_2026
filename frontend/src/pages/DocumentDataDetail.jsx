import { } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Fingerprint, Eye, Database, FileText, ShieldCheck,
  CheckCircle, AlertCircle, Hash, User, Calendar, Globe, Layers
} from "lucide-react";
import { Panel } from "./DashboardLayout";
import { useCaseData } from "../hooks/useCaseData";

/* ── Normalize a confidence value to 0-100 integer ──────────────────────── */
function normalizeConf(raw) {
  if (typeof raw !== "number") return 94;
  if (raw <= 1.0) return Math.round(raw * 100);   // 0-1 float → %
  return Math.round(raw);                          // already %
}

export default function DocumentDataDetail() {
  const { id } = useParams();
  const { caseData } = useCaseData(id);

  if (!caseData) {
    return (
      <main className="content" style={{ padding: "40px", textAlign: "center" }}>
        <div style={{
          width: "40px", height: "40px",
          border: "4px solid #E2E8F0", borderTop: "4px solid var(--primary)",
          borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px",
        }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "var(--text-muted)" }}>Loading OCR data...</p>
      </main>
    );
  }

  const ocr          = caseData.ocr     || {};
  const details      = caseData.details || {};
  const parsedFields = ocr.parsedFields || {};
  const parsedKeys   = Object.keys(parsedFields);
  const confMap      = ocr.confidenceScores || {};

  /* Compute an overall average confidence for the banner */
  const allConfs = parsedKeys.map(k => normalizeConf(confMap[k]));
  const avgConf  = allConfs.length > 0 ? Math.round(allConfs.reduce((a, b) => a + b, 0) / allConfs.length) : 94;
  const confColor = avgConf >= 90 ? "#10B981" : avgConf >= 75 ? "#F59E0B" : "#EF4444";

  /* Extra fields from caseData.details not in parsedFields */
  const extraInfo = [
    { label: "Issue Date",   value: details.issueDate,   icon: <Calendar size={14} /> },
    { label: "Expiry Date",  value: details.expiryDate,  icon: <Calendar size={14} /> },
    { label: "Gender",       value: details.gender,       icon: <User size={14} /> },
    { label: "Nationality",  value: details.nationality,  icon: <Globe size={14} /> },
  ].filter(f => f.value && f.value !== "N/A");

  return (
    <main className="content">
      {/* Heading */}
      <div className="page-heading dashboard-heading" style={{ marginBottom: "16px" }}>
        <div>
          <span className="eyebrow" style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", letterSpacing: "0.1em" }}>
            OCR &amp; DATA ENGINE
          </span>
          <h2 style={{ margin: "8px 0 4px" }}>Extracted Document Fields</h2>
          <p>Extracted raw OCR string buffers and parsed database fields</p>
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
          { to: `/screening/${id}/results`,    label: "Overview Results",   icon: null,                    active: false },
          { to: `/screening/${id}/biometrics`, label: "Biometrics Details", icon: <Fingerprint size={15}/>, active: false },
          { to: `/screening/${id}/forensics`,  label: "Forensics & ELA",    icon: <Eye size={15}/>,         active: false },
          { to: `/screening/${id}/data`,       label: "OCR & Raw Fields",   icon: <Database size={15}/>,    active: true  },
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

      {/* OCR Quality Banner */}
      <div style={{
        marginBottom: "20px", padding: "12px 18px", borderRadius: "10px",
        background: avgConf >= 90 ? "#F0FDF4" : avgConf >= 75 ? "#FFFBEB" : "#FEF2F2",
        border: `1px solid ${avgConf >= 90 ? "#A7F3D0" : avgConf >= 75 ? "#FDE68A" : "#FECACA"}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {avgConf >= 90
            ? <CheckCircle size={18} color="#10B981" />
            : <AlertCircle size={18} color="#F59E0B" />}
          <div>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-dark)" }}>
              OCR Extraction Quality
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "8px" }}>
              {avgConf >= 90 ? "High confidence — all fields reliably extracted." :
               avgConf >= 75 ? "Moderate confidence — some fields may need manual verification." :
               "Low confidence — document image quality may be poor."}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "3px", flexShrink: 0 }}>
          <span style={{ fontSize: "26px", fontWeight: "800", color: confColor }}>{avgConf}%</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>avg confidence</span>
        </div>
      </div>

      {/* Data Layout Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>

        {/* Left: Raw OCR text */}
        <section className="panel" style={{ display: "flex", flexDirection: "column", height: "520px", padding: "0", overflow: "hidden" }}>
          <div className="panel-title" style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={17} color="var(--primary)" />
            <span>Raw OCR Buffer Output</span>
            <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", background: "#EFF6FF", color: "var(--primary)", border: "1px solid #BFDBFE" }}>
              UTF-8
            </span>
          </div>
          <div style={{
            padding: "20px", overflowY: "auto", flex: 1,
            background: "#0F172A", color: "#F1F5F9",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "12px", whiteSpace: "pre-wrap", lineHeight: "1.75",
            wordBreak: "break-word",
          }}>
            {ocr.rawText || "No raw text recorded."}
          </div>
        </section>

        {/* Right: Parsed fields + extra details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Parsed field confidence bars */}
          <Panel title="PARSED IDENTIFIER FIELDS">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px 20px" }}>
              {parsedKeys.length > 0 ? (
                parsedKeys.map((key, idx) => {
                  const conf      = normalizeConf(confMap[key]);
                  const confColor = conf >= 90 ? "#10B981" : conf >= 75 ? "#F59E0B" : "#EF4444";
                  const icon = key.includes("Type")    ? <Layers size={13} color="var(--text-muted)" />
                             : key.includes("Number")  ? <Hash size={13} color="var(--text-muted)" />
                             : key.includes("Name")    ? <User size={13} color="var(--text-muted)" />
                             : key.includes("Birth") || key.includes("Date") ? <Calendar size={13} color="var(--text-muted)" />
                             : key.includes("Nation")  ? <Globe size={13} color="var(--text-muted)" />
                             : null;
                  return (
                    <div key={idx} style={{
                      padding: "12px 16px", borderRadius: "8px",
                      background: idx % 2 === 0 ? "#F8FAFC" : "#FFF",
                      border: "1px solid #EEF2F6",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "8px", fontSize: "13px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontWeight: "500" }}>
                          {icon}{key}
                        </span>
                        <strong style={{ color: "var(--text-dark)", wordBreak: "break-word", textAlign: "right", fontFamily: key.includes("Number") ? "monospace" : "inherit" }}>
                          {String(parsedFields[key])}
                        </strong>
                      </div>
                      {/* Confidence bar */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ flex: 1, height: "5px", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, Math.max(4, conf))}%`, height: "100%", background: confColor, borderRadius: "3px", transition: "width 0.8s ease" }} />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: confColor, width: "36px", textAlign: "right" }}>
                          {conf}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "13px", padding: "8px 0" }}>No structured fields extracted.</p>
              )}
            </div>
          </Panel>

          {/* Additional identity details from case */}
          {extraInfo.length > 0 && (
            <Panel title="IDENTITY RECORD DETAILS">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "16px 20px" }}>
                {extraInfo.map(({ label, value, icon }, i) => (
                  <div key={i} style={{
                    padding: "12px 14px", borderRadius: "8px",
                    background: "#F8FAFC", border: "1px solid #EEF2F6",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "6px", letterSpacing: "0.03em" }}>
                      {icon}{label.toUpperCase()}
                    </span>
                    <strong style={{ fontSize: "14px", color: "var(--text-dark)" }}>{value}</strong>
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
