import { Panel } from "./DashboardLayout";
import { User, Lock, Bell, Shield, Save } from "lucide-react";

export default function Settings() {
  return (
    <main className="content">
      <div className="page-heading dashboard-heading" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>PREFERENCES</span>
          <h2 style={{ margin: '8px 0 4px' }}>Profile &amp; Settings</h2>
          <p>Manage your account, security, and system preferences.</p>
        </div>
        <button className="btn-primary">
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="settings-layout-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Panel title="Navigation">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#EFF6FF', color: 'var(--primary)', borderRadius: '8px', fontWeight: '600', textAlign: 'left', width: '100%' }}>
                <User size={18} /> Profile Information
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text-muted)', borderRadius: '8px', fontWeight: '500', textAlign: 'left', width: '100%' }}>
                <Lock size={18} /> Password &amp; Security
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text-muted)', borderRadius: '8px', fontWeight: '500', textAlign: 'left', width: '100%' }}>
                <Bell size={18} /> Notification Preferences
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text-muted)', borderRadius: '8px', fontWeight: '500', textAlign: 'left', width: '100%' }}>
                <Shield size={18} /> Privacy Settings
              </button>
            </div>
          </Panel>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Panel title="Profile Information">
            <div className="settings-form-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>Full Name</label>
                <input type="text" defaultValue="Rajesh Kumar" style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-dark)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>Officer ID</label>
                <input type="text" defaultValue="Officer_102" disabled style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', background: '#F8FAFC', fontSize: '14px', color: 'var(--text-muted)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>Email Address</label>
                <input type="email" defaultValue="rajesh.kumar@border.gov.in" style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-dark)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>Assigned Checkpoint</label>
                <input type="text" defaultValue="Checkpoint Alpha (Terminal 3)" disabled style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', background: '#F8FAFC', fontSize: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </Panel>

          <Panel title="System Preferences">
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Two-Factor Authentication (2FA)</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Require a code from your mobile device when logging in.</span>
                  </div>
                  <div style={{ width: '44px', height: '24px', background: 'var(--primary)', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                     <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }}></div>
                  </div>
                </div>
                
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Email Notifications</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Receive daily summary reports and high-priority alerts via email.</span>
                  </div>
                  <div style={{ width: '44px', height: '24px', background: '#E2E8F0', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                     <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}></div>
                  </div>
                </div>
             </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
