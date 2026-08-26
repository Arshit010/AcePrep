import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function StartInterview() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startTopicInterview = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic for the topic interview.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/interviews/topic", {
        topic: topic.trim(),
        difficulty
      });

      navigate(`/interview/${data.interviewId}`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to start topic interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="topic-page-wrapper">
      <div className="topic-container">
        <h1>Topic Interview</h1>
        <p className="topic-subtitle">
          Enter any topic you want and answer each interview question by typing your response.
        </p>

        <div className="topic-field">
          <label>Topic Interview</label>
          <input
            type="text"
            placeholder="e.g. Cloud Computing, Marketing, React, History, Physics"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setError("");
            }}
            className="topic-input"
          />
          <p className="topic-hint">
            The AI will generate a typed interview based on whatever topic you enter.
          </p>
        </div>

        <div className="topic-field">
          <label>Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="topic-input"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="topic-plan-banner">
          <div>
            <span className="material-symbols-outlined">keyboard</span>
            <div>
              <h3>How it works</h3>
              <p>
                You will see generated questions one by one and type your answer after each prompt.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="page-message error" style={{ marginBottom: "1.25rem" }}>
            {error}
          </div>
        )}

        <button className="topic-btn" onClick={startTopicInterview} disabled={loading}>
          {loading ? "Starting..." : "Start Topic Interview"}
        </button>
      </div>
    </div>
  );
}
