import express from "express";
import {
    uploadResume,
    getMyResumes,
    getResumeProfile,
    deleteResume,
    startResumeInterview
} from "../controllers/resume.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
    startInterviewLimiter,
    ipAiMinLimiter,
    ipAiHourLimiter
} from "../middleware/rateLimiter.middleware.js";
import {
    concurrencyGuard,
    checkActiveInterviewsGuard,
    idempotencyGuard
} from "../middleware/concurrencyAndIdempotency.middleware.js";
import { checkMonthlyQuotaGuard } from "../middleware/quotaAndValidation.middleware.js";

const router = express.Router();

router.post("/upload", protect, ipAiMinLimiter, ipAiHourLimiter, upload.single("resume"), uploadResume);

router.post(
    "/start-interview/:id",
    protect,
    ipAiMinLimiter,
    ipAiHourLimiter,
    startInterviewLimiter,
    concurrencyGuard,
    checkActiveInterviewsGuard,
    checkMonthlyQuotaGuard,
    idempotencyGuard,
    startResumeInterview
);

router.get("/my", protect, getMyResumes);
router.get("/:id", protect, getResumeProfile);
router.delete("/:id", protect, deleteResume);

export default router;