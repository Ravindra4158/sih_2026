import { useEffect, useState } from "react";
import { Clock, Eye, ShieldAlert, ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Panel } from "./DashboardLayout";
import { mockDatabase } from "../utils/mockDatabase";

export default function PendingCases() {
  const [pendingCases, setPendingCases] = useState([]);
  const location = useLocation();

  useEffect(() => {
    mockDatabase.initialize();
    const list = mockDatabase.getAllCases();
    // Filter cases needing attention (Pending review status)
    const filtered = list.filter(c => c.status === "Pending");
    setPendingCases(filtered);
  }, [location.pathname]);

  return (
    <main className="content">
      <div className="page-heading dashboard-heading" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>ACTION REQUIRED</span>
          <h2 style={{ margin: '8px 0 4px' }}>Pending Cases</h2>
          <p>Cases requiring manual review or supervisor override decisions.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {pendingCases.length > 0 ? (
          pendingCases.map((item) => {
            const isHigh = item.riskLevel === "High";
            const severityColor = isHigh ? "red" : "amber";
            
            // Generate mock times relative to when the case was added or just default
            const mockTime = "Action Required";

            return (
              <Panel key={item.id} className="pending-card" style={{ padding: '0' }}>
                <div className="pending-card-inner" style={{ display: 'flex', padding: '20px', alignItems: 'center', gap: '20px' }}>
                  
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '50%', 
                    background: isHigh ? '#FEE2E2' : '#FEF3C7',
                    color: isHigh ? '#DC2626' : '#D97706',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Clock size={24} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '15px' }}>{item.id}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.date}</span>
                      <span style={{ 
                        fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px',
                        background: isHigh ? '#FEE2E2' : '#FEF3C7',
                        color: isHigh ? '#991B1B' : '#B45309'
                      }}>
                        {item.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '13px', color: 'var(--text-dark)', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Issue/Anomaly: </span>
                      <strong>
                        {item.warnings.length > 0 
                          ? item.warnings[0] 
                          : "Manual verify before authorization."}
                      </strong>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                      <span><strong style={{ color: 'var(--text-dark)' }}>Applicant:</strong> {item.name}</span>
                      <span><strong style={{ color: 'var(--text-dark)' }}>Document:</strong> {item.docType}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    <Link to={`/cases/${item.id}`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', gap: '6px', background: 'var(--primary)' }}>
                      <ShieldAlert size={14} /> Review Case
                    </Link>
                    <Link to={`/screening/${item.id}/results`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', gap: '6px', background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border)' }}>
                      <Eye size={14} /> View Report
                    </Link>
                  </div>

                </div>
              </Panel>
            );
          })
        ) : (
          <div style={{ padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
            No pending cases found. All screenings resolved!
          </div>
        )}
      </div>
    </main>
  );
}
