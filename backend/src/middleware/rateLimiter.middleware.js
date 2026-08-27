import rateLimit from "express-rate-limit";
import logger from "../services/logger.service.js";

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

const userOrIpKeyGenerator = (req) => {
  const userId = req.user?._id?.toString() || req.user?.id;
  return userId ? `user:${userId}` : `ip:${req.ip}`;
};

const accountOrIpKeyGenerator = (req) => {
  const email = (req.body?.email || req.body?.account || "").toLowerCase().trim();
  return email ? `acct_ip:${email}_${req.ip}` : `ip:${req.ip}`;
};

export const startInterviewLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AI_START_WINDOW_MS) || 10 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_START_MAX) || 30,
  keyGenerator: userOrIpKeyGenerator,
  handler: createRateLimitHandler("AI_START_INTERVIEW"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const generateQuestionLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AI_QUESTION_WINDOW_MS) || 1 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_QUESTION_MAX) || 10,
  keyGenerator: userOrIpKeyGenerator,
  handler: createRateLimitHandler("AI_GENERATE_QUESTION"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const submitAnswerLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AI_ANSWER_WINDOW_MS) || 1 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_ANSWER_MAX) || 30,
  keyGenerator: userOrIpKeyGenerator,
  handler: createRateLimitHandler("AI_SUBMIT_ANSWER"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const feedbackReportLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AI_FEEDBACK_WINDOW_MS) || 10 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_FEEDBACK_MAX) || 5,
  keyGenerator: userOrIpKeyGenerator,
  handler: createRateLimitHandler("AI_GENERATE_FEEDBACK"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const completeInterviewLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AI_COMPLETE_WINDOW_MS) || 30 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AI_COMPLETE_MAX) || 3,
  keyGenerator: userOrIpKeyGenerator,
  handler: createRateLimitHandler("AI_COMPLETE_INTERVIEW"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const ipAiMinLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_IP_AI_MIN_WINDOW_MS) || 1 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_IP_AI_MIN_MAX) || 30,
  keyGenerator: (req) => req.ip,
  handler: createRateLimitHandler("IP_AI_MINUTE_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const ipAiHourLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_IP_AI_HOUR_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_IP_AI_HOUR_MAX) || 100,
  keyGenerator: (req) => req.ip,
  handler: createRateLimitHandler("IP_AI_HOUR_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
  keyGenerator: accountOrIpKeyGenerator,
  handler: createRateLimitHandler("AUTH_LOGIN"),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const signupLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_SIGNUP_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_SIGNUP_MAX) || 5,
  keyGenerator: (req) => req.ip,
  handler: createRateLimitHandler("AUTH_SIGNUP"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordResetLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_PASSWORD_RESET_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PASSWORD_RESET_MAX) || 3,
  keyGenerator: accountOrIpKeyGenerator,
  handler: createRateLimitHandler("AUTH_PASSWORD_RESET"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const emailVerificationLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_EMAIL_VERIFY_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_EMAIL_VERIFY_MAX) || 5,
  keyGenerator: (req) => req.ip,
  handler: createRateLimitHandler("AUTH_EMAIL_VERIFY"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const globalApiLimiter = rateLimit({
  windowMs: Number(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000,
  max: Number(process.env.GLOBAL_RATE_LIMIT_MAX) || 100,
  keyGenerator: (req) => req.ip,
  handler: createRateLimitHandler("GLOBAL_API_LIMIT"),
  standardHeaders: true,
  legacyHeaders: false,
});
