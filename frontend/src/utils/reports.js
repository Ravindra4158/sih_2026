export function summarizeCases(cases = []) {
  const summary = { total: cases.length, low: 0, medium: 0, high: 0, approved: 0, pending: 0, rejected: 0, documentTypes: {} };

  cases.forEach((caseItem) => {
    const risk = String(caseItem.riskLevel || "High").toLowerCase();
    if (risk === "low") summary.low += 1;
    else if (risk === "medium") summary.medium += 1;
    else summary.high += 1;

    const status = String(caseItem.status || "Pending").toLowerCase();
    if (status === "approved") summary.approved += 1;
    else if (status === "rejected") summary.rejected += 1;
    else summary.pending += 1;

    const documentType = caseItem.docType || "Unknown";
    summary.documentTypes[documentType] = (summary.documentTypes[documentType] || 0) + 1;
  });

  return summary;
}

function csvValue(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildCasesCsv(cases = []) {
  const headers = ["Case ID", "Date", "Name", "Document Type", "Number", "Risk", "Status", "Officer"];
  const rows = cases.map((caseItem) => [caseItem.id, caseItem.date, caseItem.name, caseItem.docType, caseItem.docNo, caseItem.riskLevel, caseItem.status, caseItem.officer]);
  return [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
}

export function downloadCsv(filename, csv) {
  const link = document.createElement("a");
  link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}