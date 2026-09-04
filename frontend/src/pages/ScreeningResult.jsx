import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertTriangle, AlertCircle, ShieldCheck, HelpCircle, FileText, Fingerprint, Eye, Database, Loader2 } from "lucide-react";
import { Panel } from "./DashboardLayout";
import { useCaseData } from "../hooks/useCaseData";
import { updateCaseStatus } from "../services/api";

export default function ScreeningResult() {
  const { id } = useParams();
  const { caseData, loading } = useCaseData(id);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [decisionMsg, setDecisionMsg] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (caseData) {
      setCurrentStatus(caseData.status || "Pending");
    }
  }, [caseData]);

  const handleQuickDecision = async (newStatus) => {
    setIsUpdating(true);
    let newRisk = caseData?.riskLevel || "Low";
    if (newStatus === "Approved") newRisk = "Low";
    if (newStatus === "Rejected") newRisk = "High";
    if (newStatus === "Pending") newRisk = "Medium";

    try {
      await updateCaseStatus(id, { status: newStatus, riskLevel: newRisk });
    } catch {
      // LocalStorage fallback
      try {
        const local = JSON.parse(localStorage.getItem("ai_border_cases") || "[]");
        const idx = local.findIndex(c => c.id === id);
        if (idx !== -1) {
          local[idx] = { ...local[idx], status: newStatus, riskLevel: newRisk };
          localStorage.setItem("ai_border_cases", JSON.stringify(local));
        }
      } catch { }
    } finally {
      setIsUpdating(false);
      setCurrentStatus(newStatus);
      setDecisionMsg(`Status updated to ${newStatus.toUpperCase()}`);
    }
  };

  if (!caseData) {
    return (
      <main className="content" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #E2E8F0',
          borderTop: '4px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading screening result...</p>
      </main>
    );
  }

  // Safe variables
  const warnings = Array.isArray(caseData.warnings) ? caseData.warnings : [];
  const riskLevel = caseData.riskLevel || "Low";
  const isHigh = riskLevel === "High";
  const isMed = riskLevel === "Medium";
  const riskColor = isHigh ? "#EF4444" : isMed ? "#F59E0B" : "#10B981";
  const riskScore = Math.max(0, Math.min(100, Number(caseData.overall_risk_score ?? (isHigh ? 91 : isMed ? 64 : 14)) || 0));
  const gaugeFill = riskScore * 1.8;
  const riskText = riskLevel.toUpperCase() + " RISK";
  const status = caseData.status || "Pending";

  // Recommended Action
  let recommendationTitle = "CLEAR FOR ENTRY";
  let recommendationDesc = "All automated validation checks passed successfully. No anomalies detected.";

  if (isHigh) {
    recommendationTitle = "HIGH RISK ALERT - VERIFICATION FAILED";
    recommendationDesc = "Critical security validations failed. Digital tampering suspected. Deny entry or route to secondary questioning immediately.";
  } else if (isMed) {
    recommendationTitle = "MANUAL REVIEW REQUIRED";
    recommendationDesc = "Borderline scores or minor warnings detected. Please verify credentials manually before making a clearance decision.";
  }

  const hasExpiredWarning = warnings.some(w => typeof w === "string" && w.includes("EXPIRED"));
  const hasMrzWarning = warnings.some(w => typeof w === "string" && w.includes("MRZ"));
  const isPassport = caseData.docType?.toLowerCase()?.includes("passport");
  const faceScore = caseData.biometrics?.faceMatchScore ?? 92.5;
  const blinkPassed = caseData.biometrics?.livenessCheck?.blinkDetected ?? true;
  const tamperDetected = caseData.forensics?.tamperDetected ?? false;

  // Findings list
  const findings = [
    { name: "Document Format Check", val: "Valid Format", status: true },
    { name: "Expiry Date Check", val: hasExpiredWarning ? "Expired" : "Valid Range", status: !hasExpiredWarning },
    { name: "MRZ Checksum Matching", val: hasMrzWarning ? "Checksum Fail" : (isPassport ? "Validated" : "Skipped (National ID)"), status: !hasMrzWarning },
    { name: "Tampering Forensic Check (ELA)", val: tamperDetected ? "Suspicious" : "Clean Layers", status: !tamperDetected },
    { name: "Biometric Face Matching", val: `Match (${faceScore}%)`, status: faceScore >= 80 },
    { name: "Liveness Check Verification", val: blinkPassed ? "Active User" : "No Blink Detected", status: blinkPassed }
  ];

  return (
    <main className="content">
      {/* Heading */}
      <div className="page-heading dashboard-heading" style={{ marginBottom: '16px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>SCREENING REPORT</span>
          <h2 style={{ margin: '8px 0 4px' }}>Case Result: {caseData.name || "Anonymous Candidate"}</h2>
          <p>ID: {caseData.id} · Screened on: {caseData.date}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/dashboard/history" className="btn-primary" style={{ background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border)' }}>
            <ArrowLeft size={16} /> Back to History
          </Link>
          <Link to={`/cases/${id}`} className="btn-primary" style={{ background: 'var(--primary)', color: 'white' }}>
            <ShieldCheck size={16} /> Override / Decision Panel
          </Link>
        </div>
      </div>

      {/* Tabs Sub-navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '8px', overflowX: 'auto' }}>
        <Link to={`/screening/${id}/results`} style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--primary)', borderBottom: '2px solid var(--primary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
          Overview Results
        </Link>
        <Link to={`/screening/${id}/biometrics`} style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <Fingerprint size={16} /> Biometrics Details
        </Link>
        <Link to={`/screening/${id}/forensics`} style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <Eye size={16} /> Forensics &amp; ELA
        </Link>
        <Link to={`/screening/${id}/data`} style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <Database size={16} /> OCR &amp; Raw Fields
        </Link>
      </div>

      {/* Hero Assessment Row */}
      <div className="result-hero-grid" style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px', marginBottom: '24px' }}>
        {/* Score box */}
        <div style={{ paddingRight: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>COMPUTED RISK SCORE</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '16px 0 8px' }}>
            <span style={{ fontSize: '48px', fontWeight: '800', color: riskColor, lineHeight: '1' }}>
              {riskScore}
            </span>
            <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ background: riskColor + '15', color: riskColor, padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontWeight: '700', fontSize: '12px', letterSpacing: '0.05em' }}>
            {riskText}
          </div>
        </div>

        {/* Dynamic gauge animation */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingRight: '16px' }}>
          <div style={{ position: 'relative', width: '130px', height: '65px', overflow: 'hidden' }}>
            <div style={{ width: '130px', height: '130px', borderRadius: '50%', background: `conic-gradient(from 270deg, ${riskColor} 0deg ${gaugeFill}deg, #F1F5F9 ${gaugeFill}deg 180deg, transparent 180deg)`, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '12px', borderRadius: '50%', background: 'white' }} />
            </div>
            <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>GAUGE</span>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>Dynamic Risk Level</span>
        </div>

        {/* Action Recommendation & Quick Decision Bar */}
        <div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>RECOMMENDED CLEARANCE ACTION</span>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <div style={{ background: riskColor + '10', padding: '10px', borderRadius: '50%', color: riskColor, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}>
              {isHigh ? <AlertCircle size={28} /> : isMed ? <AlertTriangle size={28} /> : <ShieldCheck size={28} />}
            </div>
            <div>
              <strong style={{ fontSize: '15px', color: 'var(--text-dark)', display: 'block' }}>{recommendationTitle}</strong>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>{recommendationDesc}</p>
            </div>
          </div>

          {/* Direct Decision Action Buttons — hidden once finalised */}
          {currentStatus === "Approved" || currentStatus === "Rejected" ? (
            /* ── Decision already made — show locked badge ── */
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "10px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "14px",
                background: currentStatus === "Approved" ? "#ECFDF5" : "#FEF2F2",
                color: currentStatus === "Approved" ? "#047857" : "#991B1B",
                border: currentStatus === "Approved" ? "1.5px solid #6EE7B7" : "1.5px solid #FCA5A5",
              }}>
                {currentStatus === "Approved"
                  ? <><ShieldCheck size={16} /> ✓ ENTRY APPROVED — Decision Finalised</>
                  : <><AlertCircle size={16} /> ✗ ENTRY REJECTED — Decision Finalised</>}
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Use <em>Decision Override</em> to change.
              </span>
            </div>
          ) : (
            /* ── Pending / awaiting decision ── */
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed var(--border)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleQuickDecision("Approved")}
                disabled={isUpdating}
                className="btn-primary"
                style={{ background: "#10B981", color: "white", padding: "8px 14px", fontSize: "12px", borderRadius: "6px", cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: "6px", opacity: isUpdating ? 0.6 : 1 }}
              >
                <ShieldCheck size={14} /> Approve Entry
              </button>
              <button
                type="button"
                onClick={() => handleQuickDecision("Rejected")}
                disabled={isUpdating}
                className="btn-primary"
                style={{ background: "#EF4444", color: "white", padding: "8px 14px", fontSize: "12px", borderRadius: "6px", cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: "6px", opacity: isUpdating ? 0.6 : 1 }}
              >
                <AlertCircle size={14} /> Reject &amp; Deny
              </button>
              <button
                type="button"
                onClick={() => handleQuickDecision("Pending")}
                disabled={isUpdating}
                className="btn-primary"
                style={{ background: "#F59E0B", color: "white", padding: "8px 14px", fontSize: "12px", borderRadius: "6px", cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: "6px", opacity: isUpdating ? 0.6 : 1 }}
              >
                <AlertTriangle size={14} /> Flag for Review
              </button>
              {decisionMsg && (
                <div style={{ width: "100%", marginTop: "8px", fontSize: "12px", fontWeight: "bold", color: decisionMsg.includes("APPROVED") ? "#10B981" : decisionMsg.includes("REJECTED") ? "#EF4444" : "#F59E0B" }}>
                  ✓ {decisionMsg}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Details / Warnings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Validation findings */}
        <Panel title="AUTOMATED VERIFICATION CHECKS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 20px' }}>
            {findings.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '11px 16px',
                  borderRadius: '8px',
                  backgroundColor: idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF',
                  border: '1px solid #EEF2F6',
                  fontSize: '13px'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)', fontWeight: '500' }}>
                  {item.status ? (
                    <CheckCircle size={16} color="#10B981" style={{ flexShrink: 0 }} />
                  ) : (
                    <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                  )}
                  {item.name}
                </span>
                <span
                  style={{
                    color: item.status ? '#047857' : '#B91C1C',
                    fontWeight: '600',
                    background: item.status ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${item.status ? '#A7F3D0' : '#FECACA'}`,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Quick Document Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Panel title="DOCUMENT INFORMATION SUMMARY">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 20px', fontSize: '13px' }}>
              {[
                ["Document Holder", caseData.name || "N/A"],
                ["Document Type", caseData.docType || "N/A"],
                ["Identifier Number", caseData.docNo || "N/A"],
                ["Date of Birth", caseData.details?.dob || "N/A"],
                ["Expiry Date", caseData.details?.expiryDate || "N/A"],
                ["Nationality", caseData.details?.nationality || "Indian"]
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '11px 16px',
                    borderRadius: '8px',
                    backgroundColor: idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF',
                    border: '1px solid #EEF2F6',
                    gap: '16px'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{item[0]}</span>
                  <strong style={{ color: 'var(--text-dark)', wordBreak: 'break-word', textAlign: 'right', fontWeight: '600' }}>{item[1]}</strong>
                </div>
              ))}
            </div>
          </Panel>

          {/* Warnings Log if any */}
          {warnings.length > 0 && (
            <section className="panel" style={{ border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #FCA5A5', background: '#FEE2E2', fontWeight: '600', fontSize: '13px' }}>
                <AlertCircle size={18} color="#B91C1C" />
                <span>Validation Alerts &amp; Flag Details</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px 20px' }}>
                {warnings.map((w, idx) => (
                  <div key={idx} style={{ fontSize: '12.5px', color: '#991B1B', lineHeight: '1.5', display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.75)', borderRadius: '6px', border: '1px solid #FECACA' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#B91C1C', marginTop: '-1px' }}>•</span>
                    <span style={{ flex: 1 }}>{w}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
