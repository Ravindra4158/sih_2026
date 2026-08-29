import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertTriangle, AlertCircle, ShieldCheck, HelpCircle, FileText, Fingerprint, Eye, Database, Loader2 } from "lucide-react";
import { Panel } from "./DashboardLayout";
import { mockDatabase } from "../utils/mockDatabase";

export default function ScreeningResult() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);

  useEffect(() => {
    let data = mockDatabase.getCaseById(id);
    if (!data) {
      // Fallback: Create mock case on the fly so the report loads instantly even on direct refresh
      const isDemoTampered = id && (id.charCodeAt(id.length - 1) % 2 === 1);
      data = {
        id: id || "BR-2026-00124",
        date: new Date().toLocaleString("en-IN", { hour12: true, dateStyle: "medium", timeStyle: "short" }),
        name: isDemoTampered ? "Mohd. Arif" : "Anjali Gupta",
        docType: "Passport",
        docNo: isDemoTampered ? "P9876543" : "P5539201",
        riskLevel: isDemoTampered ? "High" : "Low",
        status: "Pending",
        officer: "Rajesh K.",
        reviewNotes: "",
        details: {
          dob: isDemoTampered ? "05/04/1993" : "12/06/1994",
          nationality: "Indian",
          gender: "Male",
          issueDate: isDemoTampered ? "15/01/2016" : "14/08/2021",
          expiryDate: isDemoTampered ? "14/01/2026" : "13/08/2031"
        },
        iqa: {
          blurScore: 0.05,
          glareDetected: isDemoTampered,
          passQualityCheck: true
        },
        ocr: {
          rawText: isDemoTampered 
            ? "REPUBLIC OF INDIA\nPASSPORT\nP9876543\nARIF\nMOHAMMED"
            : "REPUBLIC OF INDIA\nPASSPORT\nP5539201\nGUPTA\nANJALI",
          parsedFields: {
            "Document Type": "Passport",
            "Document Number": isDemoTampered ? "P9876543" : "P5539201",
            "Full Name": isDemoTampered ? "Mohd. Arif" : "Anjali Gupta",
            "Date of Birth": isDemoTampered ? "05/04/1993" : "12/06/1994"
          },
          confidenceScores: {
            "Document Number": 99.1,
            "Full Name": 98.6
          }
        },
        forensics: {
          tamperDetected: isDemoTampered,
          tamperConfidenceScore: isDemoTampered ? 87.5 : 4.2,
          anomalyRegions: isDemoTampered ? [
            {
              region_label: "Digital Alteration (Expiry Date Zone)",
              bounding_box: { x: 260, y: 180, width: 130, height: 28 },
              error_variance: 58.4
            }
          ] : [],
          elaHeatmapBase64: isDemoTampered ? "MOCK_ELA" : null
        },
        biometrics: {
          faceMatchScore: isDemoTampered ? 48.2 : 93.8,
          verificationStatus: isDemoTampered ? "MISMATCH" : "MATCH_CONFIRMED",
          livenessCheck: {
            isLive: true,
            blinkDetected: true,
            minimumEar: 0.17,
            padScore: 0.94
          },
          earFrameSeries: [0.31, 0.30, 0.32, 0.17, 0.16, 0.31, 0.32, 0.31]
        },
        warnings: isDemoTampered ? [
          "DOCUMENT_EXPIRED: Expiry date 14/01/2026 is in the past.",
          "ELA_TAMPERING_DETECTED: High digital re-compression variance in expiry date region.",
          "BIOMETRIC_MISMATCH: Face comparison similarity is 48.2% (fails identity threshold)."
        ] : []
      };
      mockDatabase.saveCase(data);
    }
    setCaseData(data);
  }, [id]);

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
              {isHigh ? 91 : isMed ? 64 : 14}
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
            <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: '12px solid #F1F5F9', borderTopColor: riskColor, borderRightColor: isHigh || isMed ? riskColor : '#F1F5F9', borderBottomColor: '#F1F5F9', transform: 'rotate(-45deg)' }} />
            <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>GAUGE</span>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>Dynamic Risk Level</span>
        </div>

        {/* Action Recommendation */}
        <div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>RECOMMENDED CLEARANCE ACTION</span>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <div style={{ background: riskColor + '10', padding: '10px', borderRadius: '50%', color: riskColor, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}>
              {isHigh ? <AlertCircle size={28} /> : isMed ? <AlertTriangle size={28} /> : <ShieldCheck size={28} />}
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '16px', color: isHigh ? '#B91C1C' : isMed ? '#B45309' : '#047857', marginBottom: '6px' }}>
                {recommendationTitle}
              </strong>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                {recommendationDesc}
              </p>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600' }}>Status: </span>
                <span className={`recent-status status-${status === 'Approved' ? 'green' : status === 'Rejected' ? 'red' : 'amber'}`}>
                  {status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details / Warnings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Validation findings */}
        <Panel title="AUTOMATED VERIFICATION CHECKS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '8px 0' }}>
            {findings.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F8FAFC', paddingBottom: '10px', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)', fontWeight: '500' }}>
                  {item.status ? (
                    <CheckCircle size={16} color="#10B981" />
                  ) : (
                    <AlertTriangle size={16} color="#EF4444" />
                  )}
                  {item.name}
                </span>
                <strong style={{ color: item.status ? '#047857' : '#B91C1C' }}>
                  {item.val}
                </strong>
              </div>
            ))}
          </div>
        </Panel>

        {/* Quick Document Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Panel title="DOCUMENT INFORMATION SUMMARY">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              {[
                ["Document Holder", caseData.name || "N/A"],
                ["Document Type", caseData.docType || "N/A"],
                ["Identifier Number", caseData.docNo || "N/A"],
                ["Date of Birth", caseData.details?.dob || "N/A"],
                ["Expiry Date", caseData.details?.expiryDate || "N/A"],
                ["Nationality", caseData.details?.nationality || "Indian"]
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item[0]}</span>
                  <strong style={{ color: 'var(--text-dark)', wordBreak: 'break-word', textAlign: 'right' }}>{item[1]}</strong>
                </div>
              ))}
            </div>
          </Panel>

          {/* Warnings Log if any */}
          {warnings.length > 0 && (
            <section className="panel" style={{ border: '1px solid #FEE2E2', background: '#FEF2F2', padding: '20px' }}>
              <div className="panel-title" style={{ color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #FCA5A5', paddingBottom: '8px', marginBottom: '12px' }}>
                <AlertCircle size={18} color="#B91C1C" />
                <span>Validation Alerts &amp; Flag Details</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {warnings.map((w, idx) => (
                  <div key={idx} style={{ fontSize: '12.5px', color: '#991B1B', lineHeight: '1.4', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>•</span>
                    <span>{w}</span>
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
