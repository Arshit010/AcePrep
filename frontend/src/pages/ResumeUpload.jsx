import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import SEO from "../components/SEO";

export default function ResumeUpload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStatusMessage, setGenStatusMessage] = useState("");
  const [profile, setProfile] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a resume first");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    setUploading(true);
    setUploadProgress(5);
    setStatusMessage("Uploading resume file...");
    setError("");

    try {
      const { data } = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const rawPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const scaledPercent = Math.min(65, Math.max(5, Math.round(rawPercent * 0.65)));
            setUploadProgress(scaledPercent);
            if (scaledPercent >= 60) {
              setStatusMessage("File received. AI analyzing content...");
            }
          }
        },
      });

      // Smooth step simulation for AI profile extraction
      setUploadProgress(75);
      setStatusMessage("Extracting skills, experience & technologies...");
      await new Promise((r) => setTimeout(r, 400));

      setUploadProgress(90);
      setStatusMessage("Building personalized profile summary...");
      await new Promise((r) => setTimeout(r, 300));

      setUploadProgress(100);
      setStatusMessage("Profile ready!");
      await new Promise((r) => setTimeout(r, 200));

      if (!data?.profile || !data?.resumeId) {
        throw new Error("Invalid response from server");
      }

      setProfile(data.profile);
      setResumeId(data.resumeId);
    } catch (err) {
      console.error("UPLOAD ERROR:", err.response?.data || err.message);
      setError(err?.response?.data?.message || "Resume upload failed");
    } finally {
      setUploading(false);
    }
  };

  const startInterview = async () => {
    if (!resumeId || generating) return;

    setGenerating(true);
    setGenProgress(10);
    setGenStatusMessage("Initializing AI interview engine...");
    setError("");

    try {
      const t1 = setTimeout(() => {
        setGenProgress(45);
        setGenStatusMessage("Analyzing skills and matching role criteria...");
      }, 400);

      const t2 = setTimeout(() => {
        setGenProgress(80);
        setGenStatusMessage("Generating tailored technical & behavioral questions...");
      }, 1000);

      const { data } = await api.post(`/resumes/start-interview/${resumeId}`);

      clearTimeout(t1);
      clearTimeout(t2);

      setGenProgress(100);
      setGenStatusMessage("Interview ready! Redirecting...");

      if (!data?.interviewId) {
        throw new Error("Interview generation failed");
      }

      setTimeout(() => {
        navigate(`/interview/${data.interviewId}`);
      }, 400);
    } catch (err) {
      console.error("INTERVIEW START ERROR:", err.response?.data || err.message);
      setError(err?.response?.data?.message || "Failed to start interview");
      setGenerating(false);
    }
  };

  return (
    <div className="resume-container">
      <SEO
        title="Resume Upload Interview"
        description="Upload your resume to generate a personalized AI technical interview tailored to your skills, experience, and projects."
      />

      <h1 className="resume-title">
        Resume Based Interview
      </h1>

      {!profile && (
        <div className="resume-upload-box">
          <span className="material-symbols-outlined upload-icon">upload_file</span>

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            disabled={uploading}
            onChange={(e) => setFile(e.target.files[0])}
          />

          {!uploading && (
            <button
              onClick={handleUpload}
              disabled={!file}
              className="resume-btn"
            >
              Upload Resume
            </button>
          )}

          {uploading && (
            <div className="resume-progress-container">
              <div className="resume-progress-header">
                <span className="resume-progress-status">
                  <span className="material-symbols-outlined spinning">sync</span>
                  {statusMessage}
                </span>
                <span className="resume-progress-percent">{uploadProgress}%</span>
              </div>
              <div className="resume-progress-bar-bg">
                <div
                  className="resume-progress-bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="resume-error">{error}</p>}
        </div>
      )}

      {profile && !generating && (
        <div className="resume-summary">
          <h2>
            <span className="material-symbols-outlined">summarize</span>
            Resume Summary
          </h2>

          <p>
            <span className="material-symbols-outlined">badge</span>
            <b>Role:</b> {profile.role || "Not detected"}
          </p>

          <p>
            <span className="material-symbols-outlined">work_history</span>
            <b>Experience:</b> {profile.experience_level || "Unknown"}
          </p>

          <p>
            <span className="material-symbols-outlined">psychology</span>
            <b>Skills:</b>{" "}
            {profile.skills?.length
              ? profile.skills.join(", ")
              : "No skills detected"}
          </p>

          <p>
            <span className="material-symbols-outlined">developer_mode</span>
            <b>Technologies:</b>{" "}
            {profile.technologies?.length
              ? profile.technologies.join(", ")
              : "No technologies detected"}
          </p>

          <p>
            <span className="material-symbols-outlined">assignment</span>
            <b>Projects:</b>{" "}
            {profile.projects?.length
              ? profile.projects
                  .map((p) => (typeof p === "string" ? p : p?.name || "Unnamed Project"))
                  .join(", ")
              : "No projects detected"}
          </p>

          <button onClick={startInterview} className="resume-btn start">
            <span className="material-symbols-outlined">play_circle</span>
            Start AI Interview
          </button>

          {error && <p className="resume-error">{error}</p>}
        </div>
      )}

      {generating && (
        <div className="resume-upload-box">
          <div className="resume-progress-container">
            <div className="resume-progress-header">
              <span className="resume-progress-status">
                <span className="material-symbols-outlined spinning">psychology</span>
                {genStatusMessage}
              </span>
              <span className="resume-progress-percent">{genProgress}%</span>
            </div>
            <div className="resume-progress-bar-bg">
              <div
                className="resume-progress-bar-fill"
                style={{ width: `${genProgress}%` }}
              />
            </div>
          </div>
          <h2 style={{ marginTop: "1.25rem", color: "var(--accent, #a85560)", fontSize: "1.25rem" }}>
            Preparing your interview...
          </h2>
          <p style={{ color: "var(--lp-text-sub, #cbd5e1)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Generating resume-based questions.
          </p>
        </div>
      )}
    </div>
  );
}
