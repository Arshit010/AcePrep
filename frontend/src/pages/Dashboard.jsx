import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ScrollToTopButton from "./ScrollToTopButton";
import FAQSection from "../components/FAQSection";
import SEO from "../components/SEO";
import { DashboardSkeleton } from "../components/Skeletons";

const faqs = [
  {
    q: "Is AcePrep suitable for beginners?",
    a: "Absolutely. AcePrep adjusts question difficulty based on your topic and experience level. Whether you're just starting out or have years of experience, you'll get relevant, tailored questions.",
  },
  {
    q: "How does the AI scoring work?",
    a: "After each interview, our AI analyzes your responses for clarity, depth, relevance, and communication. You receive a detailed score with specific feedback on what you did well and what to improve.",
  },
  {
    q: "Can I practice for specific job roles?",
    a: "Yes! You can either upload your resume for a personalized interview or manually choose a topic like Data Structures, System Design, Product Management, HR, and more.",
  },
  {
    q: "Are my interviews saved automatically?",
    a: "Yes, every interview session is saved to your history. You can revisit them anytime, review your answers, see model answers, and track your improvement over time.",
  },
  {
    q: "Which AI model powers AcePrep?",
    a: "AcePrep uses the Groq API for ultra fast, real time AI responses making your interviews feel natural and fluid, just like talking to a real interviewer.",
  },

  {
    q: "Is my resume and interview data secure?",
    a: "Yes. Your resume and interview responses are securely stored and never shared with third parties. We prioritize user privacy and data protection at every step.",
  },

  {
    q: "Does AcePrep simulate real company interviews?",
    a: "Yes. AcePrep is designed to mirror real world interview scenarios. Questions focus on reasoning, trade offs, problem solving, and communication similar to actual technical interviews at top companies.",
  },

  {
    q: "Can I track my improvement over time?",
    a: "Absolutely. Your past interviews are saved with detailed scores and feedback, allowing you to compare performance, identify patterns, and continuously improve your interview skills.",
  },

  {
    q: "What makes AcePrep different from other interview platforms?",
    a: "Unlike static question banks, AcePrep generates dynamic, personalized interviews powered by AI. Every session adapts to your profile, difficulty level, and responses making each interview unique.",
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " open" : ""}`}>
      <button className="faq-q" onClick={() => setOpen(!open)}>
        {q}
        <span className="faq-chevron material-symbols-outlined">expand_more</span>
      </button>
      <div className="faq-a">{a}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, clearUser } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem("token");
      sessionStorage.clear();
      clearUser();
      navigate("/", { replace: true });
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="db-root">
      <SEO
        title="Dashboard"
        description="Your AcePrep interview command center. Start new mock interviews, upload resumes, track performance history, and view instant feedback."
      />

      <header className="db-header">
        <div className="db-logo">AcePrep</div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      <div className="db-hero">
        <h1>Your Interview Command Center</h1>
        <p>Practice smarter, learn faster, and walk into every interview with confidence.</p>
      </div>

      <div className="db-section">
        <div className="db-section-title">Quick <span>Actions</span></div>
        <div className="db-grid-4">
          <div className="db-card">
            <span className="material-symbols-outlined db-card-icon">upload_file</span>
            <h2>Resume Upload Interview</h2>
            <p>Get a personalized interview tailored to your resume and experience.</p>
            <button className="db-btn-primary" onClick={() => navigate("/resume-upload")}>Upload Resume</button>
          </div>
          <div className="db-card">
            <span className="material-symbols-outlined db-card-icon">edit_note</span>
            <h2>Topic Interview</h2>
            <p>Pick any topic you want and answer the interview questions by typing your responses.</p>
            <button className="db-btn-primary" onClick={() => navigate("/start-interview")}>Start Topic Interview</button>
          </div>
          <div className="db-card ">
            <span className="material-symbols-outlined db-card-icon">videocam</span>
            <h2>AI Video Interview</h2>
            <p>Turn on your camera, choose several topics, and let the AI agent ask spoken questions in a live video-style session.</p>
            <button className="db-btn-primary" onClick={() => navigate("/start-video-interview")}>Launch Video Interview</button>
          </div>
          <div className="db-card">
            <span className="material-symbols-outlined db-card-icon">history</span>
            <h2>Past Interviews</h2>
            <p>Review your sessions, analyse your mistakes, and track your growth.</p>
            <button className="db-btn-primary" onClick={() => navigate("/history")}>View Interviews</button>
          </div>
        </div>
      </div>

      <div className="db-divider" />

      <div className="db-section">
        <div className="db-section-title">How It <span>Works</span></div>
        <div className="db-grid-3">
          <div className="hiw-card">
            <div className="hiw-step">01</div>
            <span className="hiw-icon material-symbols-outlined">description</span>
            <h3>Set Up Your Interview</h3>
            <p>Upload your resume or pick a topic. AcePrep instantly generates questions tailored to your profile, role, and skill level no generic templates.</p>
          </div>
          <div className="hiw-card">
            <div className="hiw-step">02</div>
            <span className="hiw-icon material-symbols-outlined">smart_toy</span>
            <h3>Interview with AI</h3>
            <p>Answer questions in real time. Our Groq-powered AI listens, follows up, and adapts just like a real interviewer would in a live session.</p>
          </div>
          <div className="hiw-card">
            <div className="hiw-step">03</div>
            <span className="hiw-icon material-symbols-outlined">analytics</span>
            <h3>Get Scored & Improve</h3>
            <p>Receive a detailed performance score, pinpoint your weak areas, and see exactly how you should have answered each question then come back and try again.</p>
          </div>
        </div>
      </div>

      <div className="db-divider" />

      <div className="db-section">
        <div className="db-section-title">Who We <span>Serve</span></div>
        <div className="wws-grid">
          <div className="wws-card">
            <span className="wws-icon material-symbols-outlined">school</span>
            <h3>Fresh Graduates</h3>
            <p>Land your first job by practicing common entry level technical and HR questions with instant feedback.</p>
          </div>
          <div className="wws-card">
            <span className="wws-icon material-symbols-outlined">work</span>
            <h3>Experienced Pros</h3>
            <p>Sharpen your skills for senior roles with deep dive system design and behavioral interview rounds.</p>
          </div>
          <div className="wws-card">
            <span className="wws-icon material-symbols-outlined">sync_alt</span>
            <h3>Career Switchers</h3>
            <p>Transitioning to a new domain? Practice domain specific questions to build confidence in your new field.</p>
          </div>
          <div className="wws-card">
            <span className="wws-icon material-symbols-outlined">public</span>
            <h3>Remote Job Seekers</h3>
            <p>Get ready for video and async interviews. AcePrep mirrors real online interview environments.</p>
          </div>
          <div className="wws-card">
            <span className="wws-icon material-symbols-outlined">rocket_launch</span>
            <h3>Startup Founders</h3>
            <p>Prepare for investor pitches and product interviews by sharpening your storytelling and clarity.</p>
          </div>
        </div>
      </div>

      <div className="db-divider" />

      <div className="db-section">
        <div className="db-section-title center">Contact <span>Us</span></div>
        <div className="contact-section">
          <div className="contact-box">
            <div>
              <h3>Have questions or feedback?</h3>
              <p>I'd love to hear from you. Reach out anytime, We usually reply within a day.</p>
            </div>
            <a className="contact-mail" href="mailto:aceprepx@gmail.com">
              <span className="material-symbols-outlined">mail</span>
              aceprepx@gmail.com
            </a>
          </div>
        </div>
      </div>

      <footer>
        <div className="f-logo">AcePrep</div>
        <p>© {new Date().getFullYear()} AcePrep. All rights reserved. • <span onClick={() => window.open("/privacy", "_blank")} style={{ cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span></p>
      </footer>

      <ScrollToTopButton />
    </div>
  );
}
