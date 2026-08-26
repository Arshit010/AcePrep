import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Lenis from "lenis";
import Navbar from "../components/Navbar";
import ParticleText from "../components/ParticleText";
import { useAuth } from "../context/AuthContext";

import SEO from "../components/SEO";

const EXISTING_FEATURES = [
  { icon: "person", title: "Personalized Interviews", desc: "Role-specific questions tailored to your exact skillset and experience level." },
  { icon: "bolt", title: "Real-Time AI", desc: "Lightning-fast AI that adapts to your answers and feels like a real interviewer." },
  { icon: "assessment", title: "Detailed Reports", desc: "Hiring verdicts, scores, strengths, weaknesses, and actionable improvement insights." },
  { icon: "lock", title: "Private & Secure", desc: "Your resume, responses, and personal data remain fully encrypted and private." },
  { icon: "videocam", title: "Video Mock Interviews", desc: "Face-to-face AI interviews with real-time video analysis and camera controls." },
  { icon: "devices", title: "Practice Anywhere", desc: "Seamless experience across desktop, tablet, and mobile — interview on the go." },
];

const FAANG = [
  { name: "Meta", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg", invert: false },
  { name: "Apple", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg", invert: true },
  { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", invert: true },
  { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg", invert: false },
  { name: "Google", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg", invert: false },
  { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg", invert: false },
];

const UPCOMING = [
  { icon: "trending_up", title: "Track Progress", desc: "Monitor your growth over time with interview history and performance trends." },
  { icon: "code", title: "Live Coding Challenges", desc: "Solve coding problems in a real IDE environment with AI-powered hints and solutions." },
  { icon: "group", title: "Peer Practice", desc: "Match with other developers for mock interview sessions and mutual feedback." },
  { icon: "school", title: "Learning Paths", desc: "Structured courses from beginner to advanced for every major tech topic." },
  { icon: "analytics", title: "AI Interview Coach", desc: "Personalized coaching that adapts to your weaknesses and tracks improvement." },
];

function handleCardMouseMove(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
  e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
}

function revealRef(el) {
  if (!el) return;
  const obs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); }
  }, { threshold: 0.15 });
  obs.observe(el);
}

export default function Features() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="lp-root">
      <SEO
        title="Features"
        description="Explore AcePrep's powerful AI features including custom topic mock interviews, video analysis, detailed performance reports, and FAANG-calibrated questions."
      />
      <Navbar />

      <section className="page-hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <ParticleText 
            text="Powerful Features" 
            color="#ffffff" 
            highlightColor="#a85560" 
            density={1}
            particleSize={1.8}
            scatter={240}
            idleDrift={0.9}
            pointerRepel={50}
            fontSize="clamp(2.5rem, 5.5vw, 4.5rem)" 
          />
          <p className="hero-sub">Everything you need to ace your next interview — and what's coming next.</p>
        </div>
      </section>

      {/* ─── Existing Features ─── */}
      <section className="lp-section">
        <h2 className="section-title">What You Get <span className="title-accent">Today</span></h2>
        <p className="section-sub">These features are live and ready for you right now.</p>
        <div className="features-grid">
          {EXISTING_FEATURES.map((f, i) => (
            <div
              className="feature-card scroll-reveal"
              key={f.title}
              ref={revealRef}
              style={{ transitionDelay: `${i * 150}ms` }}
              onMouseMove={handleCardMouseMove}
            >
              <div className="feature-icon">
                <span className="material-symbols-outlined">{f.icon}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAANG Question Bank ─── */}
      <section className="lp-section lp-faang">
        <h2 className="section-title">FAANG <span className="title-accent">Question Bank</span></h2>
        <p className="section-sub">Practice with real interview questions from the world's top tech companies.</p>

        <div className="faang-grid">
          {FAANG.map((company, i) => (
            <div
              className="faang-card scroll-reveal-right"
              key={company.name}
              ref={revealRef}
              style={{ transitionDelay: `${i * 120}ms` }}
              onMouseMove={handleCardMouseMove}
            >
              <div className="faang-logo-wrap">
                <img 
                  src={company.logo} 
                  alt={`${company.name} logo`} 
                  className={`faang-logo ${company.invert ? "logo-invert" : ""}`} 
                />
              </div>
              <h3>{company.name}</h3>
              <p>Question Bank</p>
              <span className="faang-badge">Coming Soon</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── More Coming Soon ─── */}
      <section className="lp-section">
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div className="section-status-pill coming-pill">
            COMING SOON
          </div>
        </div>
        <h2 className="section-title">More <span className="title-accent">Coming Soon</span></h2>
        <div className="features-grid">
          {UPCOMING.map((f, i) => (
            <div
              className="feature-card scroll-reveal-right"
              key={f.title}
              ref={revealRef}
              style={{ transitionDelay: `${i * 150}ms` }}
              onMouseMove={handleCardMouseMove}
            >
              <div className="feature-icon">
                <span className="material-symbols-outlined">{f.icon}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="faang-badge" style={{ marginTop: "12px" }}>Coming Soon</span>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-cta">
        <div className="cta-glow" />
        <h2>Start Practicing Today</h2>
        <p>Don't wait for new features — start acing interviews now with what's already available.</p>
        <div className="hero-btns">
          {user ? (
            <button className="btn-animated" onClick={() => navigate("/dashboard")}>
              <span>Go to Dashboard</span>
            </button>
          ) : (
            <button className="btn-animated" onClick={() => navigate("/register")}>
              <span>Get Started Free</span>
            </button>
          )}
        </div>
      </div>

      <footer className="lp-footer">
        <div className="footer-top-row">
          <div className="footer-brand">AcePrep © {new Date().getFullYear()}</div>
          <div className="footer-links">
            <span onClick={() => navigate("/")}>Home</span>
            <span onClick={() => navigate("/features")} className="footer-link-active">Features</span>
            <span onClick={() => navigate("/about")}>About</span>
            <span onClick={() => navigate("/contact")}>Contact</span>
            <span onClick={() => window.open("/privacy", "_blank")}>Privacy Policy</span>
          </div>
        </div>
        <div className="footer-subtext">Built with Love for ambitious developers</div>
      </footer>
    </div>
  );
}
