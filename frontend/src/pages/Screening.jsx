import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Panel } from "./DashboardLayout";
import {
  Bell, Upload, FileText, Camera, ArrowRight, ScanFace,
  Check, Eye, HelpCircle, User, CreditCard, Shield, Sparkles,
  RotateCcw, Sliders, ChevronRight, ChevronLeft, ShieldCheck, Play, Loader2
} from "lucide-react";
import { mockDatabase } from "../utils/mockDatabase";
import { processOcrDocument } from "../services/api";

export default function Screening() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0); // Step 0: Profile, Step 1: Scan
  const [docType, setDocType] = useState("Passport");
  const [candidateName, setCandidateName] = useState("");
  const [simulateTampered, setSimulateTampered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Files & Previews
  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  // Camera States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraTarget, setCameraTarget] = useState(null); // 'document' or 'selfie'
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Quality metrics checklist
  const [qualityChecks, setQualityChecks] = useState({
    resolution: "Pending",
    blur: "Pending",
    lighting: "Pending",
    glare: "Pending"
  });

  // Access Webcam API
  const startCamera = async (target) => {
    setCameraTarget(target);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Webcam access denied or unavailable. Running in simulation mode.", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (streamRef.current && videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");

      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], `${cameraTarget}_capture.jpg`, { type: "image/jpeg" });
          if (cameraTarget === "document") {
            setDocPreview(dataUrl);
            setDocFile(capturedFile);
          } else {
            setSelfiePreview(dataUrl);
            setSelfieFile(capturedFile);
          }
        }
      }, "image/jpeg", 0.95);
    } else {
      if (cameraTarget === "document") {
        setDocPreview("SIMULATED_DOC_IMAGE");
        setDocFile(true);
      } else {
        setSelfiePreview("SIMULATED_SELFIE_IMAGE");
        setSelfieFile(true);
      }
    }
    stopCamera();
  };

  // Run a mock Image Quality Assessment when doc preview changes
  useEffect(() => {
    if (docPreview) {
      setQualityChecks({
        resolution: "1920x1080 (HD)",
        blur: "0.04 (EXCELLENT)",
        lighting: "94% (OPTIMAL)",
        glare: simulateTampered ? "HIGH DENSITY (WARNING)" : "None (PASSED)"
      });
    } else {
      setQualityChecks({
        resolution: "Pending",
        blur: "Pending",
        lighting: "Pending",
        glare: "Pending"
      });
    }
  }, [docPreview, simulateTampered]);

  const handleStartScreening = async (e) => {
    e.preventDefault();

    if (!docFile) {
      alert("Please upload or capture a document to begin screening.");
      return;
    }

    setIsSubmitting(true);
    const uniqueId = `BR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    let hint = "AUTO";
    if (docType.includes("Aadhaar")) hint = "AADHAAR";
    else if (docType.includes("PAN")) hint = "PAN";
    else if (docType.includes("Passport")) hint = "PASSPORT";

    let ocrResponse = null;
    try {
      if (docFile instanceof Blob || docFile instanceof File) {
        ocrResponse = await processOcrDocument(docFile, hint);
      }
    } catch (err) {
      console.warn("Backend live OCR call notice (using fallback values if necessary):", err);
    }

    const parsed = ocrResponse?.parsed_fields || {};
    const detectedDocType = ocrResponse?.document_type || docType;
    const finalName = parsed.name || candidateName.trim() || "Anjali Gupta";
    const finalDocNo = parsed.aadhaar_number || parsed.pan_number || parsed.document_number || (docType === "Passport" ? "P5539201" : "9982 1042 8847");
    const finalDob = parsed.date_of_birth || "12/06/1994";
    const finalGender = parsed.sex === "F" ? "Female" : parsed.sex === "M" ? "Male" : "Other";
    const finalNationality = parsed.nationality || "Indian";

    const newCase = {
      id: uniqueId,
      date: new Date().toLocaleString("en-IN", { hour12: true, dateStyle: "medium", timeStyle: "short" }),
      name: finalName,
      docType: detectedDocType,
      docNo: finalDocNo,
      riskLevel: simulateTampered ? "High" : "Low",
      status: "Pending",
      officer: "Rajesh K.",
      reviewNotes: "",
      details: {
        dob: finalDob,
        nationality: finalNationality,
        gender: finalGender,
        issueDate: parsed.issue_date || "14/08/2021",
        expiryDate: parsed.expiry_date || (docType === "Passport" ? (simulateTampered ? "13/08/2026" : "13/08/2031") : "N/A")
      },
      iqa: {
        blurScore: ocrResponse?.iqa_metrics?.blur_score ?? 0.05,
        glareDetected: ocrResponse?.iqa_metrics?.glare_detected ?? simulateTampered,
        passQualityCheck: ocrResponse?.iqa_metrics?.pass_quality_check ?? true
      },
      ocr: {
        rawText: ocrResponse?.raw_text || (docType === "Passport"
          ? `REPUBLIC OF INDIA\nPASSPORT\nType: P  Country Code: IND  Passport No: ${finalDocNo}\nSurname: GUPTA\nGiven Names: ${finalName}\nNationality: INDIAN\nDate of birth: ${finalDob}`
          : `GOVERNMENT OF INDIA\n${finalName}\nDOB: ${finalDob}\n${finalDocNo}`),
        parsedFields: {
          "Document Type": detectedDocType,
          "Document Number": finalDocNo,
          "Full Name": finalName,
          "Date of Birth": finalDob,
          ...(parsed.father_name ? { "Father's Name": parsed.father_name } : {})
        },
        confidenceScores: ocrResponse?.confidence_scores || {
          "Document Number": 99.1,
          "Full Name": 98.6,
          "Date of Birth": 97.4
        }
      },
      forensics: {
        tamperDetected: simulateTampered,
        tamperConfidenceScore: simulateTampered ? 87.5 : 4.2,
        anomalyRegions: simulateTampered ? [
          {
            region_label: "Digital Modification (Expiry Date Zone)",
            bounding_box: { x: 260, y: 180, width: 130, height: 28 },
            error_variance: 58.4
          }
        ] : [],
        elaHeatmapBase64: simulateTampered ? "MOCK_ELA" : null
      },
      biometrics: {
        faceMatchScore: simulateTampered ? 48.2 : 93.8,
        verificationStatus: simulateTampered ? "MISMATCH" : "MATCH_CONFIRMED",
        livenessCheck: {
          isLive: true,
          blinkDetected: true,
          minimumEar: 0.17,
          padScore: 0.94
        },
        earFrameSeries: [0.31, 0.30, 0.32, 0.17, 0.16, 0.31, 0.32, 0.31]
      },
      warnings: simulateTampered ? [
        "DOCUMENT_EXPIRED: Expiry date 13/08/2026 is in the past.",
        "ELA_TAMPERING_DETECTED: High digital re-compression variance in expiry date region.",
        "BIOMETRIC_MISMATCH: Face comparison similarity is 48.2% (fails identity threshold)."
      ] : []
    };

    mockDatabase.saveCase(newCase);
    setIsSubmitting(false);
    navigate(`/screening/${uniqueId}`);
  };

  const docTypes = [
    { name: "Passport", desc: "International Travel", icon: FileText, color: "#2563EB" },
    { name: "Aadhaar Card", desc: "UIDAI National ID", icon: ScanFace, color: "#DC2626" },
    { name: "PAN Card", desc: "Tax Identification", icon: CreditCard, color: "#16A34A" },
    { name: "Driving Licence", desc: "Transport Dept ID", icon: Shield, color: "#9333EA" }
  ];

  return (
    <>
      <header className="mobile-header">
        <button className="menu-btn">☰</button>
        <h2>New Screening</h2>
        <Bell className="bell-icon" size={20} />
      </header>

      <main className="content screening-content" style={{ maxWidth: '1040px', margin: '0 auto' }}>

        {/* Banner with gradient overlay */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '16px', borderRadius: '12px', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScanFace size={32} />
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#60A5FA', letterSpacing: '0.15em', display: 'block', marginBottom: '4px' }}>SECURE GATEWAY</span>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: 0 }}>Border Screening Hub</h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px', lineHeight: '1.4' }}>Deploy validation checks, OCR extraction, and biometric spoof protection.</p>
            </div>
          </div>

          {/* Stepped progress indicators */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: activeStep === 0 ? 'var(--primary)' : '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', border: '2px solid rgba(255,255,255,0.1)' }}>
                {activeStep > 0 ? <Check size={14} /> : "1"}
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: '600', color: activeStep === 0 ? 'white' : '#94A3B8' }}>Candidate profile</span>
            </div>
            <div style={{ width: '20px', height: '1px', background: 'rgba(255, 255, 255, 0.15)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: activeStep === 1 ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: activeStep === 1 ? 'white' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', border: '2px solid rgba(255,255,255,0.1)' }}>
                2
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: '600', color: activeStep === 1 ? 'white' : '#64748B' }}>Sensor validation</span>
            </div>
          </div>
        </div>

        {/* Step 1: Profile & Document Selection */}
        {activeStep === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
            <Panel title="CANDIDATE DOSSIER INFO">
              <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Full name input with glowing border */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-dark)' }}>Candidate Full Name</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="e.g. Anjali Gupta"
                      style={{
                        width: '100%',
                        padding: '14px 14px 14px 46px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: 'white',
                        fontSize: '14.5px',
                        color: 'var(--text-dark)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                </div>

                {/* Custom Card Selection Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-dark)' }}>Select Identification Document Type</label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {docTypes.map((item) => {
                      const isSelected = docType === item.name;
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.name}
                          onClick={() => setDocType(item.name)}
                          style={{
                            border: isSelected ? `2.5px solid ${item.color}` : '1.5px solid var(--border)',
                            background: isSelected ? `${item.color}07` : 'white',
                            borderRadius: '12px',
                            padding: '18px 20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? `0 8px 16px ${item.color}15` : '0 2px 4px rgba(0,0,0,0.01)'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = '#94A3B8';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          <div style={{
                            background: isSelected ? item.color : '#F1F5F9',
                            color: isSelected ? 'white' : 'var(--text-muted)',
                            padding: '12px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}>
                            <Icon size={20} />
                          </div>

                          <div style={{ flex: 1 }}>
                            <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-dark)' }}>{item.name}</strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</span>
                          </div>

                          {isSelected && (
                            <div style={{ background: item.color, color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </Panel>

            <button
              type="button"
              onClick={() => {
                if (!candidateName.trim()) {
                  alert("Please enter Candidate Full Name before proceeding.");
                  return;
                }
                setActiveStep(1);
              }}
              className="btn-primary"
              style={{ padding: '16px', fontSize: '15px', display: 'flex', gap: '8px', alignSelf: 'flex-end', minWidth: '220px', borderRadius: '10px' }}
            >
              Continue to Captures <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Uploads & Camera HUD Scanner */}
        {activeStep === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: '24px', alignItems: 'start', animation: 'fadeIn 0.3s ease-out' }}>

            {/* Left side: Upload Cards & Simulator */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Panel title="UPLOAD CHANNELS">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>

                  {/* Document scan card */}
                  <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>1. Document Photograph</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JPG, PNG or PDF (Max 5MB)</span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '80px', height: '55px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {docPreview ? (
                          docPreview.startsWith("data:") ? (
                            <img src={docPreview} alt="doc preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--primary)' }}>
                              <Check size={18} />
                              <span style={{ fontSize: '9px', fontWeight: 'bold' }}>CAPTURED</span>
                            </div>
                          )
                        ) : (
                          <FileText size={20} color="#CBD5E1" />
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                        <button
                          type="button"
                          onClick={() => startCamera("document")}
                          className="btn-primary"
                          style={{ flex: 1, padding: '10px', fontSize: '12.5px', background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border)', boxShadow: 'none' }}
                        >
                          <Camera size={14} /> Scan camera
                        </button>
                        <label className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '12.5px', background: 'var(--primary)', color: 'white', cursor: 'pointer', textAlign: 'center' }}>
                          <Upload size={14} /> Select file
                          <input
                            type="file"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                setDocFile(e.target.files[0]);
                                setDocPreview(URL.createObjectURL(e.target.files[0]));
                              }
                            }}
                            accept=".jpg,.png,.pdf"
                            hidden
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Selfie scan card */}
                  <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>2. Live Face Portrait</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Realtime biometric match</span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '80px', height: '55px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selfiePreview ? (
                          selfiePreview.startsWith("data:") ? (
                            <img src={selfiePreview} alt="selfie preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9333EA' }}>
                              <Check size={18} />
                              <span style={{ fontSize: '9px', fontWeight: 'bold' }}>CAPTURED</span>
                            </div>
                          )
                        ) : (
                          <ScanFace size={20} color="#CBD5E1" />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => startCamera("selfie")}
                        className="btn-primary"
                        style={{ flex: 1, padding: '10px', fontSize: '12.5px', background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border)', boxShadow: 'none' }}
                      >
                        <Camera size={14} /> Capture live selfie
                      </button>
                    </div>
                  </div>

                </div>
              </Panel>

              {/* Test Bypass Simulator */}
              <section className="panel" style={{ border: '1px solid #DBEAFE', background: '#EFF6FF', padding: '20px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--primary)', borderBottom: '1px solid #BFDBFE', paddingBottom: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={16} />
                  <span style={{ fontSize: '13.5px', fontWeight: '700' }}>Pipeline Scenario Simulator</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '12px', color: '#1E3A8A', lineHeight: '1.5' }}>
                    Choose the target response path to simulate validation triggers.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', fontWeight: '600', color: '#1E3A8A', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={simulateTampered}
                      onChange={(e) => setSimulateTampered(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>Inject Expiry failure &amp; Forensic ELA Tamper warning</span>
                  </label>
                </div>
              </section>

              {/* Navigation button panel */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveStep(0)}
                  className="btn-primary"
                  style={{ background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border)', padding: '12px 20px', fontSize: '13px', display: 'flex', gap: '6px', borderRadius: '8px', boxShadow: 'none' }}
                >
                  <ChevronLeft size={16} /> Edit Profile
                </button>

                <button
                  type="button"
                  onClick={handleStartScreening}
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    padding: '12px 24px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    background: isSubmitting ? '#94A3B8' : 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 16px rgba(37,99,235,0.2)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Extracting with EasyOCR...</span>
                    </>
                  ) : (
                    <>
                      <span>Initiate Secure Run</span>
                      <Play size={14} fill="white" />
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Right side: Interactive camera viewfinder & quality metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* High-fidelity camera viewfinder panel */}
              <Panel title={cameraActive ? `CAPTURING: ${cameraTarget.toUpperCase()}` : "HUD VIEW FINDER"}>
                {cameraActive ? (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '260px',
                    background: '#020617',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #1E293B'
                  }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Viewfinder crosshairs overlay */}
                    <div style={{ position: 'absolute', top: '20px', bottom: '20px', left: '20px', right: '20px', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: '20px', height: '20px', borderTop: '3px solid #60A5FA', borderLeft: '3px solid #60A5FA', top: '15px', left: '15px' }} />
                    <div style={{ position: 'absolute', width: '20px', height: '20px', borderTop: '3px solid #60A5FA', borderRight: '3px solid #60A5FA', top: '15px', right: '15px' }} />
                    <div style={{ position: 'absolute', width: '20px', height: '20px', borderBottom: '3px solid #60A5FA', borderLeft: '3px solid #60A5FA', bottom: '15px', left: '15px' }} />
                    <div style={{ position: 'absolute', width: '20px', height: '20px', borderBottom: '3px solid #60A5FA', borderRight: '3px solid #60A5FA', bottom: '15px', right: '15px' }} />

                    {/* Sweeping laser bar */}
                    <div style={{
                      position: 'absolute',
                      left: '10px',
                      right: '10px',
                      height: '2px',
                      background: '#3B82F6',
                      boxShadow: '0 0 15px #3B82F6',
                      animation: 'laserSweep 2.5s infinite ease-in-out'
                    }} />

                    {/* Camera Control overlay */}
                    <div style={{ position: 'absolute', bottom: '16px', display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="btn-primary"
                        style={{ background: '#10B981', padding: '8px 16px', fontSize: '12px', borderRadius: '6px' }}
                      >
                        Capture Frame
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="btn-primary"
                        style={{ background: '#EF4444', padding: '8px 16px', fontSize: '12px', borderRadius: '6px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    height: '260px',
                    background: '#090D1A',
                    borderRadius: '10px',
                    border: '1.5px dashed rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '16px',
                    position: 'relative'
                  }}>
                    {/* Simulated vector grid backdrop */}
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.03, background: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px) 0 0/16px 16px, linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px) 0 0/16px 16px' }} />

                    <Camera size={44} color="#334155" />
                    <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '500' }}>Webcam Feed Offline. Click Capture to scan.</span>
                  </div>
                )}
              </Panel>

              {/* Graphical Image Quality Assessment (IQA) */}
              <Panel title="QUALITY CHECK TELEMETRY">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0', fontSize: '13px' }}>

                  {/* Resolution bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Resolution Check</span>
                      <strong style={{ color: qualityChecks.resolution !== "Pending" ? '#10B981' : 'var(--text-muted)' }}>{qualityChecks.resolution}</strong>
                    </div>
                    <div style={{ height: '5px', background: '#F1F5F9', borderRadius: '3px' }}>
                      <div style={{ width: qualityChecks.resolution !== "Pending" ? '100%' : '0%', height: '100%', background: '#10B981', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  {/* Blur bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Blur Margin Index</span>
                      <strong style={{ color: qualityChecks.blur !== "Pending" ? '#10B981' : 'var(--text-muted)' }}>{qualityChecks.blur}</strong>
                    </div>
                    <div style={{ height: '5px', background: '#F1F5F9', borderRadius: '3px' }}>
                      <div style={{ width: qualityChecks.blur !== "Pending" ? '92%' : '0%', height: '100%', background: '#10B981', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  {/* Lighting bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Lighting Contrast</span>
                      <strong style={{ color: qualityChecks.lighting !== "Pending" ? '#10B981' : 'var(--text-muted)' }}>{qualityChecks.lighting}</strong>
                    </div>
                    <div style={{ height: '5px', background: '#F1F5F9', borderRadius: '3px' }}>
                      <div style={{ width: qualityChecks.lighting !== "Pending" ? '94%' : '0%', height: '100%', background: '#10B981', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  {/* Glare check */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Glare Deflection</span>
                      <strong style={{ color: qualityChecks.glare === "None (PASSED)" ? '#10B981' : qualityChecks.glare.includes("WARNING") ? '#EF4444' : 'var(--text-muted)' }}>
                        {qualityChecks.glare}
                      </strong>
                    </div>
                    <div style={{ height: '5px', background: '#F1F5F9', borderRadius: '3px' }}>
                      <div style={{
                        width: qualityChecks.glare !== "Pending" ? '100%' : '0%',
                        height: '100%',
                        background: simulateTampered ? '#EF4444' : '#10B981',
                        borderRadius: '3px',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>

                </div>
              </Panel>

            </div>

          </div>
        )}

      </main>

      {/* Viewfinder keyframe animations */}
      <style>{`
        @keyframes laserSweep {
          0% { top: 5%; }
          50% { top: 95%; }
          100% { top: 5%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
