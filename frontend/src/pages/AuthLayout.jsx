import { Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="auth-container">
      <div className="auth-sidebar">
        <div className="auth-sidebar-header">
          <span>PS 188 - AI-Based Fake Identity &amp;</span>
          <span>Document Screening System</span>
          <div className="emblem-placeholder" style={{ marginBottom: '1.25rem' }}>
            {/* National Emblem Placeholder */}
          </div>
        </div>

        <div className="auth-sidebar-brand">
          <div className="brand-shield" style={{ marginTop: '0.25rem' }}>
            <ShieldCheck size={40} className="shield-icon" />
          </div>
          <h2>PS 188</h2>
          <h1>AI-Based Fake Identity &amp;<br />Document Screening System</h1>
          <p>Secure. Intelligent. Reliable.</p>
        </div>

        <div className="auth-sidebar-footer">
          <div className="security-badge">
            <ShieldCheck size={16} />
          </div>
          <span>AI Technology for a Safer Nation</span>
        </div>
      </div>
      
      <div className="auth-content">
        <div className="auth-form-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
