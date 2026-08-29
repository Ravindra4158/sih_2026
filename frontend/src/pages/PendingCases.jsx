import { Panel } from "./DashboardLayout";
import { Clock, AlertTriangle, Eye, CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function PendingCases() {
  const pending = [
    { id: "BR-2026-00135", time: "10 mins ago", type: "Manual Review", reason: "Face match below threshold (72%)", severity: "amber", name: "David Johnson", doc: "Passport" },
    { id: "BR-2026-00134", time: "25 mins ago", type: "Supervisor Override", reason: "Watchlist flag on similar name", severity: "red", name: "Ahmed Ali", doc: "Visa" },
    { id: "BR-2026-00133", time: "1 hour ago", type: "Manual Review", reason: "Suspected metadata tampering", severity: "amber", name: "Sarah Williams", doc: "ID Card" },
    { id: "BR-2026-00132", time: "2 hours ago", type: "Missing Document", reason: "Back side of ID not provided", severity: "amber", name: "Michael Chen", doc: "Driver License" },
  ];

  return (
    <main className="content">
      <div className="page-heading dashboard-heading" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>ACTION REQUIRED</span>
          <h2 style={{ margin: '8px 0 4px' }}>Pending Cases</h2>
          <p>Cases requiring manual review or supervisor intervention.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {pending.map((item) => (
          <Panel key={item.id} className="pending-card" style={{ padding: '0' }}>
            <div className="pending-card-inner">
              
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '50%', 
                background: item.severity === 'red' ? '#FEE2E2' : '#FEF3C7',
                color: item.severity === 'red' ? '#DC2626' : '#D97706',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Clock size={24} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '15px' }}>{item.id}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.time}</span>
                  <span style={{ 
                    fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px',
                    background: item.severity === 'red' ? '#FEE2E2' : '#FEF3C7',
                    color: item.severity === 'red' ? '#991B1B' : '#B45309'
                  }}>
                    {item.type}
                  </span>
                </div>
                
                <div style={{ fontSize: '13px', color: 'var(--text-dark)', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Issue: </span>
                  <strong>{item.reason}</strong>
                </div>
                
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                  <span><strong style={{ color: 'var(--text-dark)' }}>Applicant:</strong> {item.name}</span>
                  <span><strong style={{ color: 'var(--text-dark)' }}>Document:</strong> {item.doc}</span>
                </div>
              </div>

              <div className="pending-card-actions">
                <Link to="/dashboard/result" className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', gap: '6px' }}>
                  <Eye size={14} /> Review Case
                </Link>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border)' }}>
                  Assign to Self
                </button>
              </div>

            </div>
          </Panel>
        ))}
      </div>
    </main>
  );
}
