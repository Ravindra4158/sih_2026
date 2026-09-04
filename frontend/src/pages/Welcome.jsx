import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ShieldCheck, Activity, Zap } from "lucide-react";
import idCardImg from "../assets/id_card.png";
import passportImg from "../assets/passport_document.png";

export default function Welcome() {
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show landing page for exactly 2.8 seconds, then initiate smooth transition to login
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2800);

    // After 400ms transition completes, navigate to /login
    const navTimer = setTimeout(() => {
      navigate("/login");
    }, 3200);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div className={`welcome-container ${isExiting ? "welcome-exiting" : "welcome-entering"}`}>
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
        </div>
        
        <div className="welcome-footer-bar">
          Trusted Technology. Safer Tomorrow.
        </div>
      </div>
      
      <div className="welcome-right">
        <div className="welcome-brand-showcase">
          <div className="brand-doc-wrapper brand-doc-id">
            <img 
              src={idCardImg} 
              alt="Government Identity Card" 
              className="brand-doc-img id-card-img" 
            />
          </div>
          <div className="brand-doc-wrapper brand-doc-passport">
            <img 
              src={passportImg} 
              alt="International Passport Document" 
              className="brand-doc-img passport-img" 
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes welcomeFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.992);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes welcomeFadeOut {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.985);
          }
        }

        .welcome-container {
          display: flex;
          min-height: 100vh;
          height: auto;
          overflow-x: hidden;
          background: var(--white);
          position: relative;
          will-change: opacity, transform;
        }

        .welcome-container.welcome-entering {
          animation: welcomeFadeIn 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .welcome-container.welcome-exiting {
          animation: welcomeFadeOut 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
          pointer-events: none;
        }

        .welcome-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2.5rem clamp(2rem, 3.5vw, 4rem) 4.5rem clamp(2rem, 3.5vw, 4rem) !important;
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
          flex: 1.25 !important;
          background: linear-gradient(135deg, #091a3b 0%, #030a1c 100%) !important;
          position: relative !important;
          bottom: auto !important;
          height: auto !important;
          min-height: 100vh !important;
          margin-left: -6% !important;
          padding-left: clamp(2rem, 3.5vw, 4.5rem) !important;
          padding-right: clamp(2rem, 3.5vw, 4.5rem) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
          box-sizing: border-box;
        }

        .welcome-brand-showcase {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(1.25rem, 2.5vw, 2.75rem);
          width: 100%;
          max-width: clamp(560px, 52vw, 840px);
          margin: 0 auto;
          box-sizing: border-box;
          flex-wrap: nowrap;
        }

        .brand-doc-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          flex-shrink: 0;
        }

        .brand-doc-wrapper:hover {
          transform: translateY(-5px);
        }

        .brand-doc-img {
          display: block;
          width: auto;
          height: auto;
          object-fit: contain;
          image-rendering: -webkit-optimize-contrast;
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 24px rgba(20, 75, 168, 0.35));
          border-radius: 8px;
          transition: filter 0.3s ease, transform 0.3s ease;
        }

        .brand-doc-wrapper:hover .brand-doc-img {
          filter: drop-shadow(0 26px 50px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 32px rgba(34, 197, 94, 0.35));
        }

        .brand-doc-id .brand-doc-img {
          max-height: clamp(190px, 28vh, 270px);
          max-width: clamp(270px, 32vw, 430px);
        }

        .brand-doc-passport .brand-doc-img {
          max-height: clamp(270px, 42vh, 390px);
          max-width: clamp(140px, 18vw, 210px);
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
          .brand-doc-id .brand-doc-img {
            max-height: 200px !important;
            max-width: 325px !important;
          }
          .brand-doc-passport .brand-doc-img {
            max-height: 280px !important;
            max-width: 150px !important;
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
            padding: 2.5rem clamp(1.5rem, 4vw, 3rem) 3.5rem clamp(1.5rem, 4vw, 3rem) !important;
            min-height: 320px !important;
            height: auto !important;
            width: 100% !important;
            flex: none !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .welcome-brand-showcase {
            justify-content: center !important;
            margin: 0 auto !important;
            gap: 1.5rem !important;
            max-width: 620px !important;
          }
          .brand-doc-id .brand-doc-img {
            max-height: 180px !important;
            max-width: 290px !important;
          }
          .brand-doc-passport .brand-doc-img {
            max-height: 260px !important;
            max-width: 130px !important;
          }
        }

        /* Mobile Breakpoint (<= 480px width) */
        @media (max-width: 480px) {
          .welcome-right {
            padding: 1.75rem 0.75rem 2.5rem 0.75rem !important;
            justify-content: center !important;
          }
          .welcome-brand-showcase {
            justify-content: center !important;
            margin: 0 auto !important;
            gap: 0.75rem !important;
            max-width: 100% !important;
          }
          .brand-doc-id .brand-doc-img {
            max-height: 120px !important;
            max-width: 54vw !important;
          }
          .brand-doc-passport .brand-doc-img {
            max-height: 175px !important;
            max-width: 32vw !important;
          }
        }
      `}</style>
    </div>
  );
}

