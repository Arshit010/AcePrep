import rateLimit from "express-rate-limit";
import logger from "../services/logger.service.js";

// Helper to format standardized 429 response
const createRateLimitHandler = (limitName) => {
  return (req, res, next, options) => {
    const windowMs = options.windowMs || 60000;
    const retryAfter = Math.ceil(windowMs / 1000);
    const userId = req.user?._id?.toString() || req.user?.id || "";

    logger.rateLimit(limitName, req.ip, userId, retryAfter);

    res.setHeader("Retry-After", retryAfter);
    return res.status(429).json({
      error: "Too many requests",
      message: "Please try again later.",
      retryAfter,
    });
  };
};

// Key generator using userId if logged in, fallback to IP
const userOrIpKeyGenerator = (req) => {
  const userId = req.user?._id?.toString() || req.user?.id;
  return userId ? `user:${userId}` : `ip:${req.ip}`;
};

// Key generator combining email/account + IP for auth routes
const accountOrIpKeyGenerator = (req) => {
  const email = (req.body?.email || req.body?.account || "").toLowerCase().trim();
  return email ? `acct_ip:${email}_${req.ip}` : `ip:${req.ip}`;
};

/* ─── 1. AI API RATE LIMITERS ─── */

// Start Interview: 30 reqs / 10 mins per user
export const startInterviewLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AI_START_WINDOW_MS) || 10 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_START_MAX) || 30,
  keyGenerator: userOrIpKeyGenerator,
  handler: createRateLimitHandler("AI_START_INTERVIEW"),
  standardHeaders: true,
  legacyHeaders: false,
});

// Generate Question: 10 reqs / 1 min per user
export const generateQuestionLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AI_QUESTION_WINDOW_MS) || 1 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_QUESTION_MAX) || 10,
  keyGenerator: userOrIpKeyGenerator,
  handler: createRateLimitHandler("AI_GENERATE_QUESTION"),
  standardHeaders: true,
  legacyHeaders: false,
});

// Submit Answer: 30 reqs / 1 min per user
export const submitAnswerLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AI_ANSWER_WINDOW_MS) || 1 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_ANSWER_MAX) || 30,
  keyGenerator: userOrIpKeyGenerator,
  handler: createRateLimitHandler("AI_SUBMIT_ANSWER"),
  standardHeaders: true,
  legacyHeaders: false,
});

// Generate Feedback: 5 reqs / 10 mins per user
export const feedbackReportLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AI_FEEDBACK_WINDOW_MS) || 10 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_FEEDBACK_MAX) || 5,
  keyGenerator: userOrIpKeyGenerator,
  handler: createRateLimitHandler("AI_GENERATE_FEEDBACK"),
  standardHeaders: true,
  legacyHeaders: false,
});

// Generate Complete Interview: 3 reqs / 30 mins per user
export const completeInterviewLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AI_COMPLETE_WINDOW_MS) || 30 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_COMPLETE_MAX) || 3,
  keyGenerator: userOrIpKeyGenerator,
  handler: createRateLimitHandler("AI_COMPLETE_INTERVIEW"),
  standardHeaders: true,
  legacyHeaders: false,
});

// IP-based AI Limit: 30 reqs / 1 min per IP
export const ipAiMinLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_IP_AI_MIN_WINDOW_MS) || 1 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_IP_AI_MIN_MAX) || 30,
  keyGenerator: (req) => req.ip,
  handler: createRateLimitHandler("IP_AI_MINUTE_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
});

// IP-based AI Limit: 100 reqs / 1 hr per IP
export const ipAiHourLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_IP_AI_HOUR_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_IP_AI_HOUR_MAX) || 100,
  keyGenerator: (req) => req.ip,
  handler: createRateLimitHandler("IP_AI_HOUR_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
});

/* ─── 2. AUTHENTICATION RATE LIMITERS ─── */

// Login: 5 failed login attempts / 15 mins per account/IP
export const loginLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
  keyGenerator: accountOrIpKeyGenerator,
  handler: createRateLimitHandler("AUTH_LOGIN"),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed logins
});

// Signup: 5 attempts / 1 hr per IP
export const signupLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_SIGNUP_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_SIGNUP_MAX) || 5,
  keyGenerator: (req) => req.ip,
  handler: createRateLimitHandler("AUTH_SIGNUP"),
  standardHeaders: true,
  legacyHeaders: false,
});

// Password Reset: 3 requests / 1 hr per account/IP
export const passwordResetLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_PASSWORD_RESET_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PASSWORD_RESET_MAX) || 3,
  keyGenerator: accountOrIpKeyGenerator,
  handler: createRateLimitHandler("AUTH_PASSWORD_RESET"),
  standardHeaders: true,
  legacyHeaders: false,
});

// Email Verification: 5 requests / 15 mins per IP
export const emailVerificationLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_EMAIL_VERIFY_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_EMAIL_VERIFY_MAX) || 5,
  keyGenerator: (req) => req.ip,
  handler: createRateLimitHandler("AUTH_EMAIL_VERIFY"),
  standardHeaders: true,
  legacyHeaders: false,
});

/* ─── 3. GLOBAL BACKEND RATE LIMITER ─── */

export const globalApiLimiter = rateLimit({
  windowMs: Number(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000,
  max: Number(process.env.GLOBAL_RATE_LIMIT_MAX) || 100,
  keyGenerator: (req) => req.ip,
  handler: createRateLimitHandler("GLOBAL_API_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
});
