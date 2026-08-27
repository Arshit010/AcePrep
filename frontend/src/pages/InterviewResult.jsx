import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import "../App.css";
import ScrollToTopButton from "./ScrollToTopButton";
import NotFound from "./NotFound";
import SEO from "../components/SEO";
import { InterviewResultSkeleton } from "../components/Skeletons";

function ScoreRing({ value, max = 100, label, size = 96 }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 70 ? "#7D4047" : pct >= 40 ? "#ffb347" : "#ff6b6b";

  return (
    <div className="score-ring-card">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="score-ring-svg">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring-fill"
          style={{ "--ring-offset": `${circumference}px`, "--ring-target": `${offset}px` }}
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
          fill={color} fontSize="1.35rem" fontWeight="800" fontFamily="Syne, sans-serif"
        >
          {value}
        </text>
      </svg>
      <span className="score-ring-label">{label}</span>
    </div>
  );
}

function CollapsibleQA({ index, answer }) {
  const [open, setOpen] = useState(false);
  const scoreColor = answer.score >= 7 ? "good" : answer.score >= 4 ? "avg" : "poor";

  return (
    <div className={`report-qa-card ${open ? "open" : ""}`}>
      <button className="report-qa-header" onClick={() => setOpen(!open)}>
        <div className="report-qa-left">
          <span className={`report-qa-score ${scoreColor}`}>{answer.score}/10</span>
          <span className="report-qa-q">Q{index + 1}. {answer.question}</span>
        </div>
        <span className="material-symbols-outlined report-qa-chevron">expand_more</span>
      </button>
      <div className="report-qa-body">
        <p><b>Your Answer:</b> {answer.userAnswer}</p>
        {answer.answerSummary && <p><b>Summary:</b> {answer.answerSummary}</p>}
        <div className="report-qa-scores">
          <span><b>Communication:</b> {answer.communicationScore}/10</span>
          <span><b>Technical:</b> {answer.technicalAccuracyScore}/10</span>
        </div>
        <p><b>Feedback:</b> {answer.aiFeedback}</p>
        {answer.idealAnswer && <p><b>Missing Concepts:</b> {answer.idealAnswer}</p>}
      </div>
    </div>
  );
}

