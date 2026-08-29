import { Shield, ShieldCheck, Activity, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="welcome-container">
      <div className="welcome-left">
        <div className="welcome-content">
          <div className="welcome-header">
            <span className="welcome-eyebrow">AI-Based</span>
            <h1 className="welcome-title">
              Fake Identity &amp;<br />
              Document Screening<br />
              System
            </h1>
            <p className="welcome-subtitle">
              Intelligent. Accurate. Secure.<br />
              For a Safer Nation.
            </p>
          </div>

          <div className="welcome-features">
            <div className="feature-item">
              <Shield className="feature-icon" size={16} />
              <span>AI-Powered Verification</span>
            </div>
            <div className="feature-item">
              <ShieldCheck className="feature-icon" size={16} />
              <span>Multi-Layer Security</span>
            </div>
            <div className="feature-item">
              <Activity className="feature-icon" size={16} />
              <span>Real-time Risk Analysis</span>
            </div>
            <div className="feature-item">
              <Zap className="feature-icon" size={16} />
              <span>Faster &amp; Smarter Decisions</span>
            </div>
          </div>

          <Link to="/login" className="btn-get-started">
            GET STARTED <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="welcome-footer-bar">
          Trusted Technology. Safer Tomorrow.
        </div>
      </div>
      
      <div className="welcome-right">
        {/* Placeholder for the AI/Network background graphic */}
        <div className="ai-graphic">
          <div className="id-card-overlay">
            <div className="id-card-header">IDENTITY CARD</div>
            <div className="id-card-body">
              <div className="id-avatar"></div>
              <div className="id-lines">
                <div className="id-line"></div>
                <div className="id-line"></div>
                <div className="id-line"></div>
                <div className="id-line short"></div>
              </div>
            </div>
            <div className="id-card-footer">
              <div className="id-line long"></div>
              <div className="id-status-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="status-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
