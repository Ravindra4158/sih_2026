import { useEffect, useState } from "react";
import { Header, Panel, Stat } from "./DashboardLayout";
import { Link } from "react-router-dom";
import { Calendar, FileText, Star, Loader2 } from "lucide-react";
import { getCases } from "../services/api";

export default function Dashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch(() => {
        try { setCases(JSON.parse(localStorage.getItem("ai_border_cases") || "[]")); } catch {}
      })
      .finally(() => setLoading(false));
  }, []);

  const total = cases.length;
  const approved = cases.filter(c => c.status === "Approved" || c.riskLevel === "Low").length;
  const medium = cases.filter(c => c.riskLevel === "Medium").length;
  const high = cases.filter(c => c.riskLevel === "High").length;

  const recent = [...cases].slice(0, 4);

  const riskToTone = (r) => r === "Low" ? "green" : r === "Medium" ? "amber" : "red";
  const statusLabel = (c) => {
    if (c.riskLevel === "High") return { text: "HIGH RISK", tone: "red" };
    if (c.riskLevel === "Medium") return { text: "FLAGGED", tone: "amber" };
    return { text: "VERIFIED", tone: "green" };
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <>
      <Header />
      <main className="content">
        <div className="page-heading dashboard-heading">
          <div>
            <h2>Welcome, Officer Rajesh Kumar</h2>
            <p>Stay alert. Stay secure.</p>
          </div>
          <div className="date-time">
            <Calendar size={18} />
            <div>
              <span>{dateStr}</span>
              <span>{timeStr}</span>
            </div>
          </div>
        </div>

        <div className="stats dashboard-stats">
          <Stat number={loading ? "…" : total} label="Total Screenings" foot="all time" />
          <Stat number={loading ? "…" : approved} label="Verified (Green)" tone="green" foot={total ? `${Math.round(approved/total*100)}%` : "—"} />
          <Stat number={loading ? "…" : medium} label="Flagged (Amber)" tone="amber" foot={total ? `${Math.round(medium/total*100)}%` : "—"} />
          <Stat number={loading ? "…" : high} label="High Risk (Red)" tone="red" foot={total ? `${Math.round(high/total*100)}%` : "—"} />
        </div>

        <div className="grid-2 dashboard-grid">
          <Panel title="Recent Screenings" className="recent-screenings-panel">
            <div className="panel-header-action">
              <Link to="/dashboard/history">View All</Link>
            </div>
            <div className="recent-list">
              {loading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite", display: "inline" }} /> Loading...
                </div>
              ) : recent.length > 0 ? recent.map((item, i) => {
                const s = statusLabel(item);
                return (
                  <div className="recent-item" key={i}>
                    <FileText className="recent-icon" size={18} />
                    <div className="recent-details">
                      <strong>{item.name}</strong>
                      <span>{item.docType}</span>
                    </div>
                    <div className="recent-time">{item.date?.split(",")[1]?.trim() || ""}</div>
                    <div className={`recent-status status-${s.tone}`}>{s.text}</div>
                  </div>
                );
              }) : (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  No screenings yet. <Link to="/dashboard/screening">Start one →</Link>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Risk Distribution">
            <div className="donut-row">
              <div 
                className="donut"
                style={{
                  background: total > 0 ? `conic-gradient(
                    #22C55E 0% ${Math.round(approved/total*100)}%,
                    #F59E0B ${Math.round(approved/total*100)}% ${Math.round((approved+medium)/total*100)}%,
                    #EF4444 ${Math.round((approved+medium)/total*100)}% 100%
                  )` : undefined
                }}
              >
                <div className="donut-center">
                  <strong>{loading ? "…" : total}</strong>
                  <span>Total</span>
                </div>
              </div>
              <div className="legend">
                <span><i className="green-bg" /> Low Risk (Green) <b>{approved} ({total ? Math.round(approved/total*100) : 0}%)</b></span>
                <span><i className="amber-bg" /> Medium Risk (Amber) <b>{medium} ({total ? Math.round(medium/total*100) : 0}%)</b></span>
                <span><i className="red-bg" /> High Risk (Red) <b>{high} ({total ? Math.round(high/total*100) : 0}%)</b></span>
              </div>
            </div>
          </Panel>
        </div>

        <div className="info-banner">
          <Star size={18} className="info-icon-star" />
          <span>Use <b>"New Screening"</b> to start a new identity/document verification.</span>
        </div>
      </main>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .donut-row {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 24px 16px !important;
          gap: 28px !important;
          flex-wrap: wrap !important;
        }

        .donut {
          width: 140px !important;
          height: 140px !important;
          min-width: 140px !important;
          min-height: 140px !important;
          max-width: 140px !important;
          max-height: 140px !important;
          flex: 0 0 140px !important;
          flex-shrink: 0 !important;
          aspect-ratio: 1 / 1 !important;
          border-radius: 50% !important;
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-sizing: border-box !important;
        }

        .donut-center {
          width: 100px !important;
          height: 100px !important;
          min-width: 100px !important;
          min-height: 100px !important;
          max-width: 100px !important;
          max-height: 100px !important;
          flex: 0 0 100px !important;
          flex-shrink: 0 !important;
          aspect-ratio: 1 / 1 !important;
          border-radius: 50% !important;
          box-sizing: border-box !important;
        }

        .legend {
          min-width: 170px;
        }

        @media (max-width: 640px) {
          .dashboard-heading {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .date-time {
            width: 100% !important;
            box-sizing: border-box !important;
          }
        }

        @media (max-width: 480px) {
          .dashboard-stats {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .donut-row {
            flex-direction: column !important;
            gap: 16px !important;
            padding: 20px 12px !important;
          }
          .legend {
            width: 100% !important;
            max-width: 240px !important;
          }
          .recent-item {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .recent-time {
            margin-right: 0 !important;
            order: 3 !important;
            width: 100% !important;
            padding-left: 34px !important;
          }
          .recent-status {
            order: 2 !important;
            margin-left: auto !important;
          }
        }
      `}</style>
    </>
  );
}
