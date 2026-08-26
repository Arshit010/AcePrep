import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import TypingKeyboard from "../components/TypingKeyboard";
import SEO from "../components/SEO";

export default function Login() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Enter email and password");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/login", { email, password });
      await refreshUser();
      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Invalid email or password"
      );
    }

    setLoading(false);
  };

  return (
    <div className="auth-split-page">
      <SEO
        title="Sign In"
        description="Sign in to your AcePrep account to access your AI mock interviews, performance reports, and saved resumes."
      />
      {/* ── Left 50% Showcase Side ── */}
      <div className="auth-split-showcase">
        <div className="showcase-glow-bg" />
        <div className="showcase-header">
          <div className="showcase-brand" onClick={() => navigate("/")}>
            <span className="material-symbols-outlined brand-icon">psychology</span>
            <span className="brand-title">AcePrep</span>
          </div>
        </div>

        <div className="showcase-keyboard-container">
          <TypingKeyboard
            autoTypeText="Welcome back to AcePrep. Practice AI mock interviews, get instant feedback, and land your target role.       "
            scale={0.9}
            accentColor="#a85560"
            secondaryAccent="#e28d96"
          />
        </div>

        <div className="showcase-footer">
          <div className="showcase-pill-badge">
            <span className="material-symbols-outlined">auto_awesome</span>
            <span>AI Mock Interview Platform</span>
          </div>
          <p className="showcase-quote">
          "Practicing with AcePrep’s AI interviewer elevated both my verbal delivery and technical accuracy, replacing guesswork with structured, actionable insights."
          </p>
        </div>
      </div>

      {/* ── Right 50% Production Form Side ── */}
      <div className="auth-split-form-panel">
        <div className="auth-prod-form-wrapper">
          <div className="auth-prod-header">
            <div className="auth-mobile-logo" onClick={() => navigate("/")}>
              <span className="material-symbols-outlined">psychology</span>
              <span className="brand-text">AcePrep</span>
            </div>
            <h1>Welcome back</h1>
            <p className="auth-prod-sub">Sign in to your account to resume your interview preparation</p>
          </div>

          <form onSubmit={handleLogin} className="auth-prod-form">
            <div className="auth-field">
              <label htmlFor="login-email">Work or Personal Email</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">mail</span>
                <input
                  id="login-email"
                  type="email"
                  className="auth-input auth-input-with-icon"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password">Password</label>
                <Link to="/forgot-password" className="auth-forgot-link">Forgot password?</Link>
              </div>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">lock</span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input auth-input-with-icon"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            <button type="submit" className="auth-prod-btn" disabled={loading}>
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-btn-spinner" />
                  Signing in...
                </span>
              ) : (
                "Sign In to AcePrep"
              )}
            </button>

            {error && <p className="auth-error">{error}</p>}
          </form>

          <div className="auth-prod-footer">
            <p>
              Don't have an account? <Link to="/register" className="auth-signup-link">Create an account</Link>
            </p>
            <button className="auth-prod-back" onClick={() => navigate("/")}>
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
