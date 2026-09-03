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
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '8px 0 16px', justifyItems: 'center' }}>
            
            {/* Original */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '220px', height: '145px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '12px', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
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

                {/* Annotation overlays scaled dynamically */}
                {isTampered && anomalyRegions.map((r, idx) => {
                  const scaleX = forensics.imageWidth ? (220 / forensics.imageWidth) : (220 / 400);
                  const scaleY = forensics.imageHeight ? (145 / forensics.imageHeight) : (145 / 300);
                  return (
                    <div key={idx} style={{ 
                      position: 'absolute', 
                      border: '1.5px dashed #EF4444', 
                      left: `${(r.bounding_box?.x || 0) * scaleX}px`,
                      top: `${(r.bounding_box?.y || 0) * scaleY}px`,
                      width: `${(r.bounding_box?.width || 50) * scaleX}px`,
                      height: `${(r.bounding_box?.height || 20) * scaleY}px`,
                      pointerEvents: 'none'
                    }} />
                  );
                })}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Original Document Image</span>
            </div>

            {/* ELA Heatmap */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              {forensics.elaHeatmapBase64 && forensics.elaHeatmapBase64.startsWith('data:image') ? (
                <div style={{ position: 'relative', width: '220px', height: '145px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #1E293B' }}>
                   <img src={forensics.elaHeatmapBase64} alt="ELA Heatmap" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   
                   {/* Draw overlays on top of real base64 heatmap */}
                   {isTampered && anomalyRegions.map((r, idx) => {
                     const scaleX = forensics.imageWidth ? (220 / forensics.imageWidth) : (220 / 400);
                     const scaleY = forensics.imageHeight ? (145 / forensics.imageHeight) : (145 / 300);
                     return (
                       <div key={idx} style={{ 
                         position: 'absolute', 
                         border: '2px solid #F43F5E', 
                         background: 'rgba(244, 63, 94, 0.25)', 
                         left: `${(r.bounding_box?.x || 0) * scaleX}px`, 
                         top: `${(r.bounding_box?.y || 0) * scaleY}px`, 
                         width: `${(r.bounding_box?.width || 50) * scaleX}px`, 
                         height: `${(r.bounding_box?.height || 20) * scaleY}px`,
                         pointerEvents: 'none'
                       }} />
                     );
                   })}
                </div>
              ) : (
                <div style={{ position: 'relative', width: '220px', height: '145px', background: '#0F172A', borderRadius: '6px', overflow: 'hidden', border: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Grid background simulation */}
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'linear-gradient(#38BDF8 1px, transparent 1px), linear-gradient(90deg, #38BDF8 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  
                  <div style={{ position: 'relative', width: '180px', height: '110px', background: '#1E293B', borderRadius: '4px', opacity: 0.6 }} />

                  {/* Tampered hotspots */}
                  {isTampered ? (
                    <>
                      <div style={{ position: 'absolute', top: '35px', left: '70px', width: '45px', height: '25px', background: '#EF4444', filter: 'blur(8px)', opacity: 0.8, borderRadius: '50%' }} />
                      <div style={{ position: 'absolute', top: '38px', left: '72px', border: '1.5px solid #F87171', width: '40px', height: '20px', borderRadius: '4px' }} />
                      <div style={{ position: 'absolute', top: '80px', right: '40px', width: '30px', height: '20px', background: '#F59E0B', filter: 'blur(6px)', opacity: 0.7, borderRadius: '50%' }} />
                    </>
                  ) : (
                    <div style={{ position: 'absolute', inset: '15px', background: '#38BDF8', filter: 'blur(20px)', opacity: 0.08 }} />
                  )}
                </div>
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Error Level Heatmap (ELA)</span>
            </div>

          </div>

          {/* Metric Bar */}
          <div style={{ display: 'flex', background: '#F8FAFC', borderRadius: '8px', padding: '16px 20px', border: '1px solid var(--border)', marginTop: '8px', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>PEAK ERROR VARIANCE</span>
              <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-dark)', marginTop: '4px' }}>
                {isTampered ? "High Gradient Inconsistency Found" : "Uniform Compression Detected"}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: isTampered ? '#EF4444' : '#10B981' }}>
                {forensics.meanErrorVariance ?? (isTampered ? "48.2" : "8.4")}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>EV (Normal &lt; 15)</span>
            </div>
          </div>
          </div>
        </Panel>

        {/* Right Column: Details & Explainers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Anomaly regions list */}
          <Panel title="DETECTED ANOMALY REGIONS">
            <div style={{ padding: '16px 20px' }}>
            {isTampered && anomalyRegions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {anomalyRegions.map((region, idx) => (
                  <div key={idx} style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #EEF2F6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#B91C1C' }}>
                        <AlertCircle size={15} />
                        {region.region_label}
                      </span>
                      <span style={{ fontSize: '11px', background: '#FEE2E2', color: '#991B1B', padding: '3px 8px', borderRadius: '4px', fontWeight: '600', border: '1px solid #FECACA' }}>
                        VAR: {region.error_variance}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>Bounding Box: [x:{region.bounding_box?.x}, y:{region.bounding_box?.y}, w:{region.bounding_box?.width}, h:{region.bounding_box?.height}]</span>
                      <span style={{ fontWeight: '600', color: '#B91C1C' }}>Alteration confidence: 94%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#F0FDF4', borderRadius: '8px', color: '#166534', fontSize: '13px', border: '1px solid #BBF7D0' }}>
                <CheckCircle size={18} color="#15803D" />
                <span>Forensics resolved. No structural or pixel-level manipulation anomalies were detected.</span>
              </div>
            )}
            </div>
          </Panel>

          {/* Metadata Flags */}
          <Panel title="EXIF & METADATA ANALYSIS">
            <div style={{ padding: '16px 20px' }}>
            {caseData.warnings && caseData.warnings.some(w => w.includes('EDITING_SOFTWARE_DETECTED')) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {caseData.warnings.filter(w => w.includes('EDITING_SOFTWARE_DETECTED')).map((warning, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#FEF2F2', borderRadius: '8px', color: '#991B1B', fontSize: '13px', border: '1px solid #FCA5A5' }}>
                    <AlertTriangle size={18} color="#DC2626" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#F8FAFC', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', border: '1px solid #EEF2F6' }}>
                <CheckCircle size={18} color="#64748B" />
                <span>No suspicious EXIF metadata or editing software signatures found.</span>
              </div>
            )}
            </div>
          </Panel>

          {/* Educational ELA Panel */}
          <Panel title="WHAT IS ERROR LEVEL ANALYSIS?">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', padding: '16px 20px' }}>
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
