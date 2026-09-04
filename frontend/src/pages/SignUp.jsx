import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Shield, Lock, Eye, EyeOff, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignUp = (e) => {
    e.preventDefault();
    login({ username: badgeId || fullName || "Officer", role: "officer" });
    navigate("/2fa");
  };

  return (
    <div className="auth-box">
      <div className="auth-box-header">
        <h2>Officer Registration</h2>
        <p>Register official credentials for Border Screening Access</p>
      </div>

      <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="input-group">
          <label>Full Name</label>
          <div className="input-with-icon">
            <User className="input-icon" size={18} />
            <input 
              type="text" 
              placeholder="e.g. Officer Rajesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label>Official Email Address</label>
          <div className="input-with-icon">
            <Mail className="input-icon" size={18} />
            <input 
              type="email" 
              placeholder="officer@immigration.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label>Badge / Employee ID</label>
          <div className="input-with-icon">
            <Shield className="input-icon" size={18} />
            <input 
              type="text" 
              placeholder="IND-IMM-88421"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label>Secure Password</label>
          <div className="input-with-icon">
            <Lock className="input-icon" size={18} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary auth-submit" style={{ marginTop: '8px' }}>
          <span>Register &amp; Proceed to 2FA</span>
          <ArrowRight size={18} />
        </button>

        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Already have an officer account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Log In</Link>
        </div>
      </form>
    </div>
  );
}
