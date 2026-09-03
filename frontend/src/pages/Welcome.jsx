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

      <style>{`
        .welcome-container {
          display: flex;
          min-height: 100vh;
          height: auto;
          overflow-x: hidden;
          background: var(--white);
          position: relative;
        }

        .welcome-left {
          flex: 1.15;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2.5rem clamp(2rem, 4vw, 4rem) 4.5rem clamp(2rem, 4vw, 4rem) !important;
          position: relative;
          z-index: 2;
          background: var(--white);
          clip-path: polygon(0 0, 100% 0, 92% 100%, 0% 100%) !important;
          box-sizing: border-box;
          margin-bottom: 0 !important;
          min-height: 100vh;
        }

        .welcome-content {
          margin: auto 0 !important;
          max-width: 480px;
          width: 100%;
          padding-bottom: 1rem;
        }

        .welcome-title {
          font-size: clamp(1.75rem, 2.6vw, 2.4rem) !important;
          line-height: 1.2 !important;
          margin-bottom: 0.75rem !important;
        }

        .welcome-subtitle {
          font-size: clamp(0.9rem, 1.1vw, 1rem) !important;
          line-height: 1.5 !important;
          margin-bottom: 1.25rem !important;
        }

        .welcome-features {
          display: flex;
          flex-direction: column;
          gap: 0.75rem !important;
          margin-bottom: 1.5rem !important;
        }

        .btn-get-started {
          padding: 12px 28px !important;
          font-size: 14px !important;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 0.5rem;
        }

        .welcome-footer-bar {
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 100% !important;
          background: #0D264F !important;
          color: white !important;
          padding: 0.85rem clamp(2rem, 4vw, 4rem) !important;
          font-weight: 500;
          font-size: 13px !important;
          z-index: 10;
          box-sizing: border-box;
          letter-spacing: 0.02em;
        }

        .welcome-right {
          flex: 1 !important;
          background: linear-gradient(135deg, #091a3b 0%, #030a1c 100%) !important;
          position: relative !important;
          bottom: auto !important;
          height: auto !important;
          min-height: 100vh !important;
          margin-left: -7% !important;
          padding-left: clamp(2.5rem, 6vw, 6.5rem) !important;
          padding-right: 2rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
          box-sizing: border-box;
        }

        .ai-graphic {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .id-card-overlay {
          width: 320px !important;
          max-width: 100% !important;
          margin: 0 auto !important;
          box-sizing: border-box;
        }

        /* Short laptop screen height adjustments (<= 750px height) */
        @media (max-height: 750px) {
          .welcome-left {
            padding-top: 1.75rem !important;
            padding-bottom: 3.75rem !important;
          }
          .welcome-title {
            font-size: 1.85rem !important;
            margin-bottom: 0.5rem !important;
          }
          .welcome-subtitle {
            margin-bottom: 1rem !important;
          }
          .welcome-features {
            gap: 0.5rem !important;
            margin-bottom: 1.25rem !important;
          }
        }

        /* Responsive Breakpoint for Tablet & Minimized Windows (<= 900px width) */
        @media (max-width: 900px) {
          .welcome-container {
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh !important;
          }
          .welcome-left {
            clip-path: none !important;
            flex: none !important;
            width: 100% !important;
            padding: 2rem 1.5rem 1.5rem 1.5rem !important;
            margin-bottom: 0 !important;
            min-height: auto !important;
            justify-content: flex-start !important;
          }
          .welcome-content {
            margin: 0 auto !important;
            max-width: 480px;
            width: 100%;
            padding-bottom: 0 !important;
          }
          .welcome-footer-bar {
            position: static !important;
            bottom: auto !important;
            left: auto !important;
            width: 100% !important;
            max-width: 480px !important;
            margin: 1.25rem auto 0 auto !important;
            padding: 0.75rem 1rem !important;
            text-align: center !important;
            border-radius: 6px !important;
            font-size: 12px !important;
          }
          .welcome-right {
            position: relative !important;
            bottom: auto !important;
            margin-left: 0 !important;
            padding: 2rem 1.5rem 3rem 1.5rem !important;
            min-height: unset !important;
            height: auto !important;
            width: 100% !important;
            flex: none !important;
          }
          .id-card-overlay {
            width: 290px !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 18px !important;
          }
        }

        @media (max-width: 480px) {
          .btn-get-started {
            width: 100% !important;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
