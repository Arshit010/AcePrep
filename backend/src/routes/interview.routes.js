import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
    generateInterview,
    startTopicInterview,
    startVideoTopicInterview,
    submitAnswer,
    saveIntegrity,
    abandonInterview,
    getInterviewResult,
    getInterviewHistory,
    deleteInterview
} from "../controllers/interview.controller.js";
import {
    startInterviewLimiter,
    submitAnswerLimiter,
    ipAiMinLimiter,
    ipAiHourLimiter
} from "../middleware/rateLimiter.middleware.js";
import {
    concurrencyGuard,
    checkActiveInterviewsGuard,
    idempotencyGuard
} from "../middleware/concurrencyAndIdempotency.middleware.js";
import {
    checkMonthlyQuotaGuard,
    validateInterviewInputs,
    sanitizeSensitiveFields
} from "../middleware/quotaAndValidation.middleware.js";

const router = express.Router();

const startInterviewChain = [
    protect,
    ipAiMinLimiter,
    ipAiHourLimiter,
    startInterviewLimiter,
    concurrencyGuard,
    checkActiveInterviewsGuard,
    checkMonthlyQuotaGuard,
    sanitizeSensitiveFields,
    validateInterviewInputs,
    idempotencyGuard
];

router.post("/generate", ...startInterviewChain, generateInterview);
router.post("/topic", ...startInterviewChain, startTopicInterview);
router.post("/video-topic", ...startInterviewChain, startVideoTopicInterview);

router.post(
    "/answer",
    protect,
    ipAiMinLimiter,
    ipAiHourLimiter,
    submitAnswerLimiter,
    concurrencyGuard,
    sanitizeSensitiveFields,
    validateInterviewInputs,
    idempotencyGuard,
    submitAnswer
);

router.post("/save-integrity", protect, saveIntegrity);
router.post("/abandon", protect, abandonInterview);

router.get("/result/:id", protect, getInterviewResult);
router.get("/", protect, getInterviewHistory);
router.delete("/:id", protect, deleteInterview);

export default router;
