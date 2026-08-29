import { Panel } from "./DashboardLayout";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle, Search, Filter, Download, Eye } from "lucide-react";

export default function Cases() {
  const cases = [
    { id: "BR-2026-00125", date: "25 Aug 2026, 10:25 AM", name: "Kumar Sandeep", docNo: "1234 5678 9012", risk: "Low", result: "Clear", officer: "Rajesh K." },
    { id: "BR-2026-00124", date: "25 Aug 2026, 10:18 AM", name: "Ramesh Yadav", docNo: "ABCDE1234F", risk: "Medium", result: "Review", officer: "Rajesh K." },
    { id: "BR-2026-00123", date: "25 Aug 2026, 10:10 AM", name: "Mohd. Arif", docNo: "P9876543", risk: "High", result: "Flagged", officer: "Rajesh K." },
    { id: "BR-2026-00122", date: "25 Aug 2026, 10:02 AM", name: "Pooja Sharma", docNo: "XYZ1234567", risk: "Low", result: "Clear", officer: "Rajesh K." },
    { id: "BR-2026-00121", date: "25 Aug 2026, 09:45 AM", name: "Anita Singh", docNo: "P1234567", risk: "Low", result: "Clear", officer: "Priya M." },
  ];

  return (
    <main className="content">
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">AUDIT TRAIL</span>
          <h2>Case History</h2>
          <p>Search and review previously screened documents.</p>
        </div>
        <button className="btn-primary" style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--border)' }}>
          <Download size={16} /> Download Report
        </button>
      </div>

      <Panel title="Case Records" className="mb-4">
        <div className="filters" style={{ display: 'flex', gap: '12px', padding: '16px', background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
          <div className="input-group" style={{ flex: 1, background: 'white' }}>
            <Search className="input-icon" size={16} />
            <input type="text" placeholder="Search name, passport, ID or case" />
          </div>
          <select style={{ padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', color: 'var(--text-dark)' }}>
            <option>Risk Level: All</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select style={{ padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', color: 'var(--text-dark)' }}>
            <option>Status: All</option>
            <option>Clear</option>
            <option>Review</option>
            <option>Flagged</option>
          </select>
          <button className="btn-primary" style={{ background: 'white', color: 'var(--text-dark)', border: '1px solid var(--border)' }}>
            <Filter size={16} /> Filter
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#F1F5F9', fontSize: '12px', color: 'var(--text-muted)' }}>
              <tr>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Case ID</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Date &amp; Time</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Document No.</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Risk Level</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Result</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Officer</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500' }}>{c.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{c.date}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500' }}>{c.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{c.docNo}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`recent-status status-${c.risk === 'Low' ? 'green' : c.risk === 'Medium' ? 'amber' : 'red'}`}>
                      {c.risk}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: c.result === 'Clear' ? '#16A34A' : c.result === 'Review' ? '#D97706' : '#DC2626' }}>
                      {c.result}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{c.officer}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link to="/dashboard/result" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
                      <Eye size={14} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </main>
  );
}
