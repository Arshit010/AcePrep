import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import StartInterview from "./pages/StartInterview";
import StartVideoInterview from "./pages/StartVideoInterview";
import LiveInterview from "./pages/LiveInterview";
import InterviewResult from "./pages/InterviewResult";
import History from "./pages/History";
import ResumeUpload from "./pages/ResumeUpload";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VideoInterview from "./pages/VideoInterview";
import Features from "./pages/Features";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./context/AuthContext";

/*
   AUTH LISTENER
*/
function AuthListener() {
  const navigate = useNavigate();
  const { clearUser } = useAuth();

  useEffect(() => {
    const logout = () => {
      clearUser();
      navigate("/", { replace: true });
    };

    window.addEventListener("auth-logout", logout);
    return () => window.removeEventListener("auth-logout", logout);
  }, [clearUser, navigate]);

  return null;
}

/*
   PRIVATE ROUTE (Cookie Based)
*/
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // Allow children to render their immediate UI/Skeleton during initial cookie rehydration
  if (loading) return children;

  return user ? children : <Navigate to="/login" replace />;
}

/*
   PUBLIC ROUTE (Cookie Based)
*/
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return children;

  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthListener />

        <Routes>

          {/* Public Landing */}
          <Route path="/" element={<Landing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Auth Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/start-interview" element={<PrivateRoute><StartInterview /></PrivateRoute>} />
          <Route path="/start-video-interview" element={<PrivateRoute><StartVideoInterview /></PrivateRoute>} />
          <Route path="/resume-upload" element={<PrivateRoute><ResumeUpload /></PrivateRoute>} />
          <Route path="/interview/:id" element={<PrivateRoute><LiveInterview /></PrivateRoute>} />
          <Route path="/video-interview/:id" element={<PrivateRoute><VideoInterview /></PrivateRoute>} />
          <Route path="/result/:id" element={<PrivateRoute><InterviewResult /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />

          {/* Password Routes */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
