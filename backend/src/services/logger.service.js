

const REDACT_KEYS = ["password", "token", "accessToken", "refreshToken", "resetPasswordToken", "resume", "answers", "raw"];

function sanitizeData(data) {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (REDACT_KEYS.some((rk) => key.toLowerCase().includes(rk.toLowerCase()))) {
      cleaned[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      cleaned[key] = sanitizeData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export const logger = {
  info: (msg, meta = {}) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, Object.keys(meta).length ? sanitizeData(meta) : "");
  },
  warn: (msg, meta = {}) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, Object.keys(meta).length ? sanitizeData(meta) : "");
  },
  error: (msg, meta = {}) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, Object.keys(meta).length ? sanitizeData(meta) : "");
  },
  rateLimit: (type, ip, userId, retryAfter) => {
    console.warn(`[RATE_LIMIT] [${new Date().toISOString()}] Type: ${type} | IP: ${ip} | User: ${userId || "Anonymous"} | RetryAfter: ${retryAfter}s`);
  },
  aiLatency: (action, durationMs, model, tokens = {}) => {
    console.log(`[AI_METRICS] [${new Date().toISOString()}] Action: ${action} | Duration: ${durationMs}ms | Model: ${model} | InTokens: ${tokens.input || 0} | OutTokens: ${tokens.output || 0}`);
  }
};

export default logger;
