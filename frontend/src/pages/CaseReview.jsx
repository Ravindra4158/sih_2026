import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, AlertCircle, CheckCircle, ShieldAlert, FileText, Send, UserCheck, UserX, AlertTriangle } from "lucide-react";
import { Panel } from "./DashboardLayout";
import { mockDatabase } from "../utils/mockDatabase";

export default function CaseReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [notes, setNotes] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let data = mockDatabase.getCaseById(id);
    if (!data) {
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
          issueDate: "14/08/2021",
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
    setNotes(data.reviewNotes || "");
  }, [id]);

  if (!caseData) {
    return (
      <main className="content" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading case details...</p>
      </main>
    );
  }

  const handleDecision = (newStatus) => {
    let newRisk = caseData.riskLevel;
    if (newStatus === "Approved") newRisk = "Low";
    if (newStatus === "Rejected") newRisk = "High";
    if (newStatus === "Pending") newRisk = "Medium";

    const updatedCase = {
      ...caseData,
      status: newStatus,
      riskLevel: newRisk,
      reviewNotes: notes
    };

    mockDatabase.saveCase(updatedCase);
    setSuccessMsg(`Decision successfully logged! Candidate status set to ${newStatus.toUpperCase()}.`);
    
    setTimeout(() => {
      navigate("/dashboard/history");
    }, 1500);
  };

  return (
    <main className="content">
      {/* Heading */}
      <div className="page-heading dashboard-heading" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>DECISION TERMINAL</span>
          <h2 style={{ margin: '8px 0 4px' }}>Manual Case Override</h2>
          <p>Verify risk indicators, input officer log entries, and override final clearance status.</p>
        </div>
        <Link to={`/screening/${id}/results`} className="btn-primary" style={{ background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border)' }}>
          <ArrowLeft size={16} /> View Screening Results
        </Link>
      </div>

      {successMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={18} color="#10B981" />
          <span>{successMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Decision Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Panel title="OFFICER REVIEW LOG &amp; DECISION">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>
                Review Notes &amp; Rationale (Required for Override)
              </label>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detail observations here, explaining why checks were cleared or why candidate screening was rejected..."
                style={{ 
                  width: '100%', 
                  height: '140px', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--border)', 
                  fontSize: '13.5px', 
                  fontFamily: 'inherit',
                  resize: 'none',
                  color: 'var(--text-dark)'
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>SELECT FINAL ACTION RESOLUTION:</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  
                  <button 
                    onClick={() => handleDecision("Approved")}
                    className="btn-primary" 
                    style={{ background: '#16A34A', padding: '14px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', height: 'auto' }}
                  >
                    <UserCheck size={18} />
                    <span>Approve Candidate</span>
                  </button>

                  <button 
                    onClick={() => handleDecision("Pending")}
                    className="btn-primary" 
                    style={{ background: '#F59E0B', padding: '14px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', height: 'auto' }}
                  >
                    <AlertTriangle size={18} />
                    <span>Refer Secondary</span>
                  </button>

                  <button 
                    onClick={() => handleDecision("Rejected")}
                    className="btn-primary" 
                    style={{ background: '#DC2626', padding: '14px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', height: 'auto' }}
                  >
                    <UserX size={18} />
                    <span>Reject Candidate</span>
                  </button>

                </div>
              </div>

            </div>
          </Panel>

          {/* Quick Case Identifiers */}
          <Panel title="CANDIDATE DOSSIER INFO">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', padding: '8px 0' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Name:</span>
                <strong>{caseData.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Document Type:</span>
                <strong>{caseData.docType}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Identifier ID:</span>
                <strong>{caseData.docNo}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Assigned Checkpoint:</span>
                <strong>Terminal 3, Alpha</strong>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Side: Warnings / Alerts */}
        <section className="panel" style={{ border: caseData.warnings.length > 0 ? '1px solid #FEE2E2' : '1px solid var(--border)', background: caseData.warnings.length > 0 ? '#FEF2F2' : 'white', padding: '24px' }}>
          <div className="panel-title" style={{ color: caseData.warnings.length > 0 ? '#991B1B' : 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${caseData.warnings.length > 0 ? '#FCA5A5' : 'var(--border)'}`, paddingBottom: '10px', marginBottom: '16px' }}>
            <ShieldAlert size={18} color={caseData.warnings.length > 0 ? '#B91C1C' : 'var(--text-dark)'} />
            <span>Active Flag Warnings ({caseData.warnings.length})</span>
          </div>

          {caseData.warnings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {caseData.warnings.map((w, idx) => (
                <div key={idx} style={{ background: 'white', borderLeft: '3px solid #EF4444', borderRadius: '4px', padding: '12px', fontSize: '12.5px', color: '#991B1B', lineHeight: '1.5', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  {w}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#F0FDF4', color: '#166534', borderRadius: '6px', fontSize: '13px' }}>
              <CheckCircle size={18} color="#15803D" />
              <span>No critical warning flags found in automated scan stages. Candidate qualifies for baseline criteria.</span>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
