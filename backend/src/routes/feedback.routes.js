import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { submitFeedback, getMyFeedbacks, getInterviewFeedback } from "../controllers/feedback.controller.js";

const router = express.Router();

router.post("/", protect, submitFeedback);
router.get("/mine", protect, getMyFeedbacks);
router.get("/:interviewId", protect, getInterviewFeedback);

export default router;