import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Shield, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [step, setStep] = useState("role"); // 'role' | 'login'
  const [role, setRole] = useState("officer"); // 'officer' | 'admin'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleContinue = () => {
    setStep("login");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate API Login
    login({ username, role });
    navigate("/2fa"); // Next step is 2FA as per mockup
  };

  if (step === "role") {
    return (
      <div className="auth-box">
        <div className="auth-box-header">
          <h2>Welcome!</h2>
          <p>Please choose how you want to continue</p>
        </div>

        <div className="role-selection">
          <div 
            className={`role-card ${role === "officer" ? "active" : ""}`}
            onClick={() => handleRoleSelect("officer")}
          >
            <div className="role-radio">
              <div className={`radio-inner ${role === "officer" ? "active" : ""}`}></div>
            </div>
            <div className="role-icon">
              <ShieldCheck size={48} />
            </div>
            <h3>Officer</h3>
            <p>Access screening tools to verify identities and documents</p>
            <button className="role-btn-circle"><ArrowRight size={18} /></button>
          </div>

          <div 
            className={`role-card ${role === "admin" ? "active" : ""}`}
            onClick={() => handleRoleSelect("admin")}
          >
            <div className="role-radio">
              <div className={`radio-inner ${role === "admin" ? "active" : ""}`}></div>
            </div>
            <div className="role-icon">
              <User size={48} />
            </div>
            <h3>Admin</h3>
            <p>Manage system, users, settings and analytics</p>
            <button className="role-btn-circle"><ArrowRight size={18} /></button>
          </div>
        </div>
        
        <div className="role-footer-action">
           <button className="btn-primary" onClick={handleContinue}>Continue</button>
        </div>

        <div className="auth-security-notice">
          <ShieldCheck size={20} className="notice-icon" />
          <div>
            <h4>Your security is our priority.</h4>
            <p>All data is encrypted and access is strictly monitored.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-box">
      <div className="auth-back">
        <button onClick={() => setStep("role")} className="btn-back">← Back</button>
      </div>

      <div className="auth-box-header login-header">
        <div className="login-icon-wrap">
          <ShieldCheck size={32} />
        </div>
        <h2>{role === "officer" ? "Officer Login" : "Admin Login"}</h2>
        <p>Please sign in to continue</p>
      </div>

      <form className="auth-form" onSubmit={handleLogin}>
        <div className="input-group">
          <User className="input-icon" size={18} />
          <input 
            type="text" 
            placeholder="Officer ID / Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <Lock className="input-icon" size={18} />
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="button" 
            className="input-icon-right" 
            onClick={() => setShowPassword(!showPassword)}
            style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)' }}
            title={showPassword ? "Hide password" : "Show password"}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>

        <div className="form-options">
          <label className="remember-me">
            <input type="checkbox" />
            <span>Remember Me</span>
          </label>
          <a href="#" className="forgot-password">Forgot Password?</a>
        </div>

        <button type="submit" className="btn-primary btn-block">
          LOGIN
        </button>

        <p className="auth-secure-text">Secure access for authorized {role}s only</p>
      </form>
      
      {role === "officer" && (
        <div className="auth-footer-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      )}

      <div className="auth-encryption-notice">
        <Lock size={14} /> Your data is protected and encrypted
      </div>
    </div>
  );
}
