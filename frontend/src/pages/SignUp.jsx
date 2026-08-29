import { Link, useNavigate } from "react-router-dom";
import { User, MapPin, Mail, Lock, EyeOff, ShieldCheck } from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();

  const handleSignUp = (e) => {
    e.preventDefault();
    // Simulate sign up and go to login
    navigate("/login");
  };

  return (
    <div className="auth-box wide-auth-box">
      <div className="auth-top-bar">
        <Link to="/login" className="btn-back">← Back</Link>
        <div className="auth-top-role">
          <ShieldCheck size={16} /> Officer Sign Up
        </div>
      </div>

      <div className="auth-box-header signup-header">
        <div className="login-icon-wrap">
          <User size={32} />
        </div>
        <h2>Create Officer Account</h2>
        <p>Fill in your details to create your account</p>
      </div>

      <form className="auth-form" onSubmit={handleSignUp}>
        <div className="input-group">
          <User className="input-icon" size={18} />
          <div className="input-content">
            <label>Full Name</label>
            <input type="text" placeholder="Enter your full name" required />
          </div>
        </div>

        <div className="input-group">
          <MapPin className="input-icon" size={18} />
          <div className="input-content">
            <label>Checkpoint</label>
            <input type="text" placeholder="Enter your checkpoint" required />
          </div>
        </div>

        <div className="input-group">
          <Mail className="input-icon" size={18} />
          <div className="input-content">
            <label>Email Address</label>
            <input type="email" placeholder="Enter your official email" required />
          </div>
        </div>

        <div className="input-group">
          <Lock className="input-icon" size={18} />
          <div className="input-content">
            <label>New Password</label>
            <input type="password" placeholder="Enter new password" required />
          </div>
          <EyeOff className="input-icon-right" size={18} />
        </div>

        <div className="input-group">
          <Lock className="input-icon" size={18} />
          <div className="input-content">
            <label>Confirm Password</label>
            <input type="password" placeholder="Confirm your password" required />
          </div>
          <EyeOff className="input-icon-right" size={18} />
        </div>

        <div className="password-requirements">
          <Lock size={16} className="req-icon" />
          <p>Password must be at least 8 characters long and contain uppercase, lowercase, number and special character.</p>
        </div>

        <button type="submit" className="btn-primary btn-block signup-btn">
          <User size={18} /> Create Account
        </button>
      </form>

      <div className="auth-footer-link">
        Already have an account? <Link to="/login">Sign In</Link>
      </div>
    </div>
  );
}
