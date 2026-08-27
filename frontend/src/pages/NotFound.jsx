import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import robotImg from "../assets/404 image.png";

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleHomeClick = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="lp-root not-found-page">
      <Navbar showAuthButtons={false} showNavLinks={false} />

      <div className="not-found-container">
        <div className="not-found-glow" /><div className="not-found-image-wrap">
          <div className="robot-aura" />
          <img
            src={robotImg}
            alt="404 Lost Robot"
            className="not-found-robot-img"
          />
        </div><div className="not-found-content">
          <h1 className="not-found-title">
            PAGE NOT <span className="not-found-red">FOUND</span>
          </h1>

          <p className="not-found-sub">
            The page you are looking for doesn't exist, has been moved, or our interviewer robot is currently reading its map trying to find it.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="footer-top-row">
          <div className="footer-brand">© {new Date().getFullYear()} AcePrep. All rights reserved.</div>
          <div className="footer-links">
            <span onClick={handleHomeClick}>Home</span>
            <span onClick={() => window.open("/privacy", "_blank")}>Privacy Policy</span>
          </div>
        </div>
        <div className="footer-subtext">Built with Love for ambitious developers</div>
      </footer>
    </div>
  );
}
