import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ScrollToTopButton from "./ScrollToTopButton";
import SEO from "../components/SEO";
import { HistorySkeleton } from "../components/Skeletons";

const typeIcons = {
  video_topic: "videocam",
  topic: "edit_note",
  role: "description",
  resume: "description"
};

const typeLabels = {
  video_topic: "Video Interview",
  topic: "Topic Interview",
  role: "Role Interview",
  resume: "Resume Interview"
};

const statusConfig = {
  completed: { label: "Completed", icon: "check_circle", className: "status-completed" },
  abandoned: { label: "Abandoned", icon: "cancel", className: "status-abandoned" },
  generated: { label: "Not Started", icon: "pending", className: "status-pending" },
  in_progress: { label: "In Progress", icon: "autorenew", className: "status-progress" }
};

export default function History() {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await api.get("/interviews");
      setInterviews(res.data);
    } catch (err) {
      console.error("HISTORY LOAD ERROR:", err.response?.data || err.message);
      setError("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  const deleteInterview = async (id) => {
    try {
      await api.delete(`/interviews/${id}`);

      setInterviews(prev => prev.filter(i => i._id !== id));
      setMessage("Interview deleted successfully.");
      setError("");
      setConfirmDeleteId(null);

      setTimeout(() => setMessage(""), 3000);

    } catch (err) {
      console.error("DELETE ERROR:", err.response?.data || err.message);
      setError(err?.response?.data?.message || "Delete failed");
      setMessage("");
    }
  };

  const openReport = (id) => {
    navigate(`/result/${id}`);
  };

  if (loading) return <HistorySkeleton />;

  return (
    <div className="history-container" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SEO
        title="Past Interviews"
        description="Review your past AI mock interviews, scores, performance reports, and progress history on AcePrep."
      />

      <div style={{ flex: 1 }}>
        <div className="history-header-row">
          <h1>Past Interviews</h1>
          <button className="history-back-btn" onClick={() => navigate("/dashboard")}>
            <span className="material-symbols-outlined">arrow_back</span>
            Dashboard
          </button>
        </div>

        {message && (
          <div className="page-message success">{message}</div>
        )}

        {error && (
          <div className="page-message error">{error}</div>
        )}

        {interviews.length === 0 && (
          <div className="history-empty">
            <span className="material-symbols-outlined history-empty-icon">quiz</span>
            <h3>No interviews yet</h3>
            <p>Start your first interview and it will appear here.</p>
            <button className="db-btn-primary" onClick={() => navigate("/start-video-interview")} style={{ maxWidth: 280, margin: "1rem auto 0" }}>
              Start Your First Interview
            </button>
          </div>
        )}

        {interviews.map((i) => {
          const status = statusConfig[i.status] || statusConfig.generated;
          const typeIcon = typeIcons[i.type] || "quiz";
          const typeLabel = typeLabels[i.type] || i.type;

          return (
            <div key={i._id} className="history-card">
              <div className="history-card-top">
                <div className="history-card-type">
                  <span className="material-symbols-outlined history-type-icon">{typeIcon}</span>
                  <span className="history-type-label">{typeLabel}</span>
                </div>
                {i.status && i.status !== "generated" && (
                  <div className={`history-status-badge ${status.className}`}>
                    <span className="material-symbols-outlined">{status.icon}</span>
                    {status.label}
                  </div>
                )}
              </div>

              <h3>{i.role || i.topic || "General Interview"}</h3>

              <div className="history-card-meta">
                <span>
                  <span className="material-symbols-outlined">signal_cellular_alt</span>
                  {i.difficulty}
                </span>
                <span>
                  <span className="material-symbols-outlined">calendar_today</span>
                  {new Date(i.createdAt).toLocaleDateString()}
                </span>
                {i.totalScore !== undefined && i.totalScore !== null && (
                  <span className="history-score-badge">
                    <span className="material-symbols-outlined">star</span>
                    Score: {i.totalScore}
                  </span>
                )}
                {i.integrityScore !== undefined && i.integrityScore !== null && (
                  <span className={`history-integrity-badge ${i.integrityScore < 80 ? "low" : i.integrityScore < 90 ? "med" : "high"}`}>
                    <span className="material-symbols-outlined">shield</span>
                    {i.integrityScore}
                  </span>
                )}
              </div>

              <div className="history-btns">
                <button
                  className="view-btn"
                  onClick={() => openReport(i._id)}
                >
                  <span className="material-symbols-outlined">assessment</span>
                  View Report
                </button>

                {confirmDeleteId === i._id ? (
                  <div className="delete-confirm-pill">
                    <span className="confirm-label">Delete?</span>
                    <button className="confirm-yes-btn" onClick={() => deleteInterview(i._id)}>
                      Yes
                    </button>
                    <button className="confirm-no-btn" onClick={() => setConfirmDeleteId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="delete-btn"
                    onClick={() => setConfirmDeleteId(i._id)}
                  >
                    <span className="material-symbols-outlined">delete</span>
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div className="bottom-dashboard">
          <button
            className="dashboard-btn"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
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
