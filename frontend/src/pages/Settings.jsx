import { useState } from "react";
import { Panel } from "./DashboardLayout";
import { 
  User, Lock, Bell, Shield, Save, Mail, MapPin, 
  Key, ShieldAlert, BadgeCheck, EyeOff, CheckCircle 
} from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  
  // Interactive Toggles State
  const [twoFactor, setTwoFactor] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [audioAlarms, setAudioAlarms] = useState(true);
  
  // Profile Form State
  const [fullName, setFullName] = useState("Rajesh Kumar");
  const [email, setEmail] = useState("rajesh.kumar@border.gov.in");

  // Status message
  const [saveStatus, setSaveStatus] = useState("");

  const handleSave = () => {
    setSaveStatus("Settings successfully stored on security server!");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  const navItems = [
    { id: "profile", name: "Profile Information", icon: User },
    { id: "security", name: "Password & Security", icon: Lock },
    { id: "notifications", name: "Notification Preferences", icon: Bell },
    { id: "privacy", name: "Privacy Settings", icon: Shield }
  ];

  return (
    <main className="content" style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Page header */}
      <div className="page-heading dashboard-heading" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>COMMAND PROFILE</span>
          <h2 style={{ margin: '8px 0 4px' }}>Officer Profile &amp; Settings</h2>
          <p>Configure credentials, checkpoint preferences, and security authorization.</p>
        </div>
        <button onClick={handleSave} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
          <Save size={16} /> Save Changes
        </button>
      </div>

      {saveStatus && (
        <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', animation: 'slideDown 0.2s ease-out' }}>
          <CheckCircle size={16} color="#10B981" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Officer Dossier Card & Nav Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Dossier Card */}
          <div style={{
            background: 'linear-gradient(135deg, #0b1b32 0%, #162a45 100%)',
            color: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 10px 20px rgba(11,27,50,0.15)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
            
            {/* Avatar Badge */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
              border: '4px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '800',
              color: 'white',
              margin: '0 auto 16px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              RK
              {/* Online pulse dot */}
              <div style={{ position: 'absolute', bottom: '0', right: '0', width: '16px', height: '16px', borderRadius: '50%', background: '#10B981', border: '3px solid #0b1b32' }} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{fullName}</h3>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500', display: 'block', marginBottom: '16px' }}>Rank: Senior Border Patrol Officer</span>

            {/* Clearance badges */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10.5px', background: 'rgba(96,165,250,0.1)', color: '#93C5FD', padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(147,197,253,0.15)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                <BadgeCheck size={12} /> Clear Lvl 4
              </span>
              <span style={{ fontSize: '10.5px', background: 'rgba(16,185,129,0.1)', color: '#34D399', padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                <ShieldAlert size={12} /> Override Auth
              </span>
            </div>
          </div>

          {/* Navigation panel */}
          <Panel title="CONSOLE SETTINGS">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 0' }}>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '12px 16px', 
                      background: isActive ? '#EFF6FF' : 'transparent', 
                      color: isActive ? 'var(--primary)' : 'var(--text-muted)', 
                      borderRadius: '8px', 
                      fontWeight: isActive ? '600' : '500', 
                      textAlign: 'left', 
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

        </div>

        {/* Right Side: Active Settings Panel Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Panel 1: Profile Information */}
          {activeTab === "profile" && (
            <Panel title="Profile Information" className="fade-in">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' }}>
                
                {/* Full name input group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-dark)' }}>Officer Full Name</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', color: 'var(--text-dark)' }} 
                    />
                  </div>
                </div>

                {/* Email Address input group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-dark)' }}>Government Email Address</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px', color: 'var(--text-dark)' }} 
                    />
                  </div>
                </div>

                {/* Officer ID (Disabled) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-dark)' }}>Officer Security Code ID</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                    <input 
                      type="text" 
                      defaultValue="Officer_102" 
                      disabled 
                      style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '8px', border: '1px solid var(--border)', background: '#F8FAFC', fontSize: '13.5px', color: 'var(--text-muted)' }} 
                    />
                  </div>
                </div>

                {/* Assigned Checkpoint (Disabled) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-dark)' }}>Assigned Checkpoint Border</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <MapPin size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                    <input 
                      type="text" 
                      defaultValue="Checkpoint Alpha (Terminal 3, Arrival)" 
                      disabled 
                      style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '8px', border: '1px solid var(--border)', background: '#F8FAFC', fontSize: '13.5px', color: 'var(--text-muted)' }} 
                    />
                  </div>
                </div>

              </div>
            </Panel>
          )}

          {/* Panel 2: Password & Security */}
          {activeTab === "security" && (
            <Panel title="Security &amp; Authorization Credentials" className="fade-in">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' }}>
                
                {/* 2FA Slide Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13.5px', marginBottom: '4px', color: 'var(--text-dark)' }}>Two-Factor Authentication (2FA)</strong>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Require a temporary dynamic token during checkpoint logs.</span>
                  </div>
                  <div 
                    onClick={() => setTwoFactor(!twoFactor)}
                    style={{ 
                      width: '46px', 
                      height: '24px', 
                      background: twoFactor ? 'var(--primary)' : '#E2E8F0', 
                      borderRadius: '12px', 
                      position: 'relative', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s' 
                    }}
                  >
                    <div style={{ 
                      width: '18px', 
                      height: '18px', 
                      background: 'white', 
                      borderRadius: '50%', 
                      position: 'absolute', 
                      top: '3px', 
                      left: twoFactor ? '25px' : '3px', 
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                    }} />
                  </div>
                </div>

                {/* Password Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>RESET CONSOLE PASSWORD</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Password</label>
                    <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>New Password</label>
                    <input type="password" placeholder="Min. 8 characters" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }} />
                  </div>
                </div>

              </div>
            </Panel>
          )}

          {/* Panel 3: Notifications */}
          {activeTab === "notifications" && (
            <Panel title="Command Alerts &amp; Telemetry Notifications" className="fade-in">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' }}>
                
                {/* Email Reports Slide Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13.5px', marginBottom: '4px', color: 'var(--text-dark)' }}>Email Shift Summary Reports</strong>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Receive daily CSV screening log audits at shift end.</span>
                  </div>
                  <div 
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    style={{ 
                      width: '46px', 
                      height: '24px', 
                      background: emailAlerts ? 'var(--primary)' : '#E2E8F0', 
                      borderRadius: '12px', 
                      position: 'relative', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s' 
                    }}
                  >
                    <div style={{ 
                      width: '18px', 
                      height: '18px', 
                      background: 'white', 
                      borderRadius: '50%', 
                      position: 'absolute', 
                      top: '3px', 
                      left: emailAlerts ? '25px' : '3px', 
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                    }} />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                {/* Audio Alarms Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13.5px', marginBottom: '4px', color: 'var(--text-dark)' }}>High Risk Audio Alarms</strong>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Play alarm audio when a TAMPER / MISMATCH signal is raised.</span>
                  </div>
                  <div 
                    onClick={() => setAudioAlarms(!audioAlarms)}
                    style={{ 
                      width: '46px', 
                      height: '24px', 
                      background: audioAlarms ? 'var(--primary)' : '#E2E8F0', 
                      borderRadius: '12px', 
                      position: 'relative', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s' 
                    }}
                  >
                    <div style={{ 
                      width: '18px', 
                      height: '18px', 
                      background: 'white', 
                      borderRadius: '50%', 
                      position: 'absolute', 
                      top: '3px', 
                      left: audioAlarms ? '25px' : '3px', 
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                    }} />
                  </div>
                </div>

              </div>
            </Panel>
          )}

          {/* Panel 4: Data Privacy */}
          {activeTab === "privacy" && (
            <Panel title="Retaining Rules &amp; Privacy Audits" className="fade-in">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-dark)' }}>Dossier Verification Retention Log Duration</label>
                  <select style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', fontSize: '13.5px' }}>
                    <option>30 Days (Standard Border Policy)</option>
                    <option>60 Days (Elevated Alert Protocol)</option>
                    <option>90 Days (Archive logs only)</option>
                    <option>No Retention (Delete immediately)</option>
                  </select>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '4px' }}>
                    Note: Verification details are purged after expiration. Original upload files are always destroyed immediately upon pipeline conclusion.
                  </span>
                </div>

              </div>
            </Panel>
          )}

        </div>

      </div>

      <style>{`
        .fade-in {
          animation: pageFadeIn 0.3s ease-out;
        }
        @keyframes pageFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
