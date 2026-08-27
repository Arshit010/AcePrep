import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Lenis from "lenis";
import Navbar from "../components/Navbar";
import CardSwap, { Card } from "../components/CardSwap";
import ParticleText from "../components/ParticleText";
import { useAuth } from "../context/AuthContext";

import SEO from "../components/SEO";

function revealRef(el) {
  if (!el) return;
  const obs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); }
  }, { threshold: 0.15 });
  obs.observe(el);
}

const VALUES = [
  { icon: "lightbulb", title: "Innovation First", desc: "We leverage the latest AI models to deliver interview experiences that feel real and adaptive." },
  { icon: "diversity_3", title: "Inclusivity", desc: "Our platform is designed for developers of all backgrounds, skill levels, and career stages." },
  { icon: "verified", title: "Quality Obsessed", desc: "Every question, every feedback point, every feature is crafted to maximize your growth." },
];

function handleCardMouseMove(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
  e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
}

export default function About() {
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
        title="About Us"
        description="Learn about AcePrep's mission to revolutionize technical interview preparation for ambitious developers through adaptive real-time AI technology."
      />
      <Navbar />

      <section className="page-hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <ParticleText
            text="About AcePrep"
            color="#ffffff"
            highlightColor="#a85560"
            density={1}
            particleSize={1.8}
            scatter={240}
            idleDrift={0.9}
            pointerRepel={50}
            fontSize="clamp(2.5rem, 5.5vw, 4.5rem)"
          />
          <p className="hero-sub">Empowering developers worldwide to ace their dream interviews with AI.</p>
        </div>
      </section>

      <section className="lp-how">
        <h2 className="section-title">Our <span className="title-accent">Story</span></h2>
        <div className="about-content">
          <div className="about-text">
            <p>
              AcePrep was born from a simple idea , every developer deserves access to high-quality
              interview preparation, regardless of their background or budget.
            </p>
            <p>
              We combine cutting-edge AI with real-world interview patterns to create an experience
              that's as close to the real thing as possible. Our platform has helped thousands of
              developers land their dream jobs at top companies worldwide.
            </p>
            <p>
              Whether you're a fresh graduate or a senior engineer looking to level up, AcePrep
              adapts to your skill level and provides personalized feedback that actually helps you grow.
            </p>
          </div>

          <div className="about-highlights-swap">
            <CardSwap width={380} height={250} cardDistance={45} verticalDistance={35} delay={4500} pauseOnHover={true}>
              <Card customClass="about-swap-card">
                <div className="card-swap-icon">
                  <span className="material-symbols-outlined">rocket_launch</span>
                </div>
                <h3 className="card-swap-title">Our Mission</h3>
                <p className="card-swap-desc">Democratize interview prep with AI-powered, accessible tools for everyone.</p>
              </Card>

              <Card customClass="about-swap-card">
                <div className="card-swap-icon">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <h3 className="card-swap-title">Personalized Intelligence</h3>
                <p className="card-swap-desc">AI mock interviews tailored dynamically to your target role and resume skills.</p>
              </Card>

              <Card customClass="about-swap-card">
                <div className="card-swap-icon">
                  <span className="material-symbols-outlined">emoji_events</span>
                </div>
                <h3 className="card-swap-title">Our Impact</h3>
                <p className="card-swap-desc">95% of users report feeling more confident walking into their interviews.</p>
              </Card>
            </CardSwap>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <h2 className="section-title">What Drives <span className="title-accent">Us</span></h2>
        <div className="features-grid">
          {VALUES.map((v, i) => (
            <div
              className="feature-card scroll-reveal-right"
              key={v.title}
              ref={revealRef}
              style={{ transitionDelay: `${i * 200}ms` }}
              onMouseMove={handleCardMouseMove}
            >
              <div className="feature-icon">
                <span className="material-symbols-outlined">{v.icon}</span>
              </div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-cta">
        <div className="cta-glow" />
        <h2>Start Practicing with AcePrep</h2>
        <p>Start your journey to interview mastery today.</p>
        <div className="hero-btns">
          {user ? (
            <button className="btn-animated" onClick={() => navigate("/dashboard")}>
              <span>Go to Dashboard</span>
            </button>
          ) : (
            <>
              <button className="btn-animated" onClick={() => navigate("/register")}>
                <span>Get Started Free</span>
              </button>
              <button className="btn-secondary" onClick={() => navigate("/contact")}>
                Contact Us
              </button>
            </>
          )}
        </div>
      </div>

      <footer className="lp-footer">
        <div className="footer-top-row">
          <div className="footer-brand">AcePrep © {new Date().getFullYear()}</div>
          <div className="footer-links">
            <span onClick={() => navigate("/")}>Home</span>
            <span onClick={() => navigate("/features")}>Features</span>
            <span onClick={() => navigate("/about")} className="footer-link-active">About</span>
            <span onClick={() => navigate("/contact")}>Contact</span>
            <span onClick={() => window.open("/privacy", "_blank")}>Privacy Policy</span>
          </div>
        </div>
        <div className="footer-subtext">Built with Love for ambitious developers</div>
      </footer>
    </div>
  );
}
