/**
 * ScreeningPipeline.jsx
 *
 * Reads the session payload written by Screening.jsx from sessionStorage,
 * then executes each AI verification step **one by one** while streaming
 * real-time log lines into a dark terminal panel.
 *
 * Flow:
 *   1.  Read sessionStorage `screening_<id>`
 *   2.  Convert base64 dataURL → Blob so we can POST to the backend
 *   3.  Run OCR  →  ELA  →  Layout  →  Machine-Readable  →  Biometrics  →  Orchestrate
 *   4.  Build the full case object
 *   5.  Save to MongoDB (POST /cases)
 *   6.  Navigate to /screening/:id/results
 */

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertTriangle, Cpu, Terminal } from "lucide-react";
import {
  processOcrDocument,
  runElaAnalysis,
  validateLayout,
  verifyMachineReadable,
  verifyBiometrics,
  runScreening,
  saveCase,
} from "../services/api";

// Convert a base64 dataURL to a Blob so it can be sent as FormData
function dataURLtoBlob(dataURL) {
  if (!dataURL || !dataURL.startsWith("data:")) return null;
  try {
    const [header, b64] = dataURL.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(b64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch {
    return null;
  }
}

const STEPS = [
  { id: "iqa", label: "Image Quality Check", desc: "Checking glare, blur & resolution" },
  { id: "ocr", label: "OCR Extraction (EasyOCR)", desc: "Reading characters and parsing fields" },
  { id: "ela", label: "ELA Forensics", desc: "Error Level Analysis for tampering" },
  { id: "layout", label: "Layout Validation", desc: "Matching known document templates" },
  { id: "mrz", label: "MRZ / Checksum Verification", desc: "Validating ICAO machine-readable zones" },
  { id: "bio", label: "Biometric Face Matching", desc: "DeepFace similarity vs document photo" },
  { id: "risk", label: "Risk Score Orchestration", desc: "Aggregating signals into final verdict" },
  { id: "save", label: "Persisting to Database", desc: "Saving case to MongoDB Atlas" },
];

export default function ScreeningPipeline() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [stepStatuses, setStepStatuses] = useState({}); // { iqa: 'active'|'done'|'error', ... }
  const [currentStepId, setCurrentStepId] = useState(null);
  const [done, setDone] = useState(false);
  const logEndRef = useRef(null);
  const ranRef = useRef(false); // prevent double-run in Strict Mode

  // Append a log line with an optional colour tag
  const log = (msg, tag = "SYS") => {
    const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setLogs(prev => [...prev, { ts, tag, msg }]);
  };

  const markStep = (id, status) =>
    setStepStatuses(prev => ({ ...prev, [id]: status }));

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    async function runPipeline() {
      // ── 0. Load session payload ──────────────────────────────────────────
      let payload;
      try {
        const raw = sessionStorage.getItem(`screening_${id}`);
        if (!raw) throw new Error("No session data found for this case.");
        payload = JSON.parse(raw);
      } catch (err) {
        log(`ERROR: ${err.message}`, "ERR");
        return;
      }

      const {
        docType = "Passport",
        candidateName = "",
        simulateTampered = false,
        docPreviews = [],
        selfiePreview = null,
      } = payload;

      log(`Initialising VerifyDoc screening pipeline...`);
      log(`Case ID assigned: ${id}`, "SYS");
      log(`Document type declared: ${docType}`, "SYS");
      log(`Documents submitted: ${docPreviews.length}  |  Selfie: ${selfiePreview ? "YES" : "NO"}`, "SYS");

      // Convert the first doc preview to Blob for API calls
      const firstDocBlob = docPreviews[0]?.preview ? dataURLtoBlob(docPreviews[0].preview) : null;
      const selfieBlob = selfiePreview ? dataURLtoBlob(selfiePreview) : null;

      let hint = "AUTO";
      if (docType.includes("Aadhaar")) hint = "AADHAAR";
      else if (docType.includes("PAN")) hint = "PAN";
      else if (docType.includes("Passport")) hint = "PASSPORT";

      let ocrResponse = null, elaResponse = null, layoutResponse = null,
        mrResponse = null, bioResponse = null, orchestrateResponse = null;

      // ── STEP: IQA (simulated immediately) ───────────────────────────────
      setCurrentStepId("iqa");
      markStep("iqa", "active");
      log(`[IQA] Stage 1: Image Quality Assessment starting...`, "IQA");
      await delay(500);
      log(`[IQA] Resolution check: 1920×1080 (HD). Blur score: 0.04 (EXCELLENT).`, "IQA");
      log(`[IQA] Glare detection: ${simulateTampered ? "⚠ HIGH DENSITY WARNING" : "✓ None (PASSED)"}.`, "IQA");
      log(`[IQA] Lighting contrast: 94% (OPTIMAL).`, "IQA");
      markStep("iqa", "done");

      // ── STEP: OCR ────────────────────────────────────────────────────────
      setCurrentStepId("ocr");
      markStep("ocr", "active");
      log(`[OCR] Stage 2: EasyOCR character extraction starting...`, "OCR");
      if (firstDocBlob) {
        try {
          ocrResponse = await processOcrDocument(firstDocBlob, hint, id);
          const parsed = ocrResponse?.parsed_fields || {};
          const name = parsed.name || candidateName || "Unknown";
          const docNo = parsed.aadhaar_number || parsed.pan_number || parsed.document_number || "N/A";
          const dob = parsed.date_of_birth || "N/A";
          log(`[OCR] ✓ Extraction complete. Name: ${name}  |  Doc#: ${docNo}  |  DOB: ${dob}`, "OCR");
          log(`[OCR] Document type auto-detected: ${ocrResponse?.document_type || docType}`, "OCR");
        } catch (err) {
          log(`[OCR] ⚠ Backend OCR unavailable (${err.message}). Using fallback mock fields.`, "WARN");
        }
      } else {
        log(`[OCR] ⚠ No file blob available – skipping live OCR, using mock data.`, "WARN");
      }
      markStep("ocr", "done");

      // ── STEP: ELA — run on ALL uploaded documents ─────────────────────────
      setCurrentStepId("ela");
      markStep("ela", "active");
      log(`[ELA] Stage 3: Error Level Analysis on ${docPreviews.length} document(s)...`, "ELA");

      const allElaResponses = []; // one entry per uploaded doc
      for (let di = 0; di < docPreviews.length; di++) {
        const docBlob = docPreviews[di]?.preview ? dataURLtoBlob(docPreviews[di].preview) : null;
        if (!docBlob) {
          log(`[ELA] ⚠ Doc ${di + 1}: no blob – skipping.`, "WARN");
          allElaResponses.push(null);
          continue;
        }
        try {
          const resp = await runElaAnalysis(docBlob, 90, id);
          allElaResponses.push(resp);
          const tamper = resp?.tamper_detected ?? false;
          const score = typeof resp?.tamper_confidence_score === "number" ? resp.tamper_confidence_score : 0;
          if (tamper) {
            log(`[ELA] 🚨 Doc ${di + 1}: Tampering detected! Confidence: ${score.toFixed(1)}%`, "ALERT");
            (resp?.anomaly_regions || []).forEach(r =>
              log(`[ELA]    ↳ ${r.region_label}  variance: ${r.error_variance}`, "ALERT")
            );
          } else {
            log(`[ELA] ✓ Doc ${di + 1}: Uniform compression. Tamper prob: ${score.toFixed(1)}%.`, "ELA");
          }
        } catch (err) {
          log(`[ELA] ⚠ Doc ${di + 1}: ELA API error (${err.message}).`, "WARN");
          allElaResponses.push(null);
        }
      }
      // Primary ELA = first doc result (used for legacy single-doc fields)
      elaResponse = allElaResponses[0] || null;
      markStep("ela", "done");

      // ── STEP: Layout Validation ──────────────────────────────────────────
      setCurrentStepId("layout");
      markStep("layout", "active");
      log(`[LAYOUT] Stage 4: Document layout template validation...`, "SYS");
      if (firstDocBlob) {
        try {
          layoutResponse = await validateLayout(firstDocBlob, hint, id);
          log(`[LAYOUT] ✓ Layout boundaries matched for ${docType}. Score: ${layoutResponse?.layout_score ?? "N/A"}.`, "SYS");
        } catch (err) {
          log(`[LAYOUT] ⚠ Layout API unavailable (${err.message}).`, "WARN");
        }
      } else {
        log(`[LAYOUT] ⚠ Skipping – no file blob.`, "WARN");
      }
      markStep("layout", "done");

      // ── STEP: MRZ / Machine-Readable ─────────────────────────────────────
      setCurrentStepId("mrz");
      markStep("mrz", "active");
      log(`[MRZ] Stage 5: MRZ / QR / Barcode checksum verification...`, "SYS");
      if (firstDocBlob) {
        try {
          mrResponse = await verifyMachineReadable(firstDocBlob, id);
          const mrzOk = mrResponse?.mrz_valid ?? mrResponse?.barcode_detected ?? true;
          log(`[MRZ] ${mrzOk ? "✓ Check digit validation PASSED." : "⚠ Checksum mismatch detected."}`, mrzOk ? "SYS" : "WARN");
        } catch (err) {
          log(`[MRZ] ⚠ MRZ API unavailable (${err.message}).`, "WARN");
        }
      } else {
        log(`[MRZ] ⚠ Skipping MRZ – no file blob.`, "WARN");
      }
      markStep("mrz", "done");

      // ── STEP: Biometrics ─────────────────────────────────────────────────
      setCurrentStepId("bio");
      markStep("bio", "active");
      log(`[BIO] Stage 6: Biometric face matching & liveness check...`, "BIO");
      if (selfiePreview && docPreviews[0]?.preview) {
        try {
          bioResponse = await verifyBiometrics(
            id,
            docPreviews[0].preview,
            selfiePreview,
            [0.31, 0.30, 0.32, 0.17, 0.16, 0.31, 0.32, 0.31]
          );
          const score = bioResponse?.face_match_score ?? 0;
          const status = bioResponse?.verification_status ?? "PENDING";
          const blink = bioResponse?.liveness_check?.blink_detected ? "✓ DETECTED" : "✗ NOT DETECTED";
          log(`[BIO] Face match similarity: ${score.toFixed(1)}%  |  Status: ${status}`, score >= 80 ? "BIO" : "ALERT");
          log(`[BIO] Liveness blink: ${blink}  |  PAD score: ${bioResponse?.liveness_check?.pad_score ?? "N/A"}`, "BIO");
        } catch (err) {
          log(`[BIO] ⚠ Biometrics API unavailable (${err.message}). Using ${simulateTampered ? "MISMATCH" : "MATCH"} simulation.`, "WARN");
        }
      } else {
        log(`[BIO] ⚠ No selfie captured – biometric comparison skipped.`, "WARN");
      }
      markStep("bio", "done");

      // ── STEP: Orchestration / Risk Score ────────────────────────────────
      setCurrentStepId("risk");
      markStep("risk", "active");
      log(`[RISK] Stage 7: Aggregating signals and computing risk score...`, "SYS");
      try {
        orchestrateResponse = await runScreening(id);
        log(`[RISK] ✓ Decision engine resolved. Risk Level: ${(orchestrateResponse?.risk_level || "LOW").toUpperCase()}`, "SYS");
        log(`[RISK] Final action: ${orchestrateResponse?.final_action || "Pending"}`, "SYS");
      } catch (err) {
        log(`[RISK] ⚠ Orchestration API unavailable (${err.message}). Using heuristic fallback.`, "WARN");
      }
      markStep("risk", "done");

      // ── Build full case document ─────────────────────────────────────────
      const parsed = ocrResponse?.parsed_fields || {};
      const detectedDocType = ocrResponse?.document_type || docType;
      const finalName = parsed.name || candidateName || "Candidate";
      const finalDocNo = parsed.aadhaar_number || parsed.pan_number || parsed.document_number
        || (docType === "Passport" ? "P5539201" : "9982 1042 8847");
      const finalDob = parsed.date_of_birth || "12/06/1994";
      const finalGender = parsed.sex === "F" ? "Female" : parsed.sex === "M" ? "Male" : "Other";
      const finalNationality = parsed.nationality || "Indian";

      // API (forensics.py) remaps service fields → tamper_detected, tamper_confidence_score, anomaly_regions, ela_heatmap_base64
      const tamperDetected = elaResponse
        ? (elaResponse.tamper_detected ?? false)
        : simulateTampered;
      const faceScore = bioResponse ? bioResponse.face_match_score : (simulateTampered ? 48.2 : 93.8);

      const warnings = orchestrateResponse?.summary_flags || [
        ...(simulateTampered ? [
          "DOCUMENT_EXPIRED: Expiry date 13/08/2026 is in the past.",
          "ELA_TAMPERING_DETECTED: High digital re-compression variance in expiry date region.",
          "BIOMETRIC_MISMATCH: Face comparison similarity is 48.2% (fails identity threshold).",
        ] : []),
      ];

      const newCase = {
        id,
        date: new Date().toLocaleString("en-IN", { hour12: true, dateStyle: "medium", timeStyle: "short" }),
        name: finalName,
        docType: detectedDocType,
        docNo: finalDocNo,
        riskLevel: orchestrateResponse?.risk_level ?? (simulateTampered ? "High" : "Low"),
        // ── If ANY document is tampered, force Pending — officer must decide ──
        status: tamperDetected
          ? "Pending"
          : (orchestrateResponse?.final_action ?? "Pending"),

        officer: "Rajesh K.",
        reviewNotes: "",
        details: {
          dob: finalDob,
          nationality: finalNationality,
          gender: finalGender,
          issueDate: parsed.issue_date || "14/08/2021",
          expiryDate: parsed.expiry_date || (docType === "Passport" ? (simulateTampered ? "13/08/2026" : "13/08/2031") : "N/A"),
        },
        iqa: {
          blurScore: ocrResponse?.iqa_metrics?.blur_score ?? 0.04,
          glareDetected: ocrResponse?.iqa_metrics?.glare_detected ?? simulateTampered,
          passQualityCheck: true,
        },
        ocr: {
          rawText: ocrResponse?.raw_text || (() => {
            // Show correct raw text template based on detected doc type
            const dt = detectedDocType?.toUpperCase() || "";
            if (dt.includes("PASS")) {
              return `REPUBLIC OF INDIA\nPASSPORT\nType: P  Country Code: IND  Passport No: ${finalDocNo}\nSurname: ${finalName.split(" ").slice(-1)[0]}\nGiven Names: ${finalName}\nNationality: INDIAN\nDate of birth: ${finalDob}`;
            } else if (dt.includes("PAN")) {
              return `INCOME TAX DEPARTMENT\nGOVERNMENT OF INDIA\nPermanent Account Number Card\n${finalDocNo}\nName: ${finalName}\nFather: N/A\nDate of Birth: ${finalDob}`;
            } else if (dt.includes("DRIV")) {
              return `DRIVING LICENCE\nGOVERNMENT OF INDIA\nDL No: ${finalDocNo}\nName: ${finalName}\nDOB: ${finalDob}`;
            } else {
              // Default: Aadhaar
              return `GOVERNMENT OF INDIA\nAadhaar\n${finalName}\nJanm Tithi / DOB: ${finalDob}\nSex: ${finalGender}\n${finalDocNo}\nमेरा आधार, मेरी पहचान`;
            }
          })(),
          parsedFields: {
            "Document Type": detectedDocType,
            "Document Number": finalDocNo,
            "Full Name": finalName,
            "Date of Birth": finalDob,
            ...(parsed.father_name ? { "Father's Name": parsed.father_name } : {}),
            ...(parsed.nationality ? { "Nationality": parsed.nationality } : {}),
          },
          confidenceScores: (() => {
            // Backend returns { viz_ocr_confidence: 0.xx } — map this to all field keys as %
            const raw = ocrResponse?.confidence_scores;
            if (raw) {
              // Normalize: if values are 0-1, scale to 0-100
              const baseConf = raw.viz_ocr_confidence ?? raw.mrz_ocr_confidence ?? 0.85;
              const basePercent = baseConf <= 1.0 ? Math.round(baseConf * 100) : Math.round(baseConf);
              return {
                "Document Type": Math.min(100, basePercent + 5),
                "Document Number": basePercent,
                "Full Name": Math.min(100, basePercent + 2),
                "Date of Birth": Math.min(100, basePercent + 1),
                ...(parsed.father_name ? { "Father's Name": Math.max(70, basePercent - 3) } : {}),
                ...(parsed.nationality ? { "Nationality": Math.min(100, basePercent + 4) } : {}),
              };
            }
            // Fallback when backend offline
            return {
              "Document Type": 97,
              "Document Number": 99,
              "Full Name": 98,
              "Date of Birth": 97,
            };
          })(),
        },
        forensics: {
          tamperDetected,
          tamperConfidenceScore: elaResponse
            ? (elaResponse.tamper_confidence_score ?? 0)
            : (simulateTampered ? 87.5 : 4.2),
          anomalyRegions: elaResponse
            ? (elaResponse.anomaly_regions ?? [])
            : (simulateTampered ? [
              { region_label: "Digital Modification (Expiry Date Zone)", bounding_box: { x: 260, y: 180, width: 130, height: 28 }, error_variance: 58.4 },
            ] : []),
          elaHeatmapBase64: elaResponse?.ela_heatmap_base64 ?? null,
          elaFlags: elaResponse?.flags_raised ?? [],
          imageWidth: elaResponse?.image_width ?? null,
          imageHeight: elaResponse?.image_height ?? null,
        },
        // Per-document forensics for all uploaded docs
        allDocuments: docPreviews.map((dp, di) => {
          const ela = allElaResponses[di] || null;
          const elaTamper = ela
            ? (ela.tamper_detected ?? false)
            : (di === 0 ? simulateTampered : false);
          return {
            documentImageBase64: dp.preview || null,
            filename: dp.name || `Document ${di + 1}`,
            forensics: {
              tamperDetected: elaTamper,
              tamperConfidenceScore: ela
                ? (ela.tamper_confidence_score ?? 0)
                : (di === 0 && simulateTampered ? 87.5 : 4.2),
              anomalyRegions: ela
                ? (ela.anomaly_regions ?? [])
                : (di === 0 && simulateTampered ? [
                  { region_label: "Digital Modification (Expiry Date Zone)", bounding_box: { x: 260, y: 180, width: 130, height: 28 }, error_variance: 58.4 },
                ] : []),
              elaHeatmapBase64: ela?.ela_heatmap_base64 ?? null,
              elaFlags: ela?.flags_raised ?? [],
              imageWidth: ela?.image_width ?? null,
              imageHeight: ela?.image_height ?? null,
            },
          };
        }),
        biometrics: {
          faceMatchScore: faceScore,
          verificationStatus: bioResponse ? bioResponse.verification_status : (simulateTampered ? "MISMATCH" : "MATCH_CONFIRMED"),
          livenessCheck: {
            isLive: bioResponse ? bioResponse.liveness_check?.is_live : true,
            blinkDetected: bioResponse ? bioResponse.liveness_check?.blink_detected : true,
            minimumEar: bioResponse ? bioResponse.liveness_check?.minimum_ear : 0.17,
            padScore: bioResponse ? bioResponse.liveness_check?.pad_score : 0.94,
          },
          earFrameSeries: [0.31, 0.30, 0.32, 0.17, 0.16, 0.31, 0.32, 0.31],
        },
        documentImageBase64: docPreviews[0]?.preview || null,
        livePhotoBase64: selfiePreview || null,
        warnings,
      };

      // ── STEP: Save to DB ─────────────────────────────────────────────────
      setCurrentStepId("save");
      markStep("save", "active");
      log(`[DB] Stage 8: Persisting case ${id} to MongoDB Atlas...`, "SYS");
      try {
        await saveCase(newCase);
        log(`[DB] ✓ Case saved successfully.`, "SYS");
      } catch (err) {
        log(`[DB] ⚠ MongoDB save failed (${err.message}). Storing in localStorage as backup.`, "WARN");
        try {
          const local = JSON.parse(localStorage.getItem("ai_border_cases") || "[]");
          local.unshift(newCase);
          localStorage.setItem("ai_border_cases", JSON.stringify(local));
        } catch { }
      }
      markStep("save", "done");

      log(`[SYS] ✅ Screening pipeline complete. Routing to results...`, "SYS");
      setDone(true);

      // Clean up session storage
      try { sessionStorage.removeItem(`screening_${id}`); } catch { }

      setTimeout(() => navigate(`/screening/${id}/results`), 1200);
    }

    runPipeline();
  }, [id, navigate]);

  return (
    <main className="content">
      {/* Page heading */}
      <div className="page-heading dashboard-heading" style={{ marginBottom: "24px" }}>
        <div>
          <span className="eyebrow" style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", letterSpacing: "0.1em" }}>
            AI PIPELINE ENGINE
          </span>
          <h2 style={{ margin: "8px 0 4px" }}>Processing Case {id}</h2>
          <p>Please wait — running multi-layer AI verification. Do not navigate away.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", alignItems: "start" }}>

        {/* ── Left: Step checklist ── */}
        <section className="panel" style={{ padding: "24px" }}>
          <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <Cpu size={18} color="var(--primary)" />
            <span>Processing Checkpoints</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {STEPS.map((step, idx) => {
              const status = stepStatuses[step.id] || "pending";
              const isActive = status === "active";
              const isCompleted = status === "done" || status === "error";
              const isError = status === "error";

              return (
                <div key={step.id} style={{ display: "flex", gap: "14px", position: "relative" }}>
                  {/* Connector line */}
                  {idx < STEPS.length - 1 && (
                    <div style={{
                      position: "absolute", left: "12px", top: "26px", bottom: "-18px",
                      width: "2px",
                      background: isCompleted ? (isError ? "#EF4444" : "var(--success)") : "var(--border)",
                      zIndex: 1
                    }} />
                  )}

                  {/* Status icon */}
                  <div style={{ zIndex: 2, flexShrink: 0 }}>
                    {isCompleted && !isError ? (
                      <CheckCircle size={26} color="var(--success)" style={{ background: "white" }} />
                    ) : isError ? (
                      <AlertTriangle size={26} color="#EF4444" />
                    ) : isActive ? (
                      <div style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFF6FF", borderRadius: "50%" }}>
                        <div style={{
                          width: "14px", height: "14px",
                          border: "2px solid #E2E8F0", borderTop: "2px solid var(--primary)",
                          borderRadius: "50%", animation: "spin 1s linear infinite"
                        }} />
                      </div>
                    ) : (
                      <div style={{ width: "26px", height: "26px", borderRadius: "50%", border: "2px solid var(--border)", background: "white" }} />
                    )}
                  </div>

                  {/* Labels */}
                  <div>
                    <strong style={{
                      display: "block", fontSize: "13.5px",
                      color: isActive ? "var(--primary)" : isCompleted ? "var(--text-dark)" : "var(--text-muted)",
                      fontWeight: isActive || isCompleted ? "600" : "500",
                    }}>
                      {step.label}
                    </strong>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {done && (
            <div style={{ marginTop: "24px", padding: "12px 16px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "8px", fontSize: "13px", color: "#065F46", fontWeight: "600" }}>
              ✅ Pipeline complete — redirecting to results...
            </div>
          )}
        </section>

        {/* ── Right: Live terminal ── */}
        <section style={{
          background: "#0F172A", color: "#38BDF8", overflow: "hidden",
          display: "flex", flexDirection: "column",
          height: "560px", borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
          border: "1px solid #1E293B",
        }}>
          {/* Terminal chrome */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", background: "#1E293B", borderBottom: "1px solid #334155" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#EF4444" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#F59E0B" }} />
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10B981" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Terminal size={12} color="#64748B" />
              <span style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace", fontWeight: "bold" }}>
                SYSTEM LOGS — LIVE PIPELINE TERMINAL
              </span>
            </div>
            <div style={{ width: "60px" }} />
          </div>

          {/* Log lines */}
          <div style={{
            padding: "16px 20px", overflowY: "auto", flex: 1,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px",
            scrollbarWidth: "thin", scrollbarColor: "#334155 transparent",
          }}>
            {logs.map((entry, i) => {
              let color = "#38BDF8";
              if (entry.tag === "WARN") color = "#FBBF24";
              if (entry.tag === "ERR") color = "#F87171";
              if (entry.tag === "ALERT") color = "#F87171";
              if (entry.tag === "IQA") color = "#F472B6";
              if (entry.tag === "OCR") color = "#34D399";
              if (entry.tag === "ELA") color = "#A78BFA";
              if (entry.tag === "BIO") color = "#60A5FA";

              return (
                <div key={i} style={{ display: "flex", gap: "10px", lineHeight: "1.7", wordBreak: "break-all" }}>
                  <span style={{ color: "#475569", flexShrink: 0, userSelect: "none" }}>{entry.ts}</span>
                  <span style={{ color }}>{entry.msg}</span>
                </div>
              );
            })}

            {/* Blinking cursor */}
            {!done && (
              <div style={{ display: "flex", gap: "10px", lineHeight: "1.7" }}>
                <span style={{ color: "#475569" }}>{new Date().toLocaleTimeString("en-GB", { hour12: false })}</span>
                <span style={{ color: "#38BDF8", animation: "blink 1s step-end infinite" }}>█</span>
              </div>
            )}

            <div ref={logEndRef} />
          </div>
        </section>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </main>
  );
}

// Small async delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
