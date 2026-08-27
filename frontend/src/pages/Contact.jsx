import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Lenis from "lenis";
import Navbar from "../components/Navbar";
import ParticleText from "../components/ParticleText";
import FAQSection from "../components/FAQSection";

import SEO from "../components/SEO";

const CONTACT_FAQS = [
  { q: "Is AcePrep free to use?", a: "Yes! AcePrep is 100% free to use. You can create an account and practice unlimited AI mock interviews immediately." },
  { q: "What topics are covered?", a: "We cover 500+ topics including Data Structures, Algorithms, System Design, Web Development, DevOps, and much more." },
  { q: "How does AI feedback work?", a: "Our AI analyzes your answers in real-time, providing detailed scores, strengths, weaknesses, and actionable improvement suggestions." },
  { q: "Can I practice with my own resume?", a: "Absolutely! Upload your resume and get interview questions tailored to your specific experience and skills." },
];

export default function Contact() {
  const navigate = useNavigate();
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="lp-root">
      <SEO
        title="Contact Us"
        description="Get in touch with the AcePrep team for support, feature requests, or inquiries. We are dedicated to helping software engineers ace their technical interviews."
      />
      <Navbar />

      <section className="page-hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <ParticleText
            text="Get In Touch"
            color="#ffffff"
            highlightColor="#a85560"
            density={1}
            particleSize={1.8}
            scatter={240}
            idleDrift={0.9}
            pointerRepel={50}
            fontSize="clamp(2.5rem, 5.5vw, 4.5rem)"
          />
          <p className="hero-sub">Have questions, feedback, or just want to say hello? We'd love to hear from you.</p>
        </div>
      </section>

      <section className="lp-section">
        <h2 className="section-title">Reach <span className="title-accent">Out</span></h2>
        <div className="contact-grid">
          <div className="contact-card">
            <span className="material-symbols-outlined">mail</span>
            <h3>Email Us</h3>
            <p>aceprepx@gmail.com</p>
            <a href="mailto:aceprepx@gmail.com" className="contact-link">Send Email →</a>
          </div>
          <div className="contact-card">
            <span className="material-symbols-outlined">rate_review</span>
            <h3>Feature Requests</h3>
            <p>Have an idea to improve AcePrep? Let us know.</p>
            <a href="mailto:aceprepx@gmail.com?subject=Feature Request" className="contact-link">Share Feedback →</a>
          </div>
          <div className="contact-card">
            <span className="material-symbols-outlined">bug_report</span>
            <h3>Report Issues</h3>
            <p>Found a bug? Let us know</p>
            <a href="mailto:aceprepx@gmail.com?subject=Bug Report" className="contact-link">Report Bug →</a>
          </div>
        </div>
      </section>

      <FAQSection title={"Frequently\nasked\nquestions"} items={CONTACT_FAQS} />

      <footer className="lp-footer">
        <div className="footer-top-row">
          <div className="footer-brand">AcePrep © {new Date().getFullYear()}</div>
          <div className="footer-links">
            <span onClick={() => navigate("/")}>Home</span>
            <span onClick={() => navigate("/features")}>Features</span>
            <span onClick={() => navigate("/about")}>About</span>
            <span onClick={() => navigate("/contact")} className="footer-link-active">Contact</span>
            <span onClick={() => window.open("/privacy", "_blank")}>Privacy Policy</span>
          </div>
        </div>
        <div className="footer-subtext">Built with Love for ambitious developers</div>
      </footer>
    </div>
  );
}
