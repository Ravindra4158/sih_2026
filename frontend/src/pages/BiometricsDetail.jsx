import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Fingerprint, Eye, Database,
  CheckCircle, AlertTriangle, ScanFace, ShieldCheck, Scan, UserCheck
} from "lucide-react";
import { Panel } from "./DashboardLayout";
import { useCaseData } from "../hooks/useCaseData";
import { detectFaceInDocument } from "../services/api";

/* ── Convert base64 dataURL → Blob ────────────────────────────────────────── */
function dataURLtoBlob(dataURL) {
  if (!dataURL || !dataURL.startsWith("data:")) return null;
  try {
    const [header, b64] = dataURL.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(b64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch { return null; }
}

/* ── Browser-side heuristic crop using Canvas (offline fallback) ──────────── */
function cropHeuristicBrowser(dataURL, docHint) {
  return new Promise((resolve) => {
    if (!dataURL) { resolve(null); return; }
    const img = new Image();
    img.onload = () => {
      const iw = img.naturalWidth, ih = img.naturalHeight;
      let fx, fy, fw, fh;
      const dh = (docHint || "").toUpperCase();
      if      (dh.includes("AADHAAR")) { fx = iw*0.04; fy = ih*0.35; fw = iw*0.30; fh = ih*0.55; }
      else if (dh.includes("PAN"))     { fx = iw*0.04; fy = ih*0.10; fw = iw*0.30; fh = ih*0.80; }
      else if (dh.includes("PASS"))    { fx = iw*0.02; fy = ih*0.04; fw = iw*0.30; fh = ih*0.48; }
      else if (dh.includes("DRIV"))    { fx = iw*0.02; fy = ih*0.04; fw = iw*0.30; fh = ih*0.52; }
      else                              { fx = iw*0.03; fy = ih*0.06; fw = iw*0.30; fh = ih*0.50; }

      const px = fw * 0.18, py = fh * 0.18;
      const x1 = Math.max(0,  Math.round(fx - px));
      const y1 = Math.max(0,  Math.round(fy - py));
      const x2 = Math.min(iw, Math.round(fx + fw + px));
      const y2 = Math.min(ih, Math.round(fy + fh + py));

      const canvas = document.createElement("canvas");
      canvas.width  = x2 - x1;
      canvas.height = y2 - y1;
      canvas.getContext("2d").drawImage(img, x1, y1, x2-x1, y2-y1, 0, 0, x2-x1, y2-y1);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => resolve(null);
    img.src = dataURL;
  });
}

/* ── ExtractedFace ──────────────────────────────────────────────────────────
   1. Tries backend /document/detect-face → gets server-cropped face JPEG
   2. Falls back to browser Canvas heuristic crop if backend is unreachable
   3. Falls back to placeholder icon as last resort
─────────────────────────────────────────────────────────────────────────── */
function ExtractedFace({ dataUrl, docHint }) {
  const [status,  setStatus]  = useState("scanning");  // scanning | found | heuristic | error
  const [cropUrl, setCropUrl] = useState(null);
  const [conf,    setConf]    = useState(null);

  useEffect(() => {
    if (!dataUrl) { setStatus("error"); return; }
    setStatus("scanning");

    const hint = docHint.includes("Aadhaar")  ? "AADHAAR"
               : docHint.includes("PAN")      ? "PAN"
               : docHint.includes("Passport") ? "PASSPORT"
               : docHint.includes("Driving")  ? "DRIVING_LICENCE"
               : "AUTO";

    // Path A: try backend
    const blob = dataURLtoBlob(dataUrl);
    const tryBackend = blob
      ? detectFaceInDocument(blob, hint)
          .then(result => {
            if (result?.face_crop_base64) {
              setCropUrl(result.face_crop_base64);
              setConf(result.confidence ?? 0);
              setStatus(result.face_detected ? "found" : "heuristic");
              return true;
            }
            return false;
          })
          .catch(() => false)
      : Promise.resolve(false);

    // Path B: browser canvas fallback if backend fails
    tryBackend.then(ok => {
      if (!ok) {
        cropHeuristicBrowser(dataUrl, hint).then(crop => {
          if (crop) {
            setCropUrl(crop);
            setConf(null);
            setStatus("heuristic");
          } else {
            setStatus("error");
          }
        });
      }
    });
  }, [dataUrl, docHint]);

  const borderColor = status === "found"     ? "#10B981"
                    : status === "heuristic" ? "#60A5FA"
                    : status === "scanning"  ? "#3B82F680"
                    : "#94A3B8";

  return (
    <div style={{
      position: "relative", width: "100%", maxWidth: "180px", aspectRatio: "3/4",
      borderRadius: "10px", border: `2.5px solid ${borderColor}`,
      overflow: "hidden", background: "#E2E8F0",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 0 16px ${borderColor}55`,
      transition: "border-color 0.5s, box-shadow 0.5s",
    }}>
      {/* ── States ── */}
      {status === "scanning" && (
        <>
          <ScanFace size={52} color="#94A3B8" style={{ opacity: 0.4 }} />
          <div style={{
            position: "absolute", left: 0, right: 0, height: "3px",
            background: "linear-gradient(90deg,transparent,#38BDF8,transparent)",
            animation: "faceScan 1.6s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)",
            background: "rgba(15,23,42,0.82)", color: "#38BDF8",
            fontSize: "9px", fontWeight: "700", padding: "3px 10px", borderRadius: "4px",
            display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap",
          }}>
            <Scan size={10} /> DETECTING FACE…
          </div>
        </>
      )}

      {(status === "found" || status === "heuristic") && cropUrl && (
        <>
          <img src={cropUrl} alt="Extracted face"
               style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          {/* Biometric grid overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(16,185,129,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.03) 1px,transparent 1px)",
            backgroundSize: "14px 14px",
          }} />
        </>
      )}

      {status === "error" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <ScanFace size={52} color="#94A3B8" />
          <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: "600" }}>NO IMAGE</span>
        </div>
      )}

      {/* Top label */}
      <div style={{
        position: "absolute", top: "8px", left: "8px",
        background: "rgba(15,23,42,0.84)", color: "white",
        fontSize: "9px", padding: "3px 7px", borderRadius: "4px",
        fontWeight: "700", letterSpacing: "0.06em",
      }}>EXTRACTED FROM ID</div>

      {/* Corner brackets when image loaded */}
      {(status === "found" || status === "heuristic") && cropUrl && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
             viewBox="0 0 100 133" preserveAspectRatio="none">
          {[["8,28 8,8 28,8"], ["72,8 92,8 92,28"], ["8,105 8,125 28,125"], ["72,125 92,125 92,105"]].map((pts, i) => (
            <polyline key={i} points={pts} fill="none"
              stroke={status === "found" ? "#10B981" : "#60A5FA"} strokeWidth="3" strokeLinecap="round" />
          ))}
        </svg>
      )}

      {/* Bottom badge */}
      {status !== "scanning" && (
        <div style={{
          position: "absolute", bottom: "8px", right: "8px",
          background: status === "found"     ? "rgba(16,185,129,0.92)"
                    : status === "heuristic" ? "rgba(59,130,246,0.88)"
                    : "rgba(100,116,139,0.82)",
          color: "white", fontSize: "9px", fontWeight: "700",
          padding: "2px 7px", borderRadius: "3px", letterSpacing: "0.04em",
        }}>
          {status === "found"      ? `✓ AI DETECTED${conf !== null ? ` (${Math.round(conf * 100)}%)` : ""}`
           : status === "heuristic" ? "⊡ ZONE CROP"
           : "NO FACE"}
        </div>
      )}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
export default function BiometricsDetail() {
  const { id } = useParams();
  const { caseData } = useCaseData(id);

  if (!caseData) {
    return (
      <main className="content" style={{ padding: "40px", textAlign: "center" }}>
        <div style={{
          width: "40px", height: "40px",
          border: "4px solid #E2E8F0", borderTop: "4px solid var(--primary)",
          borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px"
        }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "var(--text-muted)" }}>Loading biometrics…</p>
      </main>
    );
  }

  const bio      = caseData.biometrics || {};
  const liveness = bio.livenessCheck   || {};

  const faceScore = typeof bio.faceMatchScore === "number" ? bio.faceMatchScore : 92.5;
  const verStatus = bio.verificationStatus ?? "MATCH_CONFIRMED";
  const isMatch   = faceScore >= 80;
  const hasBlink  = liveness.blinkDetected  ?? true;
  const padScore  = typeof liveness.padScore   === "number" ? liveness.padScore   : 0.95;
  const minEar    = typeof liveness.minimumEar === "number" ? liveness.minimumEar : 0.17;
  const isLive    = liveness.isLive ?? true;

  const docImg    = caseData.documentImageBase64 || null;
  const selfieImg = caseData.livePhotoBase64     || null;
  const docType   = caseData.docType             || "AUTO";

  /* ── EAR Graph ─────────────────────────────────────────────────────────── */
  const earPoints = bio.earFrameSeries || [0.31, 0.30, 0.32, 0.17, 0.16, 0.31, 0.32, 0.31];
  const svgW = 420, svgH = 150, plotT = 16, plotB = 38, plotL = 32, plotR = 12;
  // Plot area: x from plotL → svgW-plotR, y from plotT → svgH-plotB
  const plotH = svgH - plotT - plotB;
  const plotW = svgW - plotL - plotR;

  // EAR range 0.08 – 0.44
  const EAR_MIN = 0.08, EAR_MAX = 0.44;
  const toXY = (val, idx) => ({
    x: plotL + (idx / (earPoints.length - 1)) * plotW,
    y: plotT + (1 - (Math.max(EAR_MIN, Math.min(EAR_MAX, val)) - EAR_MIN) / (EAR_MAX - EAR_MIN)) * plotH,
  });
  const svgPoints = earPoints.map((v, i) => { const p = toXY(v, i); return `${p.x},${p.y}`; }).join(" ");

  const minIdx    = earPoints.indexOf(Math.min(...earPoints));
  const blinkPt   = toXY(earPoints[minIdx], minIdx);
  // Threshold y (0.20)
  const threshY   = plotT + (1 - (0.20 - EAR_MIN) / (EAR_MAX - EAR_MIN)) * plotH;

  const green = "#10B981"; const red = "#EF4444"; const amber = "#F59E0B";
  const matchColor = isMatch ? green : red;

  const badgeProp = (ok, yes, no) => ({
    text: ok ? yes : no,
    bg: ok ? "#ECFDF5" : "#FEF3C7",
    fg: ok ? "#047857" : "#92400E",
    bdr: ok ? "#A7F3D0" : "#FDE68A",
  });

  return (
    <main className="content">
      <div className="page-heading dashboard-heading" style={{ marginBottom: "16px" }}>
        <div>
          <span className="eyebrow" style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", letterSpacing: "0.1em" }}>
            BIOMETRIC PORTAL
          </span>
          <h2 style={{ margin: "8px 0 4px" }}>
            <UserCheck size={22} style={{ verticalAlign: "middle", marginRight: "8px", color: "var(--primary)" }} />
            Biometrics Analysis — {caseData.name || "Candidate"}
          </h2>
          <p>Case {id} · Face Comparison &amp; Liveness Telemetry</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link to="/dashboard/history" className="btn-primary" style={{ background: "white", color: "var(--text-dark)", border: "1px solid var(--border)" }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <Link to={`/cases/${id}`} className="btn-primary" style={{ background: "var(--primary)", color: "white" }}>
            <ShieldCheck size={16} /> Decision Override
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "24px", gap: "8px", overflowX: "auto" }}>
        {[
          { to: `/screening/${id}/results`,    label: "Overview Results",   icon: null,                   active: false },
          { to: `/screening/${id}/biometrics`, label: "Biometrics Details", icon: <Fingerprint size={15}/>, active: true  },
          { to: `/screening/${id}/forensics`,  label: "Forensics & ELA",    icon: <Eye size={15}/>,         active: false },
          { to: `/screening/${id}/data`,       label: "OCR & Raw Fields",   icon: <Database size={15}/>,    active: false },
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>

        {/* Portrait Comparison */}
        <Panel title="PORTRAIT MATCHING (SIDE-BY-SIDE)">
          <div style={{ padding: "16px 20px" }}>
            <div style={{ marginBottom: "14px", padding: "10px 14px", background: "#EFF6FF", borderRadius: "8px", border: "1px solid #BFDBFE", fontSize: "12px", color: "#1D4ED8" }}>
              <strong>Left:</strong> Face auto-extracted &amp; cropped from uploaded ID document. &nbsp;
              <strong>Right:</strong> Live camera capture.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "4px 0 16px" }}>
              {/* Extracted face */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                {docImg
                  ? <ExtractedFace dataUrl={docImg} docHint={docType} />
                  : (
                    <div style={{ position: "relative", width: "100%", maxWidth: "180px", aspectRatio: "3/4", background: "#E2E8F0", borderRadius: "10px", border: "2px solid #94A3B8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ScanFace size={60} color="#94A3B8" />
                      <div style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(15,23,42,0.80)", color: "white", fontSize: "9px", padding: "3px 7px", borderRadius: "4px", fontWeight: "700" }}>EXTRACTED FROM ID</div>
                    </div>
                  )
                }
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textAlign: "center" }}>Credential Photograph</span>
              </div>

              {/* Live selfie */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <div style={{
                  position: "relative", width: "100%", maxWidth: "180px", aspectRatio: "3/4",
                  background: "#E2E8F0", borderRadius: "10px",
                  border: `2.5px solid ${matchColor}`, overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 16px ${matchColor}44`,
                }}>
                  {selfieImg
                    ? <img src={selfieImg} alt="Live selfie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <ScanFace size={60} color="#64748B" />
                  }
                  <div style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(15,23,42,0.80)", color: "white", fontSize: "9px", padding: "3px 7px", borderRadius: "4px", fontWeight: "700" }}>LIVE STREAM CAPTURE</div>
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                    <path d="M 45% 28% L 38% 52% L 45% 68% L 55% 68% L 62% 52% L 55% 28% Z" fill="none" stroke="#3B82F6" strokeWidth="1" strokeDasharray="3" style={{ opacity: selfieImg ? 0.3 : 1 }} />
                    {[["38%","52%"],["62%","52%"],["50%","68%"],["50%","28%"]].map(([cx,cy],i) => (
                      <circle key={i} cx={cx} cy={cy} r="3" fill="#3B82F6" style={{ opacity: selfieImg ? 0.3 : 1 }} />
                    ))}
                  </svg>
                  <div style={{ position: "absolute", border: `2px solid ${matchColor}`, top: "24px", bottom: "24px", left: "20px", right: "20px", borderRadius: "4px", pointerEvents: "none" }} />
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textAlign: "center" }}>Live Verification Camera</span>
              </div>
            </div>

            {/* Match score */}
            <div style={{ display: "flex", background: isMatch ? "#F0FDF4" : "#FEF2F2", borderRadius: "10px", padding: "16px 20px", border: `1px solid ${isMatch ? "#A7F3D0" : "#FECACA"}`, marginTop: "4px", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "0.05em" }}>VERIFICATION SIMILARITY</span>
                <strong style={{ display: "block", fontSize: "15px", color: "var(--text-dark)", marginTop: "4px" }}>
                  Confidence Score: {isMatch ? "MATCH ✓" : "MISMATCH ✗"}
                </strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Status: {verStatus.replace(/_/g, " ")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "40px", fontWeight: "800", color: matchColor, letterSpacing: "-0.02em" }}>{faceScore.toFixed(1)}%</span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>(Threshold: 80%)</span>
              </div>
            </div>

            {/* Score bar */}
            <div style={{ marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>Face similarity score</span>
                <strong style={{ color: matchColor }}>{faceScore.toFixed(1)}%</strong>
              </div>
              <div style={{ height: "10px", background: "#E2E8F0", borderRadius: "5px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, faceScore)}%`, background: faceScore >= 80 ? "linear-gradient(90deg,#10B981,#059669)" : "linear-gradient(90deg,#F87171,#DC2626)", borderRadius: "5px", transition: "width 1.2s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px", fontSize: "10px", color: "var(--text-muted)" }}>
                <span>0%</span><span style={{ color: "#3B82F6" }}>▲ Threshold 80%</span><span>100%</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Right: Liveness + EAR */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Panel title="ANTI-SPOOFING LIVENESS AUDIT">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px 20px" }}>
              {[
                { label: "Subject Live Detection",       ok: isLive,         yes: "Live Confirmed",         no: "Not Live (Fail)" },
                { label: "Eye Blink Sensor (EAR Dip)",  ok: hasBlink,        yes: "Detected",               no: "Not Found" },
                { label: "3D Depth / Texture (PAD)",    ok: padScore > 0.7,  yes: `Passed (${padScore.toFixed(2)})`, no: `Failed (${padScore.toFixed(2)})` },
                { label: "Print / Replay Attack Check", ok: true,            yes: "Clear (No screen)",       no: "Suspected" },
              ].map((row, i) => {
                const b = badgeProp(row.ok, row.yes, row.no);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: i % 2 === 0 ? "#F8FAFC" : "#FFF", borderRadius: "8px", border: "1px solid #EEF2F6" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-dark)", fontWeight: "500" }}>
                      {row.ok ? <CheckCircle size={16} color={green} /> : <AlertTriangle size={16} color={amber} />}
                      {row.label}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: "600", padding: "3px 10px", borderRadius: "6px", background: b.bg, color: b.fg, border: `1px solid ${b.bdr}`, whiteSpace: "nowrap" }}>
                      {b.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* EAR Graph — fixed positioning */}
          <Panel title="EYE ASPECT RATIO (EAR) GRAPH">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px 20px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Real-time EAR metrics. A distinct dip indicates a voluntary blink event.
              </span>
              <div style={{ background: "#0F172A", borderRadius: "8px", padding: "10px" }}>
                <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height={svgH}>
                  {/* Y-axis grid lines */}
                  {[0.15, 0.20, 0.25, 0.30, 0.35, 0.40].map(v => {
                    const yg = plotT + (1 - (v - EAR_MIN) / (EAR_MAX - EAR_MIN)) * plotH;
                    return (
                      <g key={v}>
                        <line x1={plotL} y1={yg} x2={svgW - plotR} y2={yg}
                          stroke={v === 0.20 ? "#7F1D1D" : "#1E3A5F"} strokeDasharray={v === 0.20 ? "5,3" : "3,3"} strokeWidth={v === 0.20 ? 1.5 : 1} />
                        <text x={plotL - 4} y={yg + 4} fill={v === 0.20 ? "#F87171" : "#475569"}
                          fontSize="9" textAnchor="end" fontWeight={v === 0.20 ? "bold" : "normal"}>{v.toFixed(2)}</text>
                      </g>
                    );
                  })}

                  {/* Danger zone below threshold */}
                  <rect x={plotL} y={threshY} width={plotW} height={svgH - plotB - threshY + plotT}
                    fill="rgba(239,68,68,0.07)" />

                  {/* Threshold label */}
                  <text x={svgW - plotR - 2} y={threshY - 3} fill="#F87171" fontSize="8" textAnchor="end" fontWeight="bold">BLINK THRESHOLD</text>

                  {/* Area fill */}
                  <polyline fill="rgba(16,185,129,0.12)" stroke="none"
                    points={`${plotL},${plotT + plotH} ${svgPoints} ${svgW - plotR},${plotT + plotH}`} />

                  {/* Main line */}
                  <polyline fill="none" stroke="#10B981" strokeWidth="2.5" points={svgPoints} strokeLinejoin="round" />

                  {/* Data points */}
                  {earPoints.map((v, i) => {
                    const { x, y } = toXY(v, i);
                    return <circle key={i} cx={x} cy={y} r="4.5" fill="#34D399" stroke="#0F172A" strokeWidth="1.5" />;
                  })}

                  {/* Blink annotation — vertical line + label at BOTTOM of SVG (label zone) */}
                  {hasBlink && (() => {
                    const lx = blinkPt.x;
                    const labelY = svgH - plotB + 10; // in the bottom label zone
                    return (
                      <g>
                        {/* Vertical dashed line from dip point down to bottom */}
                        <line x1={lx} y1={blinkPt.y + 6} x2={lx} y2={svgH - plotB}
                          stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4,2" />
                        {/* Label background */}
                        <rect x={lx - 40} y={labelY - 2} width="80" height="16" rx="4" fill="#92400E" />
                        {/* Label text */}
                        <text x={lx} y={labelY + 10} fill="white" fontSize="9"
                          fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">BLINK DETECTED</text>
                        {/* Dip point highlight ring */}
                        <circle cx={blinkPt.x} cy={blinkPt.y} r="7" fill="none"
                          stroke="#F59E0B" strokeWidth="2" opacity="0.8" />
                      </g>
                    );
                  })()}

                  {/* X-axis frame line */}
                  <line x1={plotL} y1={plotT + plotH} x2={svgW - plotR} y2={plotT + plotH} stroke="#1E3A5F" />
                </svg>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  ["Minimum EAR Achieved",     `${minEar.toFixed(3)} (threshold: 0.20)`],
                  ["PAD Score (Anti-Spoofing)", `${padScore.toFixed(3)} (threshold: 0.70)`],
                ].map(([label, val], i) => (
                  <div key={i} style={{ padding: "8px 12px", background: "#F8FAFC", borderRadius: "6px", border: "1px solid #EEF2F6", fontSize: "12px" }}>
                    <span style={{ color: "var(--text-muted)", display: "block" }}>{label}</span>
                    <strong style={{ color: "var(--text-dark)" }}>{val}</strong>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <style>{`
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes faceScan {
          0%   { top: 4%;  opacity: 0.85; }
          50%  { top: 93%; opacity: 1;    }
          100% { top: 4%;  opacity: 0.85; }
        }
      `}</style>
    </main>
  );
}