export default function InterviewResult() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const videoElements = document.querySelectorAll("video");
      videoElements.forEach((video) => {
        if (video.srcObject) {
          video.srcObject.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        }
      });
    } catch (_) {

    }
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/interviews/result/${id}`);
        setData(res.data);
      } catch (err) {
        console.error("REPORT LOAD ERROR:", err.response?.data || err.message);
        if (err.response?.status === 404) {
          setIsNotFound(true);
        } else {
          setError(err?.response?.data?.message || "Failed to load report");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const interviewScore = useMemo(() => {
    if (!data?.answers?.length) return 0;
    return Math.round((data.totalScore / (data.answers.length * 10)) * 100);
  }, [data]);

  const integrityStatus = useMemo(() => {
    const score = Number(data?.integrityScore) || 0;
    if (score < 70) return "Cheating detected";
    if ((data?.suspiciousEvents || []).length > 0) return "Integrity violations recorded";
    return "Clean interview";
  }, [data]);

  if (loading) return <InterviewResultSkeleton />;
  if (isNotFound) return <NotFound />;
  if (error) return <h2 className="report-loading" style={{ color: "var(--error-text)" }}>{error}</h2>;
  if (!data) return <NotFound />;

  return (
    <div className="report-container">
      <SEO
        title={`Report - ${data.topic || data.role || "Interview"}`}
        description="View your detailed AI interview report, score breakdown, technical evaluation, and personalized improvement suggestions."
      />
      <div className="report-hero">
        <span className="material-symbols-outlined report-hero-icon">analytics</span>
        <h1>Interview Report</h1>
        <p className="report-hero-sub">
          {data.topic || data.role || "General"} · {data.difficulty} · {data.sessionFormat === "video" ? "Video" : "Text"}
        </p>
      </div>

      <div className="score-ring-grid">
        <ScoreRing value={interviewScore} label="Overall" />
        <ScoreRing value={data.confidenceScore || 0} label="Confidence" />
        <ScoreRing value={data.communicationScore || 0} label="Communication" />
        <ScoreRing value={data.technicalAccuracyScore || 0} label="Technical" />
        <ScoreRing value={data.integrityScore || 0} label="Integrity" />
      </div>

      <div className="report-summary-card">
        <div className="report-section-header">
          <span className="material-symbols-outlined">info</span>
          <h3>Session Details</h3>
        </div>

        <div className="report-detail-tiles">
          <div className="detail-tile">
            <span className="material-symbols-outlined detail-tile-icon">videocam</span>
            <div className="detail-tile-text">
              <span className="detail-tile-label">Format</span>
              <strong>{data.sessionFormat === "video" ? "Video Interview" : "Standard Interview"}</strong>
            </div>
          </div>

          {(data.topic || data.role) && (
            <div className="detail-tile">
              <span className="material-symbols-outlined detail-tile-icon">topic</span>
              <div className="detail-tile-text">
                <span className="detail-tile-label">Primary Topic</span>
                <strong>{data.topic || data.role}</strong>
              </div>
            </div>
          )}

          {data.topics?.length > 0 && (
            <div className="detail-tile">
              <span className="material-symbols-outlined detail-tile-icon">label</span>
              <div className="detail-tile-text">
                <span className="detail-tile-label">Focus Topics</span>
                <strong>{data.topics.join(", ")}</strong>
              </div>
            </div>
          )}

          <div className="detail-tile">
            <span className="material-symbols-outlined detail-tile-icon">signal_cellular_alt</span>
            <div className="detail-tile-text">
              <span className="detail-tile-label">Difficulty</span>
              <strong style={{ textTransform: "capitalize" }}>{data.difficulty}</strong>
            </div>
          </div>

          <div className="detail-tile">
            <span className="material-symbols-outlined detail-tile-icon">help_outline</span>
            <div className="detail-tile-text">
              <span className="detail-tile-label">Questions</span>
              <strong>{data.questionCount} Questions</strong>
            </div>
          </div>

          <div className="detail-tile">
            <span className="material-symbols-outlined detail-tile-icon">schedule</span>
            <div className="detail-tile-text">
              <span className="detail-tile-label">Duration</span>
              <strong>{data.durationMinutes} min</strong>
            </div>
          </div>

          {data.voiceStyle && (
            <div className="detail-tile">
              <span className="material-symbols-outlined detail-tile-icon">record_voice_over</span>
              <div className="detail-tile-text">
                <span className="detail-tile-label">Voice Style</span>
                <strong>{data.voiceStyle}</strong>
              </div>
            </div>
          )}

          <div className="detail-tile">
            <span className="material-symbols-outlined detail-tile-icon">shield</span>
            <div className="detail-tile-text">
              <span className="detail-tile-label">Integrity Status</span>
              <strong className={Number(data.integrityScore) < 80 ? "bad-text" : Number(data.integrityScore) < 90 ? "warn-text" : "good-text"}>
                {integrityStatus} ({data.integrityScore || 0}/100)
              </strong>
            </div>
          </div>

          <div className="detail-tile">
            <span className="material-symbols-outlined detail-tile-icon">warning</span>
            <div className="detail-tile-text">
              <span className="detail-tile-label">Violations</span>
              <strong className={(data.suspiciousEvents || []).length > 0 ? "warn-text" : "good-text"}>
                {(data.suspiciousEvents || []).length} Recorded
              </strong>
            </div>
          </div>
        </div>

        {data.overallFeedback && (
          <div className="report-overall-feedback">
            <strong>Overall AI Feedback</strong>
            <p>{data.overallFeedback}</p>
          </div>
        )}
      </div>

      <div className="report-insights-container">
        <div className="insight-column">
          <div className="insight-column-header">
            <span className="material-symbols-outlined insight-icon icon-strength">thumb_up</span>
            <h3>Key Strengths</h3>
          </div>
          {(data.strengths || []).length ? (
            <ul className="insight-list">
              {data.strengths.map((item, index) => (
                <li key={index}>
                  <span className="bullet-dot strength">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="insight-empty">No specific strengths captured.</div>
          )}
        </div>

        <div className="insight-column">
          <div className="insight-column-header">
            <span className="material-symbols-outlined insight-icon icon-weakness">construction</span>
            <h3>Weak Areas</h3>
          </div>
          {(data.weaknesses || []).length ? (
            <ul className="insight-list">
              {data.weaknesses.map((item, index) => (
                <li key={index}>
                  <span className="bullet-dot weakness">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="insight-empty">No specific weak areas captured.</div>
          )}
        </div>

        <div className="insight-column">
          <div className="insight-column-header">
            <span className="material-symbols-outlined insight-icon icon-recommend">school</span>
            <h3>Recommended Topics</h3>
          </div>
          {(data.recommendedTopics || []).length ? (
            <ul className="insight-list">
              {data.recommendedTopics.map((item, index) => (
                <li key={index}>
                  <span className="bullet-dot recommend">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="insight-empty">No recommendations captured.</div>
          )}
        </div>
      </div>

      <div className="report-qa-section">
        <h2 className="report-qa-title">Question-by-Question Breakdown</h2>
        {(data.answers || []).map((answer, index) => (
          <CollapsibleQA key={index} index={index} answer={answer} />
        ))}
      </div>

      {(data.suspiciousEvents || []).length > 0 && (
        <div className="report-integrity-card">
          <div className="report-section-header danger">
            <span className="material-symbols-outlined">warning</span>
            <h3>Integrity Events & Monitoring Logs ({data.suspiciousEvents.length})</h3>
          </div>
          <div className="integrity-events-list">
            {data.suspiciousEvents.map((event, index) => {
              const isoMatch = typeof event === "string" ? event.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z):\s*(.*)$/) : null;
              let timeStr = "";
              let messageText = event;
              if (isoMatch) {
                try {
                  timeStr = new Date(isoMatch[1]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  messageText = isoMatch[2];
                } catch (_) {

                }
              }
              return (
                <div key={index} className="integrity-event-item">
                  <span className="material-symbols-outlined event-icon">error_outline</span>
                  {timeStr && <span className="event-time">{timeStr}</span>}
                  <span className="event-msg">{messageText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="report-buttons">
        <button className="report-btn" onClick={() => window.location.replace("/dashboard")}>
          <span className="material-symbols-outlined">dashboard</span>
          Dashboard
        </button>
        <button className="report-btn" onClick={() => window.location.replace("/start-interview")}>
          <span className="material-symbols-outlined">play_arrow</span>
          New Interview
        </button>
        <button className="report-btn" onClick={() => window.location.replace("/history")}>
          <span className="material-symbols-outlined">history</span>
          Past Interviews
        </button>
      </div>

      <footer>
        <div className="f-logo">AcePrep</div>
        <p>© {new Date().getFullYear()} AcePrep. All rights reserved. • <span onClick={() => window.open("/privacy", "_blank")} style={{ cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span></p>
      </footer>

      <ScrollToTopButton />
    </div>
  );
}
