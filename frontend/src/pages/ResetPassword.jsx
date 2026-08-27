import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import TypingKeyboard from "../components/TypingKeyboard";

export default function ResetPassword() {
  const { token: rawToken } = useParams();
  const navigate = useNavigate();

  const token = useMemo(() => {
    if (!rawToken) return null;
    try {
      return decodeURIComponent(rawToken).replace(/\s/g, "").trim();
    } catch {
      return rawToken;
    }
  }, [rawToken]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password && confirm ? password === confirm : true;

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!token) return setError("Invalid or expired reset link");
    if (!password || !confirm) return setError("Please fill all fields");
    if (password !== confirm) return setError("Passwords do not match");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    setLoading(true);

    try {
      const res = await api.post(`/auth/reset/${token}`, { password });
      setMsg(res?.data?.message || "Password updated successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.log("RESET ERROR:", err?.response || err);
      if (err?.response?.status === 404) {
        setError("Reset link is broken. Please request a new one.");
      } else {
        setError(err?.response?.data?.message || "Reset link expired. Please request again.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-split-page"><div className="auth-split-showcase">
        <div className="showcase-glow-bg" />
        <div className="showcase-header">
          <div className="showcase-brand" onClick={() => navigate("/")}>
            <span className="material-symbols-outlined brand-icon">psychology</span>
            <span className="brand-title">AcePrep</span>
          </div>
        </div>

        <div className="showcase-keyboard-container">
          <TypingKeyboard
            autoTypeText="Set a new strong password for your AcePrep account. Protect your interview prep history and AI settings.       "
            scale={0.9}
            accentColor="#a85560"
            secondaryAccent="#e28d96"
          />
        </div>

        <div className="showcase-footer">
          <div className="showcase-pill-badge">
            <span className="material-symbols-outlined">key</span>
            <span>Encrypted Credentials</span>
          </div>
          <p className="showcase-quote">
            "Once updated, your new password will take effect immediately across all active sessions."
          </p>
        </div>
      </div><div className="auth-split-form-panel">
        <div className="auth-prod-form-wrapper">
          <div className="auth-prod-header">
            <div className="auth-mobile-logo" onClick={() => navigate("/")}>
              <span className="material-symbols-outlined">psychology</span>
              <span className="brand-text">AcePrep</span>
            </div>
            <h1>Create new password</h1>
            <p className="auth-prod-sub">Your new password must be at least 6 characters long</p>
          </div>

          <form onSubmit={handleReset} className="auth-prod-form">
            <div className="auth-field">
              <label htmlFor="new-password">New Password</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">lock</span>
                <input
                  id="new-password"
                  type={show ? "text" : "password"}
                  className="auth-input auth-input-with-icon"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShow(!show)}
                  tabIndex={-1}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined">
                    {show ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">lock_reset</span>
                <input
                  id="confirm-password"
                  type={show ? "text" : "password"}
                  className="auth-input auth-input-with-icon"
                  placeholder="Repeat new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              {confirm && (
                <p className={passwordsMatch ? "success-msg" : "auth-error"} style={{ marginTop: "6px", fontSize: "0.85rem" }}>
                  {passwordsMatch ? "Passwords match ✓" : "Passwords do not match"}
                </p>
              )}
            </div>

            <button type="submit" className="auth-prod-btn" disabled={!passwordsMatch || loading}>
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-btn-spinner" />
                  Updating...
                </span>
              ) : (
                "Update Password"
              )}
            </button>

            {msg && <p className="success-msg">{msg}</p>}
            {error && <p className="auth-error">{error}</p>}
          </form>

          <div className="auth-prod-footer">
            <p>
              Back to <Link to="/login" className="auth-signin-link">Sign In</Link>
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