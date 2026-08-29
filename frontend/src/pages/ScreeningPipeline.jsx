import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertTriangle, AlertCircle, Play, ShieldAlert, Cpu } from "lucide-react";
import { mockDatabase } from "../utils/mockDatabase";

export default function ScreeningPipeline() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState([]);
  const [caseData, setCaseData] = useState(null);
  const logEndRef = useRef(null);

  const steps = [
    { name: "Image Quality Check", desc: "Checking glare, blur, and resolution" },
    { name: "Document Classification", desc: "Detecting document layout type" },
    { name: "OCR Data Extraction", desc: "Reading characters and parsing textual fields" },
    { name: "MRZ Checksum Validation", desc: "Validating ICAO check digits (if applicable)" },
    { name: "VIZ Format Verification", desc: "Validating name patterns and date ranges" },
    { name: "Forensics (ELA) Tampering Analysis", desc: "Running Error Level Analysis on image layers" },
    { name: "Biometric Face Matching", desc: "Comparing live photo with document portrait" },
    { name: "Liveness & Risk Score Assessment", desc: "Calculating multi-tier risk factor indicators" }
  ];

  useEffect(() => {
    // Load case data
    let data = mockDatabase.getCaseById(id);
    if (!data) {
      // Create a temporary case if it doesn't exist
      const tempCase = {
        id,
        date: new Date().toLocaleString(),
        name: "Anonymous Candidate",
        docType: "Passport",
        docNo: "P" + Math.floor(1000000 + Math.random() * 9000000),
        riskLevel: "Low",
        status: "Pending",
        officer: "Rajesh K.",
        reviewNotes: "",
        details: { dob: "01/01/1990", nationality: "Indian", gender: "Male", issueDate: "01/01/2020", expiryDate: "01/01/2030" },
        iqa: { blurScore: 0.05, glareDetected: false, passQualityCheck: true },
        ocr: { rawText: "RAW TEXT", parsedFields: {}, confidenceScores: {} },
        forensics: { tamperDetected: false, tamperConfidenceScore: 10.0, anomalyRegions: [], elaHeatmapBase64: null },
        biometrics: { faceMatchScore: 92.0, verificationStatus: "MATCH_CONFIRMED", livenessCheck: { isLive: true, blinkDetected: true, minimumEar: 0.16, padScore: 0.92 }, earFrameSeries: [0.3, 0.3, 0.15, 0.3] },
        warnings: []
      };
      mockDatabase.saveCase(tempCase);
      setCaseData(tempCase);
    } else {
      setCaseData(data);
    }
  }, [id]);

  useEffect(() => {
    if (!caseData) return;

    const warnings = Array.isArray(caseData.warnings) ? caseData.warnings : [];
    const iqa = caseData.iqa || {};
    const details = caseData.details || {};
    const forensics = caseData.forensics || {};
    const biometrics = caseData.biometrics || {};
    const liveness = biometrics.livenessCheck || {};

    const logMessages = [
      `[SYS] Initializing border screening pipeline for Case ID: ${id}...`,
      `[SYS] Document type declared: ${caseData.docType || "National ID"}`,
      `[IQA] Stage 1 starting: Running Image Quality Analysis...`,
      `[IQA] Resolution check: Passed. Blur score: ${iqa.blurScore ?? 0.05} (threshold: 0.15).`,
      `[IQA] Glare detection: ${iqa.glareDetected ? "WARNING - Optical reflection detected" : "Passed - No major glare found"}.`,
      `[SYS] Stage 2 starting: Document Type Classification...`,
      `[SYS] Rule-based classifier match: ${caseData.docType || "Document"} detected. Layout boundaries resolved.`,
      `[OCR] Stage 3 starting: Performing EasyOCR character extraction...`,
      `[OCR] Extracted document identity: ${caseData.name || "Candidate"} | Doc: ${caseData.docNo || "N/A"} | DOB: ${details.dob || "N/A"}.`,
      `[SYS] Stage 4 starting: Checking MRZ / Checksum validity...`,
      (caseData.docType || "").toLowerCase().includes("passport")
        ? `[MRZ] MRZ validation: ${warnings.some(w => typeof w === "string" && w.includes("MRZ")) ? "FAILED check digit comparison" : "PASSED check digit validation."}`
        : `[MRZ] MRZ validation: Skipping (non-passport/national ID layout).`,
      `[SYS] Stage 5 starting: VIZ Format & Expiry Rules check...`,
      warnings.some(w => typeof w === "string" && w.includes("EXPIRED")) 
        ? `[VIZ] Rule alert: Document expiry date (${details.expiryDate || "N/A"}) is in the PAST.` 
        : `[VIZ] Validation: Expiry date valid (${details.expiryDate || "N/A"}). Name format verified.`,
      `[SYS] Stage 6 starting: Running Error Level Analysis (ELA) forensics...`,
      forensics.tamperDetected 
        ? `[ELA] ALERT: Tampering detected! High pixel compression variance found in photo/date bounds.`
        : `[ELA] Forensic review complete. Uniform compression layers. Tampering probability: ${forensics.tamperConfidenceScore ?? 4.2}%.`,
      `[SYS] Stage 7 starting: Biometric Face Match & Liveness...`,
      `[BIO] Comparing live portrait with extracted ID photo. Sim: ${biometrics.faceMatchScore ?? 92}%.`,
      liveness.blinkDetected ?? true
        ? `[BIO] Liveness blink detection passed. Liveness score: ${liveness.padScore ?? 0.94}.`
        : `[BIO] Liveness check warning: Blink not detected in stream.`,
      `[SYS] Stage 8 starting: Computing aggregate Risk Score...`,
      `[SYS] Decision Engine resolved: Risk Level is ${(caseData.riskLevel || "LOW").toUpperCase()}. Routing to Officer ${caseData.officer || "Reviewer"}.`,
      `[SYS] Screening completed! Redirecting to results...`
    ];

    let currentLogIndex = 0;
    const intervalTime = 600;

    const timer = setInterval(() => {
      if (currentLogIndex < logMessages.length) {
        setLogs(prev => [...prev, logMessages[currentLogIndex]]);
        currentLogIndex++;

        // Increment currentStep based on processing phase milestones
        if (currentLogIndex === 3) setCurrentStep(1);
        if (currentLogIndex === 5) setCurrentStep(2);
        if (currentLogIndex === 8) setCurrentStep(3);
        if (currentLogIndex === 11) setCurrentStep(4);
        if (currentLogIndex === 13) setCurrentStep(5);
        if (currentLogIndex === 15) setCurrentStep(6);
        if (currentLogIndex === 18) setCurrentStep(7);
        if (currentLogIndex === 20) setCurrentStep(8);
      } else {
        clearInterval(timer);
        setTimeout(() => {
          navigate(`/screening/${id}/results`);
        }, 1000);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [caseData, id, navigate]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <main className="content">
      <div className="page-heading dashboard-heading" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>PIPELINE ENGINE</span>
          <h2 style={{ margin: '8px 0 4px' }}>Processing Case {id}</h2>
          <p>Please wait. Running multi-layered AI verification algorithms...</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Step checklist */}
        <section className="panel" style={{ padding: '24px' }}>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Cpu size={18} color="var(--primary)" />
            <span>Processing Checkpoints</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {steps.map((step, idx) => {
              const isCompleted = currentStep > idx;
              const isActive = currentStep === idx;

              return (
                <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                  {/* Vertical connector line */}
                  {idx < steps.length - 1 && (
                    <div style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '26px', 
                      bottom: '-20px', 
                      width: '2px', 
                      background: isCompleted ? 'var(--success)' : 'var(--border)',
                      zIndex: 1 
                    }} />
                  )}

                  <div style={{ zIndex: 2 }}>
                    {isCompleted ? (
                      <CheckCircle size={26} color="var(--success)" style={{ background: 'white' }} />
                    ) : isActive ? (
                      <div style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFF6FF', borderRadius: '50%' }}>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid #E2E8F0',
                          borderTop: '2px solid var(--primary)',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                      </div>
                    ) : (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid var(--border)', background: 'white' }} />
                    )}
                  </div>

                  <div>
                    <strong style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      color: isActive ? 'var(--primary)' : isCompleted ? 'var(--text-dark)' : 'var(--text-muted)',
                      fontWeight: isActive || isCompleted ? '600' : '500'
                    }}>
                      {step.name}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Logs Terminal */}
        <section className="panel" style={{ background: '#0F172A', color: '#38BDF8', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '520px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#1E293B', borderBottom: '1px solid #334155' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }}></div>
            </div>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', fontWeight: 'bold' }}>SYSTEM LOGS (TERMINAL)</span>
          </div>

          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, fontFamily: 'monospace', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px', scrollbarWidth: 'thin' }}>
            {logs.map((log, index) => {
              let color = '#38BDF8';
              if (log.includes('[SYS]')) color = '#94A3B8';
              if (log.includes('[IQA]')) color = '#F472B6';
              if (log.includes('[OCR]')) color = '#34D399';
              if (log.includes('ALERT') || log.includes('WARNING') || log.includes('FAILED')) color = '#F87171';

              return (
                <div key={index} style={{ color, whiteSpace: 'pre-wrap', lineHeight: '1.6', wordBreak: 'break-all' }}>
                  {log}
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </section>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
