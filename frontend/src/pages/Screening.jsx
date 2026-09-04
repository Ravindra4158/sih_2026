import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Panel } from "./DashboardLayout";
import {
  Bell, Upload, FileText, Camera, ArrowRight, ScanFace,
  Check, Eye, HelpCircle, User, CreditCard, Shield, Sparkles,
  RotateCcw, ShieldCheck, Play, Loader2, X
} from "lucide-react";

export default function Screening() {
  const navigate = useNavigate();
  const [activeStep] = useState(1); // Open directly on the document upload step


  const [isSubmitting, setIsSubmitting] = useState(false);

  // Files & Previews (multiple documents)
  const [docFiles, setDocFiles] = useState([]); // array of { file, preview, type }
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [documentResolution, setDocumentResolution] = useState(null);

  useEffect(() => {
    const preview = docFiles[0]?.preview;
    if (!preview || !preview.startsWith("data:image")) {
      setDocumentResolution(null);
      return;
    }

    const image = new Image();
    image.onload = () => setDocumentResolution(`${image.naturalWidth} x ${image.naturalHeight}`);
    image.src = preview;
  }, [docFiles]);

  // Camera States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraTarget, setCameraTarget] = useState(null); // 'document' or 'selfie'
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Access Webcam API
  const startCamera = async (target) => {
    setCameraTarget(target);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } });
      streamRef.current = stream;
      // Wait a tick for <video> element to mount if it wasn't rendered yet
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
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
            // Add captured document to the multi-file list
            const newDoc = { file: capturedFile, preview: dataUrl, type: "Document" };
            setDocFiles(prev => [...prev, newDoc]);
          } else {
            setSelfiePreview(dataUrl);
            setSelfieFile(capturedFile);
          }
        }
      }, "image/jpeg", 0.95);
    } else {
      if (cameraTarget === "document") {
        // Simulated document capture – add placeholder entry
        const placeholder = { file: true, preview: "SIMULATED_DOC_IMAGE", type: "Document" };
        setDocFiles(prev => [...prev, placeholder]);
      } else {
        setSelfiePreview("SIMULATED_SELFIE_IMAGE");
        setSelfieFile(true);
      }
    }
    stopCamera();
  };

  // docType selected from the doc type cards
  const [docType, setDocType] = useState("Passport");
  const [candidateName, setCandidateName] = useState("");

  const handleStartScreening = (e) => {
    e.preventDefault();

    if (docFiles.length === 0) {
      alert("Please upload or capture at least one document to begin screening.");
      return;
    }

    setIsSubmitting(true);

    // Generate unique Case ID based on timestamp
    const now = new Date();
    const timestampStr = now.toISOString().replace(/[-T:.Z]/g, "").slice(4, 14); // MMDDHHMMSS
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const uniqueId = `BR-2026-${timestampStr}-${randomSuffix}`;

    // Serialise only the data-URL previews and metadata (Files cannot be stored in sessionStorage)
    const sessionPayload = {
      uniqueId,
      docType,
      candidateName: candidateName.trim() || "",
      // Serialise doc previews (base64 data URLs)
      docPreviews: docFiles.map(d => ({ preview: d.preview || null, name: d.file?.name || "document" })),
      selfiePreview: selfiePreview || null,
    };

    try {
      sessionStorage.setItem(`screening_${uniqueId}`, JSON.stringify(sessionPayload));
    } catch (err) {
      console.warn("sessionStorage write failed:", err);
    }

    // Navigate immediately — ScreeningPipeline will run all API calls and log them live
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

      {/* Step 2: Uploads & Camera HUD Scanner */}
      {activeStep === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: '24px', alignItems: 'start', animation: 'fadeIn 0.3s ease-out' }}>

          {/* Left side: Upload Cards & Simulator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Panel title="UPLOAD CHANNELS">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>

                {/* Document upload zone (multiple) */}
                <div className="dropzone" onDrop={e => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  files.forEach(f => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setDocFiles(prev => [...prev, { file: f, preview: reader.result, type: 'Document' }]);
                    };
                    reader.readAsDataURL(f);
                  });
                }} onDragOver={e => e.preventDefault()} style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}>
                  <p style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>Drag & Drop documents here or click to select</p>
                  <input type="file" multiple accept=".jpg,.png,.jpeg,.pdf" onChange={e => {
                    const files = Array.from(e.target.files);
                    files.forEach(f => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setDocFiles(prev => [...prev, { file: f, preview: reader.result, type: 'Document' }]);
                      };
                      reader.readAsDataURL(f);
                    });
                  }} style={{ display: 'none' }} id="doc-upload-input" />
                  <label htmlFor="doc-upload-input" className="btn-primary" style={{ cursor: 'pointer' }}><Upload size={14} /> Select Files</label>
                </div>
                {/* Render file cards */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                  {docFiles.map((item, idx) => (
                    <div key={idx} className="file-card" style={{ width: '120px', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', position: 'relative' }}>
                      <div style={{ width: '100%', height: '80px', background: '#F8FAFC', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.preview && (item.preview.startsWith('data:image') || item.preview.startsWith('blob:')) ? (
                          <img src={item.preview} alt="doc preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <FileText size={24} color="#3B82F6" />
                        )}
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '11px', textAlign: 'center', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.file?.name || "document.png"}
                      </div>
                      <button type="button" onClick={() => setDocFiles(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={12} /></button>
                    </div>
                  ))}
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

            {/* Navigation button panel */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
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
                <div 
                  onClick={() => startCamera("selfie")}
                  style={{
                    height: '260px',
                    background: '#090D1A',
                    borderRadius: '10px',
                    border: '1.5px dashed rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '16px',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  {/* Simulated vector grid backdrop */}
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.03, background: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px) 0 0/16px 16px, linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px) 0 0/16px 16px' }} />

                  <Camera size={44} color="#60A5FA" />
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>Webcam Feed Offline. Click here to open camera.</span>
                </div>
              )}
            </Panel>

            <Panel title="QUALITY CHECK TELEMETRY">
              <div style={{ padding: '2px 16px 6px' }}>
                {[
                  ['Documents', docFiles.length ? `${docFiles.length} uploaded` : 'Waiting'],
                  ['Resolution', documentResolution || (docFiles.length ? 'Available after image scan' : 'Waiting')],
                  ['File size', docFiles[0]?.file?.size ? `${Math.round(docFiles[0].file.size / 1024)} KB` : 'Waiting'],
                  ['Selfie capture', selfieFile ? 'Captured' : 'Not captured']
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <strong style={{ color: docFiles.length ? 'var(--text-dark)' : 'var(--text-muted)', fontSize: '12px' }}>{value}</strong>
                  </div>
                ))}
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
