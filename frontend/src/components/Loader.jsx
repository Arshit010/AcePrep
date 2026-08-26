import { useEffect, useState } from "react";

const defaultMessages = [
  "Setting things up...",
  "Almost ready...",
  "Preparing your session..."
];

const videoMessages = [
  "Warming up the AI interviewer...",
  "Configuring voice engine...",
  "Setting up integrity monitoring...",
  "Preparing question flow...",
  "Almost ready to begin..."
];

export default function Loader({
  title = "Loading...",
  subtitle = "Please wait while we prepare everything.",
  variant = "default",
  badge = ""
}) {
  const messages = variant === "video" ? videoMessages : defaultMessages;
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={`app-loader ${variant === "pro" || variant === "video" ? "app-loader-pro" : ""}`}>
      <div className="app-loader-orb" />
      <div className="app-loader-ring" />
      <div className="app-loader-content">
        {badge && (
          <div className="app-loader-badge">{badge}</div>
        )}
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <p className="loader-rotating-msg">{messages[msgIndex]}</p>
      </div>
    </div>
  );
}
