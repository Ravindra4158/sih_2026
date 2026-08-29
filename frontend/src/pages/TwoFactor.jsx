import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ClipboardList, Lock } from "lucide-react";

export default function TwoFactor() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit if all filled
    if (index === 5 && value) {
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="auth-box">
      <div className="two-factor-content">
        <div className="two-factor-text">
          <h2>Two-Factor Authentication</h2>
          <p>Enter the 6-digit code sent to your registered mobile</p>
          
          <div className="code-inputs">
            {code.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                ref={(el) => (inputRefs.current[i] = el)}
                className="code-input"
              />
            ))}
          </div>

          <div className="resend-timer">
            <span>Didn't receive the code?</span>
            <span className="timer">00:45</span>
            <a href="#" className="resend-link">Resend Code</a>
          </div>

          <div className="security-info-box">
            <ClipboardList size={24} className="info-icon" />
            <p>This extra step helps us keep your account and system data secure.</p>
          </div>
        </div>
        
        <div className="two-factor-shield">
          <div className="shield-graphic">
            <Lock className="inner-lock" size={48} />
            <div className="shield-check-badge">
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-encryption-notice">
        <Lock size={14} /> Secure Authentication
      </div>
    </div>
  );
}
