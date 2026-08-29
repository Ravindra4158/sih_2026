import { Header, Panel, Stat } from "./DashboardLayout";
import { Link } from "react-router-dom";
import { Calendar, FileText, User as UserIcon, Star, Info } from "lucide-react";

export default function Dashboard() {
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
              <span>25 May 2025</span>
              <span>10:30 AM</span>
            </div>
          </div>
        </div>

        <div className="stats dashboard-stats">
          <Stat number="148" label="Total Screenings" trend="18" foot="vs yesterday" />
          <Stat number="98" label="Verified (Green)" tone="green" foot="66%" />
          <Stat number="32" label="Flagged (Amber)" tone="amber" foot="22%" />
          <Stat number="18" label="High Risk (Red)" tone="red" foot="12%" />
        </div>

        <div className="grid-2 dashboard-grid">
          <Panel title="Recent Screenings" className="recent-screenings-panel">
            <div className="panel-header-action">
              <a href="#">View All</a>
            </div>
            <div className="recent-list">
              {[
                { name: "Kumar Sandeep", doc: "Aadhaar Card", time: "10:25 AM", status: "VERIFIED", tone: "green" },
                { name: "Ramesh Yadav", doc: "PAN Card", time: "10:18 AM", status: "FLAGGED", tone: "amber" },
                { name: "Mohd. Arif", doc: "Passport", time: "10:10 AM", status: "HIGH RISK", tone: "red" },
                { name: "Pooja Sharma", doc: "Voter ID", time: "10:02 AM", status: "VERIFIED", tone: "green" },
              ].map((item, i) => (
                <div className="recent-item" key={i}>
                  <FileText className="recent-icon" size={18} />
                  <div className="recent-details">
                    <strong>{item.name}</strong>
                    <span>{item.doc}</span>
                  </div>
                  <div className="recent-time">{item.time}</div>
                  <div className={`recent-status status-${item.tone}`}>{item.status}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Risk Distribution">
            <div className="donut-row">
              <div className="donut">
                <div className="donut-center">
                  <strong>148</strong>
                  <span>Total</span>
                </div>
              </div>
              <div className="legend">
                <span><i className="green-bg" /> Low Risk (Green) <b>98 (66%)</b></span>
                <span><i className="amber-bg" /> Medium Risk (Amber) <b>32 (22%)</b></span>
                <span><i className="red-bg" /> High Risk (Red) <b>18 (12%)</b></span>
              </div>
            </div>
          </Panel>
        </div>

        <div className="info-banner">
          <Star size={18} className="info-icon-star" />
          <span>Use <b>"New Screening"</b> to start a new identity/document verification.</span>
        </div>
      </main>
    </>
  );
}
