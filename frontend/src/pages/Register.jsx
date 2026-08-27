import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import TypingKeyboard from "../components/TypingKeyboard";
import SEO from "../components/SEO";

function getPasswordStrength(pw) {
  if (!pw) return { label: "", level: 0 };

  const length = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);

  const varietyCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (length < 6 || varietyCount === 1) {
    return { label: "Weak", level: 1 };
  }

  if ((length >= 10 && varietyCount >= 3) || (length >= 8 && varietyCount === 4)) {
    return { label: "Strong", level: 3 };
  }

  if ((length >= 8 && varietyCount >= 2) || (length >= 6 && varietyCount >= 3)) {
    return { label: "Medium", level: 2 };
  }

  return { label: "Weak", level: 1 };
}

const OTP_LENGTH = 6;
const OTP_RESEND_COOLDOWN = 30;

export default function Register() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [otpPhase, setOtpPhase] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRefs = useRef([]);
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const focusOtpInput = (index) => {
    otpInputRefs.current[index]?.focus();
  };

  const handleOtpChange = useCallback((index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      focusOtpInput(index + 1);
    }
  }, []);

  const handleOtpKeyDown = useCallback((index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        focusOtpInput(index - 1);
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusOtpInput(index - 1);
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      focusOtpInput(index + 1);
    }
  }, [otpDigits]);

  const handleOtpPaste = useCallback((e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const digits = pasted.split("");
    setOtpDigits((prev) => {
      const next = [...prev];
      digits.forEach((d, i) => { next[i] = d; });
      return next;
    });

    const nextEmpty = Math.min(digits.length, OTP_LENGTH - 1);
    focusOtpInput(nextEmpty);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("Fill all fields");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      if (data.requiresOtp) {
        setOtpPhase(true);
        setSuccess("Verification code sent to " + email);
        setResendCooldown(OTP_RESEND_COOLDOWN);
        setTimeout(() => focusOtpInput(0), 100);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length < OTP_LENGTH) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setError("");
    setSuccess("");
    setVerifying(true);

    try {
      await api.post("/auth/verify-otp", { email, otp });
      await refreshUser();
      setSuccess("Email verified! Redirecting to dashboard...");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || "Verification failed");
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => focusOtpInput(0), 100);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (otpPhase && otpDigits.every((d) => d !== "")) {
      handleVerifyOtp();
    }
  }, [otpDigits, otpPhase]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setError("");
    setResending(true);
    try {
      await api.post("/auth/resend-otp", { email });
      setSuccess("New verification code sent!");
      setResendCooldown(OTP_RESEND_COOLDOWN);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => focusOtpInput(0), 100);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const handleBackToForm = () => {
    setOtpPhase(false);
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setError("");
    setSuccess("");
  };

  if (otpPhase) {
    return (
      <div className="auth-split-page">
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
              autoTypeText="Verify your email to activate your AcePrep workspace. Access 500+ topics and AI mock interviews.       "
              scale={0.9}
              accentColor="#a85560"
              secondaryAccent="#e28d96"
            />
          </div>
          <div className="showcase-footer">
            <div className="showcase-pill-badge">
              <span className="material-symbols-outlined">shield</span>
              <span>Secure Email Verification</span>
            </div>
            <p className="showcase-quote">
              "Security and privacy are built directly into AcePrep. Your interview data is encrypted and confidential."
            </p>
          </div>
        </div>

        <div className="auth-split-form-panel">
          <div className="auth-prod-form-wrapper">
            <div className="auth-prod-header">
              <div className="auth-mobile-logo" onClick={() => navigate("/")}>
                <span className="material-symbols-outlined">psychology</span>
                <span>AcePrep</span>
              </div>
              <h1>Verify Your Email</h1>
              <p className="auth-prod-sub">
                We sent a 6-digit verification code to <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="auth-prod-form">
              <div className="otp-input-group" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    className={`otp-input ${digit ? "otp-filled" : ""}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    disabled={verifying}
                  />
                ))}
              </div>

              <button type="submit" className="auth-prod-btn" disabled={verifying || otpDigits.some((d) => !d)}>
                {verifying ? (
                  <span className="auth-btn-loading">
                    <span className="auth-btn-spinner" />
                    Verifying...
                  </span>
                ) : (
                  "Verify & Continue"
                )}
              </button>

              {error && <p className="auth-error">{error}</p>}
              {success && <p className="success-msg">{success}</p>}

              <div className="otp-actions">
                <button
                  type="button"
                  className="otp-resend-btn"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resending}
                >
                  {resending
                    ? "Sending..."
                    : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend Code"}
                </button>

                <button type="button" className="otp-back-btn" onClick={handleBackToForm}>
                  <span className="material-symbols-outlined">arrow_back</span>
                  Change email
                </button>
              </div>
            </form>

            <div className="auth-prod-footer">
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

  return (
    <div className="auth-split-page">
      <SEO
        title="Create Free Account"
        description="Create a free AcePrep account today and start practicing real-time AI mock technical interviews with instant feedback."
      />
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
            autoTypeText="Join AcePrep today. Master technical interviews, practice resume-tailored questions, and land your dream job.       "
            scale={0.9}
            accentColor="#a85560"
            secondaryAccent="#e28d96"
          />
        </div>
        <div className="showcase-footer">
          <div className="showcase-pill-badge">
            <span className="material-symbols-outlined">rocket_launch</span>
            <span>Join 10,000+ Software Engineers</span>
          </div>
          <p className="showcase-quote">
            "Preparing for interviews used to take weeks. With AcePrep, I could simulate realistic interview pressure every day."
          </p>
        </div>
      </div>

      <div className="auth-split-form-panel">
        <div className="auth-prod-form-wrapper">
          <div className="auth-prod-header">
            <div className="auth-mobile-logo" onClick={() => navigate("/")}>
              <span className="material-symbols-outlined">psychology</span>
              <span className="brand-text">AcePrep</span>
            </div>
            <h1>Create your account</h1>
            <p className="auth-prod-sub">Start your AI-powered interview prep journey today</p>
          </div>

          <form onSubmit={handleRegister} className="auth-prod-form">
            <div className="auth-field">
              <label htmlFor="reg-name">Full Name</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">person</span>
                <input
                  id="reg-name"
                  className="auth-input auth-input-with-icon"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-email">Work or Personal Email</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">mail</span>
                <input
                  id="reg-email"
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
              <label htmlFor="reg-password">Password</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">lock</span>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input auth-input-with-icon"
                  placeholder="At least 6 characters"
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

              {password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div
                      className={`password-strength-fill strength-${strength.level}`}
                      style={{ width: `${(strength.level / 3) * 100}%` }}
                    />
                  </div>
                  <span className={`password-strength-label strength-${strength.level}`}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <button type="submit" className="auth-prod-btn" disabled={loading}>
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-btn-spinner" />
                  Sending verification code...
                </span>
              ) : (
                "Create AcePrep Account"
              )}
            </button>

            {error && <p className="auth-error">{error}</p>}
            {success && <p className="success-msg">{success}</p>}
          </form>

          <div className="auth-prod-footer">
            <p>
              Already have an account? <Link to="/login" className="auth-signin-link">Sign In</Link>
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
