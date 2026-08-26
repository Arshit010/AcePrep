import Groq from "groq-sdk";
import dotenv from "dotenv";
import logger from "./logger.service.js";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.warn("⚠️ GROQ_API_KEY is missing in .env");
}

export const DEFAULT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

// 25 second timeout for Groq API calls
const AI_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 25000;

const aiClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: AI_TIMEOUT_MS,
});

/**
 * Execute an AI call with exponential backoff retry logic.
 * Retries ONLY on transient errors (e.g. 5xx status or network timeouts).
 * Fails fast without retrying on 4xx / rate-limit responses to avoid amplification loops.
 */
export async function callAiWithRetry(aiCallFn, maxRetries = 2) {
  let attempt = 0;
  let delayMs = 1000;

  while (attempt <= maxRetries) {
    try {
      attempt++;
      const startTime = Date.now();
      const result = await aiCallFn();
      const durationMs = Date.now() - startTime;

      logger.aiLatency("groq_chat_completion", durationMs, DEFAULT_MODEL, {
        input: result?.usage?.prompt_tokens || 0,
        output: result?.usage?.completion_tokens || 0,
      });

      return result;
    } catch (error) {
      const status = error?.status || error?.statusCode;
      const isTransient = !status || status >= 500 || error.code === "ETIMEDOUT" || error.message?.includes("timeout");

      logger.error(`AI API call attempt ${attempt} failed: ${error.message}`, {
        status,
        isTransient,
        attempt,
      });

      // Do NOT retry non-transient errors (4xx or 429 rate limit)
      if (!isTransient || attempt > maxRetries) {
        throw new Error(
          status === 429
            ? "AI service is currently experiencing high demand. Please try again in a few moments."
            : "AI service request failed. Please try again."
        );
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
}

export default aiClient;