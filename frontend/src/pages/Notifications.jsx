import { Panel } from "./DashboardLayout";
import { Bell, Info, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function Notifications() {
  const notifications = [
    { id: 1, type: "alert", title: "System Update Scheduled", message: "A mandatory system update will occur at 02:00 AM on 28 Aug. Expect 15 mins of downtime.", time: "1 hour ago", icon: Info, color: "var(--primary)", bg: "#EFF6FF" },
    { id: 2, type: "warning", title: "High Alert: Checkpoint Alpha", message: "Multiple suspected tampered documents detected at Checkpoint Alpha within the last hour.", time: "3 hours ago", icon: AlertTriangle, color: "#D97706", bg: "#FEF3C7" },
    { id: 3, type: "success", title: "Case BR-2026-00122 Cleared", message: "Your referred case has been reviewed and cleared by the supervisor.", time: "5 hours ago", icon: CheckCircle2, color: "#16A34A", bg: "#DCFCE7" },
    { id: 4, type: "security", title: "New Login Detected", message: "A new login was detected from a recognized device (IP: 192.168.1.45).", time: "1 day ago", icon: ShieldCheck, color: "var(--text-muted)", bg: "#F1F5F9" },
  ];

  return (
    <main className="content">
      <div className="page-heading dashboard-heading" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>ALERTS &amp; MESSAGES</span>
          <h2 style={{ margin: '8px 0 4px' }}>Notifications</h2>
          <p>Recent system alerts, case updates, and announcements.</p>
        </div>
        <button className="btn-primary" style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--border)' }}>
          Mark All as Read
        </button>
      </div>

      <Panel title="Recent Notifications">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {notifications.map((notif, index) => (
            <div key={notif.id} style={{ 
              display: 'flex', gap: '16px', padding: '16px 20px', 
              borderBottom: index < notifications.length - 1 ? '1px solid var(--border)' : 'none' 
            }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '50%', 
                background: notif.bg, color: notif.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <notif.icon size={20} />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>{notif.title}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{notif.time}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {notif.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </main>
  );
}
