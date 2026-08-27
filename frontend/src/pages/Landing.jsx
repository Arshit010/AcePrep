import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import Lenis from "lenis";
import Navbar from "../components/Navbar";
import SlicedWaves from "../components/SlicedWaves";
import SplashCursor from "../components/SplashCursor";
import { useAuth } from "../context/AuthContext";

import SEO from "../components/SEO";

function useCountUp(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(end);
    }
    requestAnimationFrame(tick);
  }, [end, duration]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { animate(); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  return { count, ref };
}

function StatCounter({ end, suffix = "", label, duration }) {
  const { count, ref } = useCountUp(end, duration);
  return (
    <div className="stat-item" ref={ref}>
      <div className="stat-num">{count.toLocaleString()}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("revealed"); observer.unobserve(el); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function handleCardMouseMove(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
  e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
}

function ActionCard({ icon, title, description, buttonText, onClick, delay = 0 }) {
  const ref = useScrollReveal();
  return (
    <div
      className="action-card scroll-reveal"
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      onMouseMove={handleCardMouseMove}
    >
      <div className="card-icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="card-btn" onClick={onClick}>{buttonText}</button>
    </div>
  );
}

function StepCard({ number, title, description, delay }) {
  const ref = useScrollReveal();
  return (
    <div
      className="step-card scroll-reveal"
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      onMouseMove={handleCardMouseMove}
    >
      <div className="step-number">{number}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }) {
  const ref = useScrollReveal();
  return (
    <div
      className="feature-card scroll-reveal-up"
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      onMouseMove={handleCardMouseMove}
    >
      <div className="feature-icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="lp-root">
      <SplashCursor
        RAINBOW_MODE={false}
        COLOR="#e27282"
        SPLAT_RADIUS={0.10}
        SPLAT_FORCE={3500}
        DENSITY_DISSIPATION={4.5}
      />
      <SEO
        title="AI-Powered Technical & Job Interview Command Center"
        description="Practice smarter, learn faster, and walk into every technical interview with confidence. AcePrep offers real-time AI mock interviews, custom topic practice, instant scoring, and actionable feedback."
      />

      <Navbar /><section className="lp-hero">
        <div className="hero-bg">
          <SlicedWaves
            color1="#E0A4AC"
            color2="#7D4047"
            color3="#B497CF"
            columns={14}
            rows={8}
            barThickness={0.1}
            speed={0.35}
            travel={0.7}
            waveSpread={0.9}
            rowOffset={1.0}
            softness={0.05}
            glow={0}
            brightness={1.0}
            contrast={1.0}
            opacity={0.65}
            orientation="horizontal"
            alternate={false}
            mouseInteraction={true}
            mouseStrength={1}
            mouseRadius={0.3}
            grain={true}
            grainIntensity={0.05}
          />
        </div>
        <div className="hero-content">
          <h1>
            Your Interview{" "}
            <span className="hero-highlight">Command Center</span>
          </h1>
          <p className="hero-sub">
            Practice smarter, learn faster, and walk into every interview with confidence
            powered by real time AI.
          </p>
          <div className="hero-btns">
            {user ? (
              <button className="btn-animated" onClick={() => navigate("/dashboard")}>
                <span>Go to Dashboard</span>
              </button>
            ) : (
              <>
                <button className="btn-animated" onClick={() => navigate("/register")}>
                  <span>Create Free Account</span>
                </button>
                <button className="btn-secondary" onClick={() => navigate("/login")}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </section><div className="stats-bar">
        <StatCounter end={5000} suffix="+" label="Interviews Completed" duration={2200} />
        <StatCounter end={95}   suffix="%" label="Satisfaction Rate"    duration={1800} />
        <StatCounter end={500}  suffix="+" label="Topics Covered"      duration={2000} />
      </div><section className="lp-section">
        <h2 className="section-title">Quick <span className="title-accent">Actions</span></h2>
        <div className="cards-grid-single">
          <ActionCard
            icon="play_circle"
            title="Start Topic Interview"
            description="Choose any subject and practice answering real-world interview questions."
            buttonText={user ? "Go to Dashboard" : "Start Interview"}
            onClick={() => navigate(user ? "/dashboard" : "/register")}
            delay={0}
          />
        </div>
      </section><section className="lp-how">
        <h2 className="section-title">How It <span className="title-accent">Works</span></h2>
        <div className="steps-grid">
          <StepCard number="01" title="Sign Up Free" description="Create your account in seconds. No credit card needed , just jump right in." delay={0} />
          <StepCard number="02" title="Select Your Topic" description="Choose from 500+ topics or enter your own. Tailor the interview to your goals." delay={150} />
          <StepCard number="03" title="Give the Interview" description="Answer real-world questions in a realistic, AI-powered interview experience." delay={300} />
          <StepCard number="04" title="Get Instant Feedback" description="Receive detailed scores, hiring verdicts, strengths, and areas to improve , instantly." delay={450} />
        </div>
      </section><section className="lp-section">
        <h2 className="section-title">Why <span className="title-accent">AcePrep</span></h2>
        <div className="features-grid">
          <FeatureCard icon="person" title="Personalized Interviews" description="Role-specific questions tailored to your exact skillset and experience level." delay={0} />
          <FeatureCard icon="bolt" title="Real-Time AI" description="Lightning-fast AI that adapts to your answers and feels like a real interviewer." delay={180} />
          <FeatureCard icon="assessment" title="Detailed Reports" description="Hiring verdicts, scores, strengths, weaknesses, and actionable improvement insights." delay={360} />
          <FeatureCard icon="lock" title="Private & Secure" description="Your resume, responses, and personal data remain fully encrypted and private." delay={540} />
          <FeatureCard icon="trending_up" title="Track Progress" description="Monitor your growth over time with interview history and performance trends." delay={720} />
          <FeatureCard icon="devices" title="Practice Anywhere" description="Seamless experience across desktop, tablet, and mobile , interview on the go." delay={900} />
        </div>
      </section><div className="lp-cta">
        <div className="cta-glow" />
        <h2>Ready to Ace Your Next Interview?</h2>
        <p>Join thousands of developers practicing smarter with AcePrep.</p>
        <div className="hero-btns">
          {user ? (
            <button className="btn-animated" onClick={() => navigate("/dashboard")}>
              <span>Go to Dashboard</span>
            </button>
          ) : (
            <>
              <button className="btn-animated" onClick={() => navigate("/register")}>
                <span>Get Started</span>
              </button>
              <button className="btn-secondary" onClick={() => navigate("/login")}>
                Sign In
              </button>
            </>
          )}
        </div>
      </div><footer className="lp-footer">
        <div className="footer-top-row">
          <div className="footer-brand">AcePrep © {new Date().getFullYear()}</div>
          <div className="footer-links">
            <span onClick={() => navigate("/features")}>Features</span>
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
