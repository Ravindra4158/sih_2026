import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Fingerprint, Eye, Database, FileText, CheckCircle, BarChart2, ShieldCheck } from "lucide-react";
import { Panel } from "./DashboardLayout";
import { mockDatabase } from "../utils/mockDatabase";

export default function DocumentDataDetail() {
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
          issueDate: "14/08/2021",
          expiryDate: "13/08/2031"
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
        <p style={{ color: 'var(--text-muted)' }}>Loading OCR data...</p>
      </main>
    );
  }

  const ocr = caseData.ocr;
  const parsedKeys = Object.keys(ocr.parsedFields);

  return (
    <main className="content">
      {/* Heading */}
      <div className="page-heading dashboard-heading" style={{ marginBottom: '16px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>OCR &amp; DATA ENGINE</span>
          <h2 style={{ margin: '8px 0 4px' }}>Extracted Document Fields</h2>
          <p>Extracted raw OCR string buffers and parsed database fields</p>
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
        <Link to={`/screening/${id}/biometrics`} style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Fingerprint size={16} /> Biometrics Details
        </Link>
        <Link to={`/screening/${id}/forensics`} style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Eye size={16} /> Forensics &amp; ELA
        </Link>
        <Link to={`/screening/${id}/data`} style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--primary)', borderBottom: '2px solid var(--primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={16} /> OCR &amp; Raw Fields
        </Link>
      </div>

      {/* Data Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
        
        {/* Left: Raw OCR text */}
        <section className="panel" style={{ display: 'flex', flexDirection: 'column', height: '480px', padding: '0', overflow: 'hidden' }}>
          <div className="panel-title" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary)" />
            <span>Raw OCR Buffer Output</span>
          </div>
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#0F172A', color: '#F1F5F9', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.7', wordBreak: 'break-all' }}>
            {ocr.rawText}
          </div>
        </section>

        {/* Right: Parsed key-values with confidence meters */}
        <Panel title="PARSED IDENTIFIER FIELDS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
            {parsedKeys.map((key, idx) => {
              // Find matching confidence rating, or default
              let conf = 95.0;
              if (ocr.confidenceScores[key]) {
                conf = ocr.confidenceScores[key];
              } else if (key.includes("Type") || key.includes("Nationality")) {
                conf = 98.5;
              } else {
                conf = 94.0;
              }

              const confColor = conf >= 90 ? '#10B981' : conf >= 80 ? '#F59E0B' : '#EF4444';

              return (
                <div key={idx} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{key}</span>
                    <strong style={{ color: 'var(--text-dark)', wordBreak: 'break-word', textAlign: 'right' }}>{ocr.parsedFields[key]}</strong>
                  </div>
                  
                  {/* Confidence bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, height: '4px', background: '#E2E8F0', borderRadius: '2px' }}>
                      <div style={{ width: `${conf}%`, height: '100%', background: confColor, borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: confColor, width: '40px', textAlign: 'right' }}>
                      {conf}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

      </div>
    </main>
  );
}
