import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ showAuthButtons = true, showNavLinks = true }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, refreshUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogoClick = async () => {
    let currentUser = user;
    if (!currentUser) {
      try {
        currentUser = await refreshUser();
      } catch (err) {
        currentUser = null;
      }
    }

    if (currentUser) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <nav className={`lp-nav lp-nav-floating ${scrolled ? "lp-nav-scrolled" : ""}`}>
      <div className="lp-logo" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
        AcePrep
      </div>
      {showNavLinks && (
        <div className="nav-links">
          <button className={`nav-link ${pathname === "/features" ? "nav-link-active" : ""}`} onClick={() => navigate("/features")}>Features</button>
          <button className={`nav-link ${pathname === "/about" ? "nav-link-active" : ""}`} onClick={() => navigate("/about")}>About Us</button>
          <button className={`nav-link ${pathname === "/contact" ? "nav-link-active" : ""}`} onClick={() => navigate("/contact")}>Contact Us</button>
        </div>
      )}
      {showAuthButtons && (
        <div className="nav-actions">
          {user ? (
            <button className="nav-cta" onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
          ) : (
            <>
              <button className="nav-signin" onClick={() => navigate("/login")}>Sign In</button>
              <button className="nav-cta" onClick={() => navigate("/register")}>Get Started</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
