import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Lenis from "lenis";
import Navbar from "../components/Navbar";
import SEO from "../components/SEO";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="lp-root">
      <SEO
        title="Privacy Policy"
        description="Read AcePrep's privacy policy to understand how we protect your personal data, resume uploads, and interview responses."
      />
      <Navbar />

      {/* ─── Page Hero ─── */}
      <section className="page-hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <h1>
            Privacy Policy & <span className="hero-highlight">AI Security</span>
          </h1>
          <p className="hero-sub">
            Your privacy, resume confidentiality, and AI data protection are our highest priorities.
            Learn how AcePrep handles your data and AI API integrations.
          </p>
        </div>
      </section>

      {/* ─── Highlights Summary ─── */}
      <section className="lp-section">
        <div className="privacy-highlights-grid">
          <div className="privacy-highlight-card">
            <div className="privacy-card-icon">
              <span className="material-symbols-outlined">key</span>
            </div>
            <h3>Server-Side AI API Keys</h3>
            <p>
              AI API keys are securely managed strictly on backend environment variables.
              Keys are never exposed to browser clients or public code.
            </p>
          </div>

          <div className="privacy-highlight-card">
            <div className="privacy-card-icon">
              <span className="material-symbols-outlined">block</span>
            </div>
            <h3>Zero AI Model Training</h3>
            <p>
              Your resumes, prompts, and interview answers sent via AI APIs are never used by 
              AI providers to train public models.
            </p>
          </div>

          <div className="privacy-highlight-card">
            <div className="privacy-card-icon">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <h3>End-to-End Encryption</h3>
            <p>
              All traffic between your browser, our servers, and AI API endpoints is 
              encrypted via TLS 1.3 / SSL protocols.
            </p>
          </div>

          <div className="privacy-highlight-card">
            <div className="privacy-card-icon">
              <span className="material-symbols-outlined">shield</span>
            </div>
            <h3>No Data Selling</h3>
            <p>
              We do not sell, rent, or trade your personal information, resumes, or interview audio
              to third-party recruiters or advertisers.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Main Policy Content ─── */}
      <section className="lp-how privacy-body-section">
        <div className="privacy-content-container">

          {/* Section 1 */}
          <div className="privacy-block">
            <div className="privacy-block-header">
              <span className="material-symbols-outlined">psychology</span>
              <h2>1. AI Integration & API Key Security Policy</h2>
            </div>
            <div className="privacy-block-text">
              <p>
                AcePrep utilizes advanced Artificial Intelligence (including Google Gemini and language model APIs) 
                to generate tailored interview questions, evaluate audio/text responses, and calculate detailed candidate feedback.
              </p>
              <ul className="privacy-list">
                <li>
                  <strong>API Key Management:</strong> All API keys used for AI features are stored securely 
                  within server-side environment configurations (`process.env`). They are never embedded in client-side code, 
                  stored in local storage, or transmitted to end-user browsers.
                </li>
                <li>
                  <strong>Stateless Processing:</strong> AI API requests are processed as isolated, stateless API calls. 
                  Once an interview score and evaluation report is returned, the prompt payload is disassociated from session memory.
                </li>
                <li>
                  <strong>AI Provider Compliance:</strong> We interface only with enterprise-tier API endpoints 
                  that strictly enforce zero data retention policies for model training. Your data is not included in training corpora.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="privacy-block">
            <div className="privacy-block-header">
              <span className="material-symbols-outlined">folder_shared</span>
              <h2>2. Information We Collect</h2>
            </div>
            <div className="privacy-block-text">
              <p>
                To provide an accurate, personalized interview prep experience, we collect specific categories of information:
              </p>
              <ul className="privacy-list">
                <li>
                  <strong>Account Information:</strong> Name, email address, and cryptographically hashed passwords when you register.
                </li>
                <li>
                  <strong>Resume Data:</strong> PDF/Word documents uploaded by you. We parse skills, experience, and job history 
                  solely to generate role-relevant interview questions.
                </li>
                <li>
                  <strong>Interview Audio & Transcripts:</strong> Audio recorded during live video/voice interviews and the resulting text 
                  transcripts used to analyze speech patterns, technical accuracy, and soft skills.
                </li>
                <li>
                  <strong>Usage & Session Data:</strong> Technical logs (IP address, browser type, device metadata) used to ensure system stability 
                  and security.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="privacy-block">
            <div className="privacy-block-header">
              <span className="material-symbols-outlined">settings_suggest</span>
              <h2>3. How We Use Your Data</h2>
            </div>
            <div className="privacy-block-text">
              <p>We process your data strictly to deliver and improve the AcePrep platform:</p>
              <ul className="privacy-list">
                <li>Generating customized, topic-specific or resume-tailored interview scenarios.</li>
                <li>Computing real-time evaluation scores, hiring verdicts, strengths, and actionable feedback.</li>
                <li>Displaying historical performance metrics, progress trends, and topic breakdown analytics in your dashboard.</li>
                <li>Sending essential account notifications (e.g., password reset links, security alerts).</li>
              </ul>
            </div>
          </div>

          {/* Section 4 */}
          <div className="privacy-block">
            <div className="privacy-block-header">
              <span className="material-symbols-outlined">shield_person</span>
              <h2>4. Security & Storage Measures</h2>
            </div>
            <div className="privacy-block-text">
              <p>
                We implement robust administrative, technical, and physical safeguards to prevent unauthorized access, disclosure, or alteration of your data:
              </p>
              <ul className="privacy-list">
                <li><strong>Encryption in Transit:</strong> 256-bit SSL/TLS encryption for all data flowing between client, server, and APIs.</li>
                <li><strong>Cookie Security:</strong> Authentication tokens are managed with secure, `httpOnly`, `SameSite` cookie flags.</li>
                <li><strong>Access Control:</strong> Database access is restricted to authenticated, role-based backend processes.</li>
              </ul>
            </div>
          </div>

          {/* Section 5 */}
          <div className="privacy-block">
            <div className="privacy-block-header">
              <span className="material-symbols-outlined">manage_accounts</span>
              <h2>5. Your Data Rights & Choices</h2>
            </div>
            <div className="privacy-block-text">
              <p>You maintain full ownership and control over your personal information:</p>
              <ul className="privacy-list">
                <li><strong>Access & Export:</strong> View your complete interview history, transcripts, and scores inside your Dashboard.</li>
                <li><strong>Deletion & Purging:</strong> Request complete removal of your account, resume files, and interview history at any time.</li>
                <li><strong>Opt-Out:</strong> You may choose not to upload a resume and instead practice using standardized topic templates.</li>
              </ul>
            </div>
          </div>

          {/* Section 6 */}
          <div className="privacy-block">
            <div className="privacy-block-header">
              <span className="material-symbols-outlined">contact_support</span>
              <h2>6. Contact Us Regarding Privacy</h2>
            </div>
            <div className="privacy-block-text">
              <p>
                If you have questions, concerns, or data deletion requests regarding our Privacy Policy or AI key security practices, please contact our privacy team:
              </p>
              <div className="privacy-contact-box">
                <div><strong>Email:</strong> aceprepx@gmail.com</div>
                <div><strong>Response Time:</strong> Within 24-48 business hours</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="lp-footer">
        <div className="footer-top-row">
          <div className="footer-brand">© {new Date().getFullYear()} AcePrep. All rights reserved.</div>
          <div className="footer-links">
            <span onClick={() => window.open("/privacy", "_blank")} className="footer-link-active">Privacy Policy</span>
          </div>
        </div>
        <div className="footer-subtext">Built with Love for ambitious developers</div>
      </footer>
    </div>
  );
}
