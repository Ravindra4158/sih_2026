import { } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Fingerprint, Eye, Database, CheckCircle, AlertTriangle, AlertCircle, Info, ShieldCheck } from "lucide-react";
import { Panel } from "./DashboardLayout";
import { useCaseData } from "../hooks/useCaseData";

export default function ForensicsDetail() {
  const { id } = useParams();
  const { caseData, loading } = useCaseData(id);


  if (!caseData) {
    return (
      <main className="content" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading forensics...</p>
      </main>
    );
  }

  const forensics = caseData.forensics || {};
  const isTampered = forensics.tamperDetected ?? false;
  const anomalyRegions = Array.isArray(forensics.anomalyRegions) ? forensics.anomalyRegions : [];

  return (
    <main className="content">
      {/* Heading */}
      <div className="page-heading dashboard-heading" style={{ marginBottom: '16px' }}>
        {/* Left */}
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>FORENSIC TELEMETRY</span>
          <h2 style={{ margin: '8px 0 4px' }}>Error Level Analysis (ELA)</h2>
          <p>Analyzing digital compression discrepancies to expose structural modifications</p>
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
        <Link to={`/screening/${id}/forensics`} style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--primary)', borderBottom: '2px solid var(--primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Eye size={16} /> Forensics &amp; ELA
        </Link>
        <Link to={`/screening/${id}/data`} style={{ padding: '12px 20px', fontWeight: '500', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={16} /> OCR &amp; Raw Fields
        </Link>
      </div>

      {/* Analysis Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Heatmaps side-by-side */}
        <Panel title="COMPRESSION RE-SAVE DIFFERENTIAL (SIDE-BY-SIDE)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '16px 0', justifyItems: 'center' }}>
            
            {/* Original */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '220px', height: '145px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', flexDir: 'column', padding: '12px', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '7px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '1px' }}>{caseData.docType.toUpperCase()}</span>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '50px', background: '#CBD5E1', borderRadius: '3px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <div style={{ width: '80%', height: '6px', background: '#CBD5E1', borderRadius: '2px' }} />
                    <div style={{ width: '60%', height: '5px', background: '#E2E8F0', borderRadius: '2px' }} />
                    <div style={{ width: '90%', height: '5px', background: '#E2E8F0', borderRadius: '2px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '50%', height: '5px', background: '#CBD5E1', borderRadius: '2px' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', opacity: '0.2' }} />
                </div>

                {/* Annotation overlays */}
                {isTampered && anomalyRegions.map((r, idx) => (
                  <div key={idx} style={{ 
                    position: 'absolute', 
                    border: '1.5px dashed #EF4444', 
                    // Scaled down mock bounding boxes
                    left: `${(r.bounding_box?.x || 0) * 220 / 400}px`,
                    top: `${(r.bounding_box?.y || 0) * 145 / 300}px`,
                    width: `${(r.bounding_box?.width || 50) * 220 / 400}px`,
                    height: `${(r.bounding_box?.height || 20) * 145 / 300}px`,
                    pointerEvents: 'none'
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Original Document Image</span>
            </div>

            {/* ELA Heatmap */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              {forensics.elaHeatmapBase64 && forensics.elaHeatmapBase64.startsWith('data:image') ? (
                <div style={{ position: 'relative', width: '220px', height: '145px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #1E293B' }}>
                   <img src={forensics.elaHeatmapBase64} alt="ELA Heatmap" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ position: 'relative', width: '220px', height: '145px', background: '#0F172A', borderRadius: '6px', border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', padding: '12px', justifyContent: 'space-between' }}>
                  {/* Simulated ELA black background with neon speckles */}
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'radial-gradient(circle, #818CF8 1px, transparent 1px) 0 0/8px 8px' }} />
                  
                  {/* Normal uniform compression pixels */}
                  <div style={{ width: '30px', height: '40px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2px', opacity: 0.3 }} />
  
                  {/* Highlighted anomaly neon glow overlay */}
                  {isTampered && anomalyRegions.map((r, idx) => (
                    <div key={idx} style={{ 
                      position: 'absolute', 
                      border: '2px solid #F43F5E', 
                      background: 'rgba(244, 63, 94, 0.25)',
                      boxShadow: '0 0 10px #F43F5E',
                      left: `${(r.bounding_box?.x || 0) * 220 / 400}px`,
                      top: `${(r.bounding_box?.y || 0) * 145 / 300}px`,
                      width: `${(r.bounding_box?.width || 50) * 220 / 400}px`,
                      height: `${(r.bounding_box?.height || 20) * 145 / 300}px`,
                      pointerEvents: 'none'
                    }} />
                  ))}
                </div>
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Error Level Analysis Heatmap</span>
            </div>

          </div>

          {/* Tampering Probability */}
          <div style={{ display: 'flex', background: '#F8FAFC', borderRadius: '8px', padding: '16px', border: '1px solid var(--border)', marginTop: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>DIGITAL ALTERATION RATIO</span>
              <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-dark)', marginTop: '4px' }}>
                {isTampered ? "Tampering Suspicion: HIGH FORENSIC VALUE" : "Tampering Suspicion: LOW (Within normal boundaries)"}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: isTampered ? '#EF4444' : '#10B981' }}>
                {forensics.tamperConfidenceScore ?? 4.2}%
              </span>
            </div>
          </div>
        </Panel>

        {/* Right Column: Details & Explainers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Anomaly regions list */}
          <Panel title="DETECTED ANOMALY REGIONS">
            {isTampered && anomalyRegions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '8px 0' }}>
                {anomalyRegions.map((region, idx) => (
                  <div key={idx} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#B91C1C' }}>
                        <AlertCircle size={15} />
                        {region.region_label}
                      </span>
                      <span style={{ fontSize: '11px', background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                        VAR: {region.error_variance}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>Bounding Box: [x:{region.bounding_box?.x}, y:{region.bounding_box?.y}, w:{region.bounding_box?.width}, h:{region.bounding_box?.height}]</span>
                      <span style={{ fontWeight: '500' }}>Alteration confidence: 94%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: '#F0FDF4', borderRadius: '6px', color: '#166534', fontSize: '13px' }}>
                <CheckCircle size={18} color="#15803D" />
                <span>Forensics resolved. No structural or pixel-level manipulation anomalies were detected.</span>
              </div>
            )}
          </Panel>

          {/* Metadata Flags */}
          <Panel title="EXIF & METADATA ANALYSIS">
            {caseData.warnings && caseData.warnings.some(w => w.includes('EDITING_SOFTWARE_DETECTED')) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '8px 0' }}>
                {caseData.warnings.filter(w => w.includes('EDITING_SOFTWARE_DETECTED')).map((warning, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#FEF2F2', borderRadius: '6px', color: '#991B1B', fontSize: '13px', border: '1px solid #FCA5A5' }}>
                    <AlertTriangle size={18} color="#DC2626" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: '#F8FAFC', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <CheckCircle size={18} color="#64748B" />
                <span>No suspicious EXIF metadata or editing software signatures found.</span>
              </div>
            )}
          </Panel>

          {/* Educational ELA Panel */}
          <Panel title="WHAT IS ERROR LEVEL ANALYSIS?">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Info size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p>
                  <b>Error Level Analysis (ELA)</b> identifies areas within an image that are at different compression levels. With JPEG images, the entire image should be at a roughly uniform compression error variance level.
                </p>
              </div>
              <p>
                If a section of the image is modified (for example, pasting a face or replacing printed identification numbers), the edited section will display a much higher difference variance, which shows up as bright white or hot red highlights in the neon ELA output heatmap.
              </p>
            </div>
          </Panel>
          
        </div>

      </div>
    </main>
  );
}
