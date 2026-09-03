import { Panel } from "./DashboardLayout";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle, Search, Filter, Download, Eye, AlertCircle, ScanFace } from "lucide-react";

export default function Result() {
  return (
    <main className="content">
      <div className="page-heading dashboard-heading" style={{ marginBottom: '16px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>SCREENING RESULT</span>
          <h2 style={{ margin: '8px 0 4px' }}>Risk &amp; Findings</h2>
          <p>Case BR-2026-00124 · 25 Aug 2026, 01:42 PM</p>
        </div>
        <Link to="/dashboard/history" className="btn-primary" style={{ background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border)' }}>
          <ArrowLeft size={16} /> Back to History
        </Link>
      </div>

      <div className="result-hero-grid">
        <div style={{ borderRight: '1px solid var(--border)', paddingRight: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>OVERALL RISK SCORE</span>
          <div style={{ fontSize: '48px', fontWeight: '800', color: '#D97706', lineHeight: '1.2', marginTop: '12px' }}>
            64 <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <div style={{ color: '#D97706', fontWeight: '700', fontSize: '14px', marginTop: '4px' }}>MEDIUM RISK</div>
        </div>
        
        <div style={{ borderRight: '1px solid var(--border)', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Gauge Placeholder */}
          <div style={{ width: '140px', height: '70px', borderRadius: '140px 140px 0 0', border: '16px solid #F59E0B', borderBottom: '0', position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', bottom: '0', left: '50%', width: '4px', height: '50px', background: '#1E293B', transformOrigin: 'bottom center', transform: 'rotate(20deg)' }}></div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>Risk Assessment</span>
        </div>

        <div style={{ paddingLeft: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>RECOMMENDED ACTION</span>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '12px' }}>
            <AlertCircle color="#D97706" size={32} />
            <div>
              <strong style={{ display: 'block', fontSize: '16px', color: '#B45309', marginBottom: '8px' }}>MANUAL REVIEW REQUIRED</strong>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>Please verify document and individual before proceeding.</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-primary" style={{ padding: '8px 16px', background: '#16A34A', fontSize: '12px' }}>Approve</button>
                <button className="btn-primary" style={{ padding: '8px 16px', background: '#F59E0B', fontSize: '12px' }}>Refer</button>
                <button className="btn-primary" style={{ padding: '8px 16px', background: '#DC2626', fontSize: '12px' }}>Reject</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="result-details-grid">
        <Panel title="DOCUMENT DETAILS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 20px' }}>
            {[
              ["Document Type", "Passport"], ["Passport Number", "P1234567"], 
              ["Name", "Rahul Sharma"], ["Nationality", "Indian"], 
              ["Date of Birth", "12/05/1998"], ["Gender", "Male"], 
              ["Date of Issue", "10/06/2020"], ["Date of Expiry", "09/08/2030"]
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', backgroundColor: idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF', border: '1px solid #EEF2F6', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{item[0]}</span>
                <strong style={{ color: 'var(--text-dark)' }}>{item[1]}</strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="FINDINGS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 20px' }}>
            {[
              ["Document Format", "Valid", "green", true],
              ["MRZ Consistency", "Match", "green", true],
              ["Expiry Date Check", "Valid", "green", true],
              ["Watchlist Check", "Clear", "green", true],
              ["Tampering Analysis", "Suspicious", "red", false],
              ["Face Verification", "Match (96%)", "green", true]
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', backgroundColor: idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF', border: '1px solid #EEF2F6', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dark)', fontWeight: '500' }}>
                  {item[3] ? <CheckCircle size={16} color="#16A34A" /> : <AlertTriangle size={16} color="#DC2626" />}
                  {item[0]}
                </span>
                <span className={`recent-status status-${item[2]}`}>{item[1]}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="TAMPERING HEATMAP">
          <div style={{ height: '240px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <ScanFace size={64} color="#CBD5E1" />
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Heatmap rendering placeholder</span>
            <div style={{ width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', boxShadow: '0 0 10px #EF4444' }}></div>
          </div>
        </Panel>
      </div>
    </main>
  );
}
