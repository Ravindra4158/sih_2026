import { useEffect, useState } from "react";
import { Panel, Stat } from "./DashboardLayout";
import { Download } from "lucide-react";
import { getCases } from "../services/api";
import { buildCasesCsv, downloadCsv } from "../utils/reports";

const CHART_COLORS = ["var(--primary)", "#16A34A", "#F59E0B", "#9333EA"];
const TAMPERING_LABELS = ["Text Manipulation", "Photo Replacement", "Stamp Forgery", "Metadata Anomaly"];

function readCasesFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("ai_border_cases") || "[]");
  } catch {
    return [];
  }
}

function caseDate(caseItem) {
  const date = new Date(caseItem.date);
  return Number.isNaN(date.getTime()) ? null : date;
}

function percentage(value, total) {
  return total ? `${((value / total) * 100).toFixed(1)}%` : "0.0%";
}

function getTamperingCounts(cases) {
  const counts = Object.fromEntries(TAMPERING_LABELS.map((label) => [label, 0]));

  cases.forEach((caseItem) => {
    const evidence = [
      ...(caseItem.warnings || []),
      ...(caseItem.forensics?.anomalyRegions || []).map((region) => region.region_label || ""),
    ].join(" ").toLowerCase();

    if (/text|date|mrz/.test(evidence)) counts["Text Manipulation"] += 1;
    if (/photo|face/.test(evidence)) counts["Photo Replacement"] += 1;
    if (/stamp|seal/.test(evidence)) counts["Stamp Forgery"] += 1;
    if (/metadata/.test(evidence)) counts["Metadata Anomaly"] += 1;
  });

  return TAMPERING_LABELS.map((label) => [label, counts[label]]);
}

export default function Analytics() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch(() => setCases(readCasesFromStorage()))
      .finally(() => setLoading(false));
  }, []);

  const total = cases.length;
  const lowRisk = cases.filter((caseItem) => caseItem.riskLevel === "Low").length;
  const mediumRisk = cases.filter((caseItem) => caseItem.riskLevel === "Medium").length;
  const highRisk = cases.filter((caseItem) => caseItem.riskLevel === "High").length;

  const documentCounts = cases.reduce((counts, caseItem) => {
    const type = caseItem.docType || "Unknown";
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});
  const documentTypes = Object.entries(documentCounts)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 4);
  while (documentTypes.length < 4) documentTypes.push(["No data", 0]);

  const documentStops = documentTypes.reduce((stops, [, count], index) => {
    const start = index === 0 ? 0 : stops[index - 1].end;
    const end = start + (total ? (count / total) * 100 : 0);
    stops.push({ color: CHART_COLORS[index], start, end });
    return stops;
  }, []);
  const documentGradient = total
    ? `conic-gradient(${documentStops.map((stop) => `${stop.color} ${stop.start}% ${stop.end}%`).join(", ")})`
    : "#F1F5F9";

  const hourlyCounts = Array.from({ length: 7 }, () => 0);
  cases.forEach((caseItem) => {
    const date = caseDate(caseItem);
    if (date) hourlyCounts[Math.min(6, Math.floor(date.getHours() / 3))] += 1;
  });
  const maxHourlyCount = Math.max(...hourlyCounts, 1);
  const hourlyHeights = hourlyCounts.map((count) => (count / maxHourlyCount) * 100);

  const months = Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (4 - index));
    return date;
  });
  const monthlyCounts = months.map((month) => cases.filter((caseItem) => {
    const date = caseDate(caseItem);
    return date && date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
  }).length);
  const maxMonthlyCount = Math.max(...monthlyCounts, 1);
  const monthlyHeights = monthlyCounts.map((count) => (count / maxMonthlyCount) * 100);
  const tamperingCases = getTamperingCounts(cases);
  const maxTamperingCount = Math.max(...tamperingCases.map(([, count]) => count), 1);

  const handleDownloadReport = () => {
    downloadCsv("border_screening_report.csv", buildCasesCsv(cases));
  };

  return (
    <main className="content">
      <div className="page-heading dashboard-heading" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>INSIGHTS &amp; REPORTS</span>
          <h2 style={{ margin: '8px 0 4px' }}>Analytics</h2>
          <p>Performance trends across the border screening operation.</p>
        </div>
        <button onClick={handleDownloadReport} className="btn-primary" style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--border)' }}>
          <Download size={16} /> Download Report
        </button>
      </div>

      <div className="analytics-stats-grid">
        <Stat number={loading ? "…" : total.toLocaleString()} label="Total Screened" />
        <Stat number={loading ? "…" : percentage(lowRisk, total)} label="Cleared (Low Risk)" tone="green" />
        <Stat number={loading ? "…" : percentage(mediumRisk, total)} label="Review (Medium Risk)" tone="amber" />
        <Stat number={loading ? "…" : percentage(highRisk, total)} label="High Risk" tone="red" />
        <Stat number="N/A" label="Avg. Processing Time" />
      </div>

      <div className="analytics-charts-grid">
        <Panel title="Risk Level Trend">
          <div style={{ padding: '24px', height: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderBottom: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '100%', padding: '0 16px' }}>
               {hourlyHeights.map((height, i) => (
                 <div key={i} style={{ flex: 1, height: `${height}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', opacity: i % 2 === 0 ? 1 : 0.6 }}></div>
               ))}
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 32px', color: 'var(--text-muted)', fontSize: '12px' }}>
             <span>12 AM</span><span>4 AM</span><span>8 AM</span><span>12 PM</span><span>4 PM</span><span>8 PM</span>
          </div>
        </Panel>

        <Panel title="Document Type Distribution">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', height: '100%', padding: '32px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: documentGradient }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {documentTypes.map(([type, count], index) => (
                <div key={`${type}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: CHART_COLORS[index], borderRadius: '2px' }}></div> <span>{type} <b style={{ color: 'var(--text-dark)', marginLeft: '12px' }}>{percentage(count, total)}</b></span></div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Top Tampering Cases">
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
             {tamperingCases.map(([label, count]) => (
               <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
                 <div style={{ width: '140px', color: 'var(--text-muted)' }}>{label}</div>
                 <div style={{ flex: 1, height: '8px', background: '#F1F5F9', borderRadius: '4px' }}>
                   <div style={{ width: `${(count / maxTamperingCount) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                 </div>
                 <div style={{ width: '30px', textAlign: 'right', fontWeight: '600' }}>{count}</div>
               </div>
             ))}
          </div>
        </Panel>

        <Panel title="Monthly Comparison">
           <div style={{ padding: '24px', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderBottom: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', height: '100%', padding: '0 24px' }}>
               {monthlyHeights.map((height, i) => (
                 <div key={i} style={{ flex: 1, height: `${height}%`, background: '#94A3B8', borderRadius: '4px 4px 0 0' }}></div>
               ))}
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 40px', color: 'var(--text-muted)', fontSize: '12px' }}>
             {months.map((month) => <span key={month.toISOString()}>{month.toLocaleString('en-IN', { month: 'short' })}</span>)}
          </div>
        </Panel>
      </div>
    </main>
  );
}
