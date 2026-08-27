import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { InterviewSessionSkeleton } from "../components/Skeletons";

export default function LiveInterview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const allowPageExitRef = useRef(false);
  const quittingRef = useRef(false);

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQuitPrompt, setShowQuitPrompt] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInterview = async () => {
      try {
        const { data } = await api.get(`/interviews/result/${id}`);

        if (data.type === "video_topic") {
          allowPageExitRef.current = true;
          navigate(`/video-interview/${id}`, { replace: true });
          return;
        }

        if (data.status !== "in_progress" && data.status !== "generated") {
          allowPageExitRef.current = true;
          if (data.status === "completed") {
            navigate(`/result/${id}`, { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
          return;
        }

        setQuestions(data.questions);
        const answeredCount = Array.isArray(data.answers) ? data.answers.length : 0;
        const totalQuestions = Array.isArray(data.questions) ? data.questions.length : 0;
        setCurrent(Math.min(answeredCount, Math.max(0, totalQuestions - 1)));
      } catch (err) {
        console.error(err);
        navigate("/dashboard", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadInterview();
  }, [id, navigate]);

  useEffect(() => {
    const enterFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    enterFullscreen();

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    window.history.pushState({ interviewGuard: id }, "", window.location.href);

    const handlePopState = () => {
      if (allowPageExitRef.current) return;
      window.history.pushState({ interviewGuard: id }, "", window.location.href);
      setShowQuitPrompt(true);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [id]);

  const leaveInterviewScreen = (nextPath = "/dashboard") => {
    allowPageExitRef.current = true;
    setShowQuitPrompt(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    navigate(nextPath, { replace: true });
  };

  const confirmQuitInterview = async () => {
    if (quittingRef.current) return;

    quittingRef.current = true;
    setQuitting(true);

    try {
      try {
        await api.post("/interviews/abandon", {
          interviewId: id
        });
      } catch (error) {
        if (error?.response?.status !== 404) {
          throw error;
        }

        await api.delete(`/interviews/${id}`);
      }

      leaveInterviewScreen("/dashboard");
    } catch (error) {
      console.error(error);
      setError(error?.response?.data?.message || "Failed to quit interview");
      setShowQuitPrompt(false);
    } finally {
      quittingRef.current = false;
      setQuitting(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || submitting) return;

    setSubmitting(true);

    try {
      const { data } = await api.post("/interviews/answer", {
        interviewId: id,
        questionIndex: current,
        answer
      });

      if (data.completed) {
        leaveInterviewScreen(`/result/${id}`);
        return;
      }

      setCurrent(prev => prev + 1);
      setAnswer("");

    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <InterviewSessionSkeleton />;

  if (!questions.length)
    return <h2 className="live-loading">Interview unavailable</h2>;

  return (
    <div className="live-container">
      {showQuitPrompt && (
        <div className="live-overlay">
          <div className="quit-interview-modal">
            <h3>Quit Interview?</h3>
            <p>If you leave now, you cannot enter this same interview again.</p>
            <div className="quit-interview-actions">
              <button type="button" className="quit-interview-yes" onClick={confirmQuitInterview} disabled={quitting}>
                {quitting ? "Quitting..." : "YES"}
              </button>
              <button type="button" className="quit-interview-no" onClick={() => setShowQuitPrompt(false)} disabled={quitting}>
                NO
              </button>
            </div>
          </div>
        </div>
      )}

      {submitting && (
        <div className="live-overlay">
          <div className="live-spinner"></div>
          <p>AI is evaluating your answer...</p>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>
          Question {current + 1} / {questions.length}
        </h2>
        <button
          type="button"
          onClick={() => setShowQuitPrompt(true)}
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            padding: "0.4rem 0.85rem",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          Quit Interview
        </button>
      </div>

      <div className="live-question">
        {questions[current]}
      </div>

      <textarea
        rows="10"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer..."
        className="live-textarea"
        disabled={submitting}
      />

      {error && (
        <div className="page-message error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div className="live-actions">
        <button
          onClick={submitAnswer}
          className="live-btn"
          disabled={submitting}
        >
          {submitting ? "Evaluating..." : "Next"}
        </button>
      </div>
    </div>
  );
}
