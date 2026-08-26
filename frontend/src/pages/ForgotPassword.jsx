import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import TypingKeyboard from "../components/TypingKeyboard";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!email) return setError("Please enter your email");

    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMsg(res.data.message || "Reset link sent to your email!");
    } catch (err) {
      console.log("FORGOT ERROR:", err);
      setError(err?.response?.data?.message || "Failed to send reset email");
    }

    setLoading(false);
  };

  return (
    <div className="auth-split-page">
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
            autoTypeText="Reset your password securely. We'll send you an encrypted recovery link straight to your email.       "
            scale={0.9}
            accentColor="#a85560"
            secondaryAccent="#e28d96"
          />
        </div>

        <div className="showcase-footer">
          <div className="showcase-pill-badge">
            <span className="material-symbols-outlined">lock_reset</span>
            <span>Secure Password Recovery</span>
          </div>
          <p className="showcase-quote">
            "Your account security is our top priority. Reset links are encrypted and expire automatically."
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
            <h1>Reset password</h1>
            <p className="auth-prod-sub">Enter your email address and we'll send you a link to reset your password</p>
          </div>

          <form onSubmit={handleSend} className="auth-prod-form">
            <div className="auth-field">
              <label htmlFor="reset-email">Work or Personal Email</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">mail</span>
                <input
                  id="reset-email"
                  type="email"
                  className="auth-input auth-input-with-icon"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-prod-btn" disabled={loading}>
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-btn-spinner" />
                  Sending link...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>

            {msg && <p className="success-msg">{msg}</p>}
            {error && <p className="auth-error">{error}</p>}
          </form>

          <div className="auth-prod-footer">
            <p>
              Remember your password? <Link to="/login" className="auth-signin-link">Sign In</Link>
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