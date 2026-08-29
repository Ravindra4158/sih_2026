import { Panel, Stat } from "./DashboardLayout";
import { Download, TrendingUp, AlertOctagon, CheckCircle2, Clock } from "lucide-react";

export default function Analytics() {
  return (
    <main className="content">
      <div className="page-heading dashboard-heading" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>INSIGHTS &amp; REPORTS</span>
          <h2 style={{ margin: '8px 0 4px' }}>Analytics</h2>
          <p>Performance trends across the border screening operation.</p>
        </div>
        <button className="btn-primary" style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--border)' }}>
          <Download size={16} /> Download Report
        </button>
      </div>

      <div className="analytics-stats-grid">
        <Stat number="1,248" label="Total Screened" />
        <Stat number="96.2%" label="Cleared (Low Risk)" tone="green" />
        <Stat number="2.7%" label="Review (Medium Risk)" tone="amber" />
        <Stat number="1.0%" label="High Risk" tone="red" />
        <Stat number="3.6s" label="Avg. Processing Time" />
      </div>

      <div className="analytics-charts-grid">
        <Panel title="Risk Level Trend">
          <div style={{ padding: '24px', height: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderBottom: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '100%', padding: '0 16px' }}>
               {[40, 60, 45, 80, 50, 70, 90].map((h, i) => (
                 <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', opacity: i % 2 === 0 ? 1 : 0.6 }}></div>
               ))}
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 32px', color: 'var(--text-muted)', fontSize: '12px' }}>
             <span>12 AM</span><span>4 AM</span><span>8 AM</span><span>12 PM</span><span>4 PM</span><span>8 PM</span>
          </div>
        </Panel>

        <Panel title="Document Type Distribution">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', height: '100%', padding: '32px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'conic-gradient(var(--primary) 0 78%, #16A34A 78% 90%, #F59E0B 90% 96%, #9333EA 96%)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '2px' }}></div> <span>Passport <b style={{ color: 'var(--text-dark)', marginLeft: '12px' }}>78%</b></span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#16A34A', borderRadius: '2px' }}></div> <span>Visa <b style={{ color: 'var(--text-dark)', marginLeft: '12px' }}>12%</b></span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#F59E0B', borderRadius: '2px' }}></div> <span>ID Card <b style={{ color: 'var(--text-dark)', marginLeft: '12px' }}>6%</b></span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#9333EA', borderRadius: '2px' }}></div> <span>License <b style={{ color: 'var(--text-dark)', marginLeft: '12px' }}>4%</b></span></div>
            </div>
          </div>
        </Panel>

        <Panel title="Top Tampering Cases">
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
             {[["Text Manipulation", 42], ["Photo Replacement", 31], ["Stamp Forgery", 18], ["Metadata Anomaly", 11]].map(item => (
               <div key={item[0]} style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
                 <div style={{ width: '140px', color: 'var(--text-muted)' }}>{item[0]}</div>
                 <div style={{ flex: 1, height: '8px', background: '#F1F5F9', borderRadius: '4px' }}>
                   <div style={{ width: `${item[1] * 2}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                 </div>
                 <div style={{ width: '30px', textAlign: 'right', fontWeight: '600' }}>{item[1]}</div>
               </div>
             ))}
          </div>
        </Panel>

        <Panel title="Monthly Comparison">
           <div style={{ padding: '24px', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderBottom: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', height: '100%', padding: '0 24px' }}>
               {[45, 60, 58, 70, 72].map((h, i) => (
                 <div key={i} style={{ flex: 1, height: `${h}%`, background: '#94A3B8', borderRadius: '4px 4px 0 0' }}></div>
               ))}
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 40px', color: 'var(--text-muted)', fontSize: '12px' }}>
             <span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
          </div>
        </Panel>
      </div>
    </main>
  );
}
