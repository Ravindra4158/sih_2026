import { } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Fingerprint, Eye, Database, FileText, ShieldCheck } from "lucide-react";
import { Panel } from "./DashboardLayout";
import { useCaseData } from "../hooks/useCaseData";

export default function DocumentDataDetail() {
  const { id } = useParams();
  const { caseData, loading } = useCaseData(id);


  if (!caseData) {
    return (
      <main className="content" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading OCR data...</p>
      </main>
    );
  }

  const ocr = caseData.ocr || {};
  const parsedFields = ocr.parsedFields || {};
  const parsedKeys = Object.keys(parsedFields);
  const confidenceScores = ocr.confidenceScores || {};

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
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '8px', overflowX: 'auto' }}>
        <Link to={`/screening/${id}/results`} style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
          Overview Results
        </Link>
        <Link to={`/screening/${id}/biometrics`} style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <Fingerprint size={16} /> Biometrics Details
        </Link>
        <Link to={`/screening/${id}/forensics`} style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <Eye size={16} /> Forensics &amp; ELA
        </Link>
        <Link to={`/screening/${id}/data`} style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--primary)', borderBottom: '2px solid var(--primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <Database size={16} /> OCR &amp; Raw Fields
        </Link>
      </div>

      {/* Data Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Left: Raw OCR text */}
        <section className="panel" style={{ display: 'flex', flexDirection: 'column', height: '480px', padding: '0', overflow: 'hidden' }}>
          <div className="panel-title" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary)" />
            <span>Raw OCR Buffer Output</span>
          </div>
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#0F172A', color: '#F1F5F9', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.7', wordBreak: 'break-all' }}>
            {ocr.rawText || "No raw text recorded."}
          </div>
        </section>

        {/* Right: Parsed key-values with confidence meters */}
        <Panel title="PARSED IDENTIFIER FIELDS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
            {parsedKeys.length > 0 ? (
              parsedKeys.map((key, idx) => {
                let rawConf = confidenceScores[key] ?? confidenceScores["viz_ocr_confidence"] ?? 0.94;
                if (typeof rawConf === "number" && rawConf <= 1.0) {
                  rawConf = Math.round(rawConf * 100);
                }
                const conf = typeof rawConf === "number" ? rawConf : 94;
                const confColor = conf >= 90 ? '#10B981' : conf >= 80 ? '#F59E0B' : '#EF4444';

                return (
                  <div key={idx} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{key}</span>
                      <strong style={{ color: 'var(--text-dark)', wordBreak: 'break-word', textAlign: 'right' }}>{String(parsedFields[key])}</strong>
                    </div>
                    
                    {/* Confidence bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, height: '4px', background: '#E2E8F0', borderRadius: '2px' }}>
                        <div style={{ width: `${Math.min(100, Math.max(10, conf))}%`, height: '100%', background: confColor, borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: confColor, width: '40px', textAlign: 'right' }}>
                        {conf}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No structured fields extracted.</p>
            )}
          </div>
        </Panel>

      </div>
    </main>
  );
}
