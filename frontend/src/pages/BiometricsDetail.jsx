import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Fingerprint, Eye, Database, CheckCircle, AlertTriangle, ScanFace, Activity, ShieldCheck } from "lucide-react";
import { Panel } from "./DashboardLayout";
import { mockDatabase } from "../utils/mockDatabase";

export default function BiometricsDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);

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
        <p style={{ color: 'var(--text-muted)' }}>Loading biometrics...</p>
      </main>
    );
  }

  const bio = caseData.biometrics;
  const isMatch = bio.faceMatchScore >= 80;
  const hasBlink = bio.livenessCheck.blinkDetected;

  // Render EAR graph coords
  // earFrameSeries is typically [0.32, 0.31, 0.33, 0.18, 0.16, 0.32, 0.33, 0.32]
  const earPoints = bio.earFrameSeries || [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3];
  const width = 400;
  const height = 120;
  const padding = 20;

  // Convert points to SVG polyline coordinates
  const svgPoints = earPoints.map((val, idx) => {
    const x = padding + (idx * (width - 2 * padding)) / (earPoints.length - 1);
    // map 0.1 to 0.4 into height - padding down to padding
    const y = height - padding - ((val - 0.1) * (height - 2 * padding)) / 0.3;
    return `${x},${y}`;
  }).join(" ");

  return (
    <main className="content">
      {/* Heading */}
      <div className="page-heading dashboard-heading" style={{ marginBottom: '16px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>BIOMETRIC PORTAL</span>
          <h2 style={{ margin: '8px 0 4px' }}>Biometrics Analysis</h2>
          <p>Candidate Face Comparison &amp; Liveness Telemetry Check</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/dashboard/history" className="btn-primary" style={{ background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border)' }}>
            <ArrowLeft size={16} /> Back to History
          </Link>
          <Link to={`/cases/${id}`} className="btn-primary" style={{ background: 'var(--primary)', color: 'white' }}>
            <ShieldCheck size={16} /> Decision Override
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '8px' }}>
        <Link to={`/screening/${id}/results`} style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text-muted)', fontSize: '13px' }}>
          Overview Results
        </Link>
        <Link to={`/screening/${id}/biometrics`} style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--primary)', borderBottom: '2px solid var(--primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Fingerprint size={16} /> Biometrics Details
        </Link>
        <Link to={`/screening/${id}/forensics`} style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Eye size={16} /> Forensics &amp; ELA
        </Link>
        <Link to={`/screening/${id}/data`} style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={16} /> OCR &amp; Raw Fields
        </Link>
      </div>

      {/* Biometric Comparison Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        
        {/* Left Column: Photos Comparison */}
        <Panel title="PORTRAIT MATCHING (SIDE-BY-SIDE)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '16px 0' }}>
            
            {/* ID Document Photo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '180px', height: '220px', background: '#E2E8F0', borderRadius: '8px', border: '2px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ScanFace size={80} color="#94A3B8" />
                <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(15, 23, 42, 0.75)', color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: '600', letterSpacing: '0.05em' }}>
                  EXTRACTED FROM ID
                </div>
                {/* Green bounding box */}
                <div style={{ position: 'absolute', border: '2px solid #10B981', top: '35px', bottom: '35px', left: '30px', right: '30px', borderRadius: '4px', boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)' }} />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Credential Photograph</span>
            </div>

            {/* Live Capture */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '180px', height: '220px', background: '#E2E8F0', borderRadius: '8px', border: '2px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ScanFace size={80} color="#64748B" />
                <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(15, 23, 42, 0.75)', color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: '600', letterSpacing: '0.05em' }}>
                  LIVE STREAM CAPTURE
                </div>
                {/* Face mesh simulation overlay */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <path d="M 90,50 L 70,100 L 90,140 L 110,100 Z" fill="none" stroke="#3B82F6" strokeWidth="1" strokeDasharray="3" />
                  <circle cx="70" cy="100" r="3" fill="#3B82F6" />
                  <circle cx="110" cy="100" r="3" fill="#3B82F6" />
                  <circle cx="90" cy="140" r="3" fill="#3B82F6" />
                  <circle cx="90" cy="50" r="3" fill="#3B82F6" />
                </svg>
                <div style={{ position: 'absolute', border: `2px solid ${isMatch ? '#10B981' : '#EF4444'}`, top: '35px', bottom: '35px', left: '30px', right: '30px', borderRadius: '4px' }} />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Live Verification Camera</span>
            </div>

          </div>

          {/* Match Score Display */}
          <div style={{ display: 'flex', background: '#F8FAFC', borderRadius: '8px', padding: '16px', border: '1px solid var(--border)', marginTop: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>VERIFICATION SIMILARITY</span>
              <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-dark)', marginTop: '4px' }}>
                {isMatch ? "Confidence Score: MATCH" : "Confidence Score: MISMATCH ALERT"}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: isMatch ? '#10B981' : '#EF4444' }}>
                {bio.faceMatchScore}%
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(Threshold: 80%)</span>
            </div>
          </div>
        </Panel>

        {/* Right Column: Liveness Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Liveness signals checklist */}
          <Panel title="ANTI-SPOOFING LIVENESS AUDIT">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  {hasBlink ? <CheckCircle size={16} color="#10B981" /> : <AlertTriangle size={16} color="#F59E0B" />}
                  Eye Blink Sensor (EAR Dip)
                </span>
                <strong style={{ fontSize: '13px' }}>{hasBlink ? "Detected" : "Not Found"}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <CheckCircle size={16} color="#10B981" />
                  3D Depth/Texture Check (PAD)
                </span>
                <strong style={{ fontSize: '13px' }}>Passed (Score: {bio.livenessCheck.padScore})</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <CheckCircle size={16} color="#10B981" />
                  Print/Replay Attack Signature
                </span>
                <strong style={{ fontSize: '13px' }}>Clear (No screen detected)</strong>
              </div>
            </div>
          </Panel>

          {/* EAR curve telemetry line chart */}
          <Panel title="EYE ASPECT RATIO (EAR) GRAPH">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Real-time EAR metrics. A distinct dip indicates voluntary blink event.
              </span>
              
              {/* SVG Line Graph */}
              <div style={{ background: '#0F172A', borderRadius: '8px', padding: '8px', display: 'flex', justifyContent: 'center' }}>
                <svg width={width} height={height}>
                  {/* Grid Lines */}
                  <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#334155" strokeDasharray="3" />
                  <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#334155" strokeDasharray="3" />
                  
                  {/* Polyline */}
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    points={svgPoints}
                  />

                  {/* Draw points */}
                  {earPoints.map((val, idx) => {
                    const x = padding + (idx * (width - 2 * padding)) / (earPoints.length - 1);
                    const y = height - padding - ((val - 0.1) * (height - 2 * padding)) / 0.3;
                    return (
                      <circle key={idx} cx={x} cy={y} r="4" fill="#34D399" />
                    );
                  })}
                  
                  {/* Label blink dip */}
                  {hasBlink && (
                    <g transform="translate(180, 105)">
                      <rect x="0" y="0" width="80" height="15" rx="3" fill="#B45309" />
                      <text x="40" y="11" fill="white" fontSize="9" fontFamily="sans-serif" textAnchor="middle">BLINK DETECTED</text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Min EAR indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Minimum Aspect Ratio achieved:</span>
                <strong>{bio.livenessCheck.minimumEar} (Threshold: 0.20)</strong>
              </div>
            </div>
          </Panel>
        </div>

      </div>
    </main>
  );
}
