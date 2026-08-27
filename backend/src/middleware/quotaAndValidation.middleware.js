import Interview from "../models/Interview.js";
import logger from "../services/logger.service.js";

export const checkMonthlyQuotaGuard = async (req, res, next) => {
  next();
};

export const sanitizeSensitiveFields = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    const FORBIDDEN_FIELDS = [
      "role",
      "aiUsageCount",
      "resetPasswordToken",
      "resetPasswordExpire",
    ];

    FORBIDDEN_FIELDS.forEach((field) => {
      if (field in req.body) {
        delete req.body[field];
      }
    });
  }
  next();
};

export const validateInterviewInputs = (req, res, next) => {
  const {
    role,
    topic,
    topics,
    difficulty,
    questionCount,
    durationMinutes,
    customTone,
    language,
    answer,
  } = req.body;

  if (role) {
    if (typeof role !== "string" || role.trim().length > 100) {
      return res.status(400).json({ message: "Role must be a string up to 100 characters." });
    }
  }

  if (topic) {
    if (typeof topic !== "string" || topic.trim().length > 100) {
      return res.status(400).json({ message: "Topic must be a string up to 100 characters." });
    }
  }

  if (Array.isArray(topics)) {
    if (topics.length > 10) {
      return res.status(400).json({ message: "Maximum 10 focus topics allowed." });
    }
    for (const t of topics) {
      if (typeof t !== "string" || t.trim().length > 100) {
        return res.status(400).json({ message: "Each focus topic must be up to 100 characters." });
      }
    }
  }

  if (difficulty) {
    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(String(difficulty).toLowerCase())) {
      return res.status(400).json({ message: "Difficulty must be 'easy', 'medium', or 'hard'." });
    }
  }

  if (questionCount !== undefined) {
    const num = Number(questionCount);
    if (isNaN(num) || num < 1 || num > 12) {
      return res.status(400).json({ message: "Question count must be between 1 and 12." });
    }
  }

  if (durationMinutes !== undefined) {
    const num = Number(durationMinutes);
    if (isNaN(num) || num < 5 || num > 60) {
      return res.status(400).json({ message: "Duration must be between 5 and 60 minutes." });
    }
  }

  if (customTone && (typeof customTone !== "string" || customTone.length > 200)) {
    return res.status(400).json({ message: "Custom tone must be a string up to 200 characters." });
  }

  if (language && (typeof language !== "string" || language.length > 50)) {
    return res.status(400).json({ message: "Language string must be up to 50 characters." });
  }

  if (answer !== undefined) {
    if (typeof answer !== "string") {
      return res.status(400).json({ message: "Answer must be a string." });
    }
    if (answer.length > 5000) {
      return res.status(400).json({ message: "Answer exceeds maximum allowed length of 5000 characters." });
    }
  }

  next();
};
