import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "../App.css";

const UploadResume = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setError("");
    setSuccess("");

    if (!selected) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!allowedTypes.includes(selected.type)) {
      setError("Only PDF or DOC/DOCX resumes are allowed");
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      setError("File too large. Max size is 2MB");
      return;
    }

    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      setProgress(5);
      setStatusMessage("Uploading resume...");
      setError("");
      setSuccess("");

      const res = await API.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        validateStatus: () => true,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const rawPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const scaledPercent = Math.min(70, Math.max(5, Math.round(rawPercent * 0.7)));
            setProgress(scaledPercent);
            if (scaledPercent >= 65) {
              setStatusMessage("Analyzing document with AI...");
            }
          }
        },
      });

      setProgress(85);
      setStatusMessage("Finalizing resume processing...");
      await new Promise((r) => setTimeout(r, 300));

      setProgress(100);

      if (res.status === 201 || res.status === 200) {
        setSuccess("Resume uploaded successfully!");
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        setError(res.data?.message || "Resume upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Server unreachable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard upload-page">
      <h2>Upload Resume</h2>

      <div className="upload-box">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          disabled={loading}
          onChange={handleFileChange}
        />

        {loading && (
          <div className="resume-progress-container">
            <div className="resume-progress-header">
              <span className="resume-progress-status">
                <span className="material-symbols-outlined spinning">sync</span>
                {statusMessage}
              </span>
              <span className="resume-progress-percent">{progress}%</span>
            </div>
            <div className="resume-progress-bar-bg">
              <div
                className="resume-progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}

        {!loading && (
          <button onClick={handleUpload} disabled={!file}>
            Upload Resume
          </button>
        )}

        <p className="hint">
          Upload a resume exported from Word/Google Docs.<br />
          Scanned or photo resumes will not work.
        </p>
      </div>
    </div>
  );
};

export default UploadResume;
