import Interview from "../models/Interview.js";
import logger from "../services/logger.service.js";

const activeUserRequests = new Map();
const activeIpRequests = new Map();
let globalActiveAiRequests = 0;

const MAX_CONCURRENT_PER_USER = Number(process.env.MAX_CONCURRENT_PER_USER) || 2;
const MAX_CONCURRENT_PER_IP = Number(process.env.MAX_CONCURRENT_PER_IP) || 10;
const MAX_CONCURRENT_GLOBAL = Number(process.env.MAX_CONCURRENT_GLOBAL) || 50;

const idempotencyCache = new Map();
const IDEMPOTENCY_TTL_MS = 2 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of idempotencyCache.entries()) {
    if (now - entry.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}, 60 * 1000);

export const concurrencyGuard = (req, res, next) => {
  const userId = req.user?._id?.toString() || req.user?.id || "";
  const ip = req.ip || "unknown";

  const currentUserActive = activeUserRequests.get(userId) || 0;
  const currentIpActive = activeIpRequests.get(ip) || 0;

  if (globalActiveAiRequests >= MAX_CONCURRENT_GLOBAL) {
    logger.warn(`Global concurrency limit reached (${globalActiveAiRequests})`, { ip, userId });
    res.setHeader("Retry-After", 10);
    return res.status(429).json({
      error: "Too many requests",
      message: "Server is currently experiencing high load. Please try again shortly.",
      retryAfter: 10,
    });
  }

  if (userId && currentUserActive >= MAX_CONCURRENT_PER_USER) {
    logger.warn(`User concurrency limit reached (${currentUserActive})`, { userId, ip });
    res.setHeader("Retry-After", 5);
    return res.status(429).json({
      error: "Too many requests",
      message: "You already have an active request in progress. Please wait for it to complete.",
      retryAfter: 5,
    });
  }

  if (currentIpActive >= MAX_CONCURRENT_PER_IP) {
    logger.warn(`IP concurrency limit reached (${currentIpActive})`, { ip });
    res.setHeader("Retry-After", 10);
    return res.status(429).json({
      error: "Too many requests",
      message: "Too many concurrent requests from your network. Please wait a moment.",
      retryAfter: 10,
    });
  }

  if (userId) activeUserRequests.set(userId, currentUserActive + 1);
  activeIpRequests.set(ip, currentIpActive + 1);
  globalActiveAiRequests++;

  let released = false;
  const releaseLocks = () => {
    if (released) return;
    released = true;

    if (userId) {
      const count = activeUserRequests.get(userId) || 1;
      if (count <= 1) activeUserRequests.delete(userId);
      else activeUserRequests.set(userId, count - 1);
    }

    const ipCount = activeIpRequests.get(ip) || 1;
    if (ipCount <= 1) activeIpRequests.delete(ip);
    else activeIpRequests.set(ip, ipCount - 1);

    globalActiveAiRequests = Math.max(0, globalActiveAiRequests - 1);
  };

  res.on("finish", releaseLocks);
  res.on("close", releaseLocks);

  next();
};

export const checkActiveInterviewsGuard = async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id;
    if (!userId) return next();

    await Interview.updateMany(
      {
        user: userId,
        status: { $in: ["generated", "in_progress"] },
      },
      { status: "abandoned" }
    );

    next();
  } catch (error) {
    logger.error("Active interview check failed", { error: error.message });
    next();
  }
};

export const idempotencyGuard = (req, res, next) => {
  const idempotencyKey =
    req.headers["x-idempotency-key"] ||
    req.body?.idempotencyKey ||
    req.headers["idempotency-key"];

  if (!idempotencyKey) {
    return next();
  }

  const userId = req.user?._id?.toString() || req.user?.id || req.ip;
  const compositeKey = `${userId}:${idempotencyKey}`;

  const cached = idempotencyCache.get(compositeKey);
  if (cached) {
    logger.info(`Idempotent hit for key: ${compositeKey}`);
    return res.status(cached.statusCode).json(cached.body);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyCache.set(compositeKey, {
        timestamp: Date.now(),
        statusCode: res.statusCode,
        body,
      });
    }
    return originalJson(body);
  };

  next();
};
