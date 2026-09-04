import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle, Search, Filter, Download, Eye, Loader2 } from "lucide-react";
import { Panel } from "./DashboardLayout";
import { getCases } from "../services/api";

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    setLoading(true);
    getCases({ risk: riskFilter, status: statusFilter, search: searchQuery })
      .then(setCases)
      .catch(() => {
        // Fallback to localStorage
        try { setCases(JSON.parse(localStorage.getItem("ai_border_cases") || "[]")); } catch {}
      })
      .finally(() => setLoading(false));
  }, [riskFilter, statusFilter, searchQuery]);

  const handleDownloadReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Case ID,Date,Name,Document Type,Number,Risk,Status,Officer"].join(",") + "\n"
      + cases.map(c => [c.id, c.date, c.name, c.docType, c.docNo, c.riskLevel, c.status, c.officer].join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "border_screening_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Server-side filtering is done via API; cases is already filtered
  const filteredCases = cases;

  const getDocuments = (caseItem) => (
    Array.isArray(caseItem.allDocuments) && caseItem.allDocuments.length > 0
      ? caseItem.allDocuments
      : [{ filename: caseItem.docType || "Document" }]
  );

  return (
    <main className="content">
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>AUDIT TRAIL</span>
          <h2>Case History</h2>
          <p>Search and review previously screened documents.</p>
        </div>
        <button onClick={handleDownloadReport} className="btn-primary" style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--border)' }}>
          <Download size={16} /> Download CSV Report
        </button>
      </div>

      <Panel title="Case Records" className="mb-4">
        <div className="filters" style={{ display: 'flex', gap: '12px', padding: '16px', background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
          <div className="input-group" style={{ flex: 1, background: 'white', display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px' }}>
            <Search className="input-icon" size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Search name, ID or document number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', border: 'none', padding: '10px 0', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <select 
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', color: 'var(--text-dark)', fontSize: '13px' }}
          >
            <option value="All">Risk Level: All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', color: 'var(--text-dark)', fontSize: '13px' }}
          >
            <option value="All">Status: All</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#F1F5F9', fontSize: '12px', color: 'var(--text-muted)' }}>
              <tr>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Case ID</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Date &amp; Time</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Document Type</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Number</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Risk Level</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Officer</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline' }} /> Loading cases...
                  </td>
                </tr>
              ) : filteredCases.length > 0 ? (
                filteredCases.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500' }}>{c.id}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{c.date}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500' }}>{c.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {getDocuments(c).map((document, index) => (
                        <div key={`${c.id}-document-${index}`} style={{ marginBottom: index < getDocuments(c).length - 1 ? '4px' : 0 }}>
                          {document.filename || `Document ${index + 1}`}
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {c.docNo || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`recent-status status-${c.riskLevel === 'Low' ? 'green' : c.riskLevel === 'Medium' ? 'amber' : 'red'}`}>
                        {c.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: c.status === 'Approved' ? '#16A34A' : c.status === 'Rejected' ? '#DC2626' : '#D97706' }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{c.officer}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link to={`/screening/${c.id}/results?from=history`} style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No matching cases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </main>
  );
}
