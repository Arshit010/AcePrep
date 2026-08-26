import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const suggestedTopics = [
  "DSA",
  "Operating Systems",
  "Computer Networks",
  "DBMS",
  "JavaScript",
  "React",
  "Cybersecurity",
  "HR Questions"
];

export default function StartVideoInterview() {
  const navigate = useNavigate();
  const [topicInput, setTopicInput] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topics = useMemo(() => {
    return topicInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }, [topicInput]);

  const addTopic = (value) => {
    setError("");
    const next = [...topics, value]
      .filter((item, index, list) => list.indexOf(item) === index)
      .slice(0, 8);

    setTopicInput(next.join(", "));
  };

  const startVideoInterview = async () => {
    if (!topics.length) {
      setError("Please enter at least one topic.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/interviews/video-topic", {
        topic: topics[0],
        topics,
        difficulty,
        questionCount,
        durationMinutes,
        language
      });

      navigate(`/video-interview/${data.interviewId}`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to start video interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="topic-page-wrapper">
      <div className="topic-container topic-container-video">
        <h1>AI Video Interview</h1>
        <p className="topic-subtitle">
          Configure a realistic spoken mock interview, then start with camera and microphone enabled.
        </p>

        <div className="topic-field">
          <label>Interview Topics</label>
          <input
            type="text"
            placeholder="e.g. DSA, Operating Systems, DBMS"
            value={topicInput}
            onChange={(e) => {
              setTopicInput(e.target.value);
              setError("");
            }}
            className="topic-input"
          />
          <p className="topic-hint">
            Add up to 8 comma-separated topics. Questions will be generated from the selected areas.
          </p>
        </div>

        <div className="topic-chip-row">
          {suggestedTopics.map((item) => (
            <button
              key={item}
              type="button"
              className={`topic-chip ${topics.includes(item) ? "selected" : ""}`}
              onClick={() => addTopic(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="topic-selection-preview">
          {topics.length ? (
            topics.map((item) => (
              <span key={item} className="topic-selection-pill">
                {item}
              </span>
            ))
          ) : (
            <span className="topic-selection-empty">No topics selected yet</span>
          )}
        </div>

        <div className="setup-grid">
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

          <div className="topic-field">
            <label>Number of Questions</label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="topic-input"
            >
              {[3, 4, 5, 6, 8, 10].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          <div className="topic-field">
            <label>Interview Duration</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="topic-input"
            >
              {[5, 10, 15, 20, 30, 45].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </div>

          <div className="topic-field">
            <label>Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="topic-input"
            >
              <option value="English">English</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="page-message error" style={{ marginBottom: "1.25rem" }}>
            {error}
          </div>
        )}

        <button className="topic-btn" onClick={startVideoInterview} disabled={loading}>
          {loading ? "Starting..." : "Confirm Setup and Start Video Interview"}
        </button>
      </div>
    </div>
  );
}
