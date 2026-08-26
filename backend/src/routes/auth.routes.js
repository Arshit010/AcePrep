import express from "express";
import {
    register,
    verifyOtp,
    resendOtp,
    login,
    logout,
    refreshToken,
    getMe,
    forgotPassword,
    resetPassword
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import {
    loginLimiter,
    signupLimiter,
    passwordResetLimiter,
    emailVerificationLimiter
} from "../middleware/rateLimiter.middleware.js";
import { sanitizeSensitiveFields } from "../middleware/quotaAndValidation.middleware.js";

const router = express.Router();

router.get("/test", (req, res) => {
    res.json({ message: "Auth routes working 🚀" });
});

router.post("/register", signupLimiter, sanitizeSensitiveFields, register);
router.post("/verify-otp", emailVerificationLimiter, sanitizeSensitiveFields, verifyOtp);
router.post("/resend-otp", emailVerificationLimiter, sanitizeSensitiveFields, resendOtp);
router.post("/login", loginLimiter, sanitizeSensitiveFields, login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);

router.get("/me", protect, getMe);

router.post("/forgot-password", passwordResetLimiter, sanitizeSensitiveFields, forgotPassword);
router.post("/reset/:token", passwordResetLimiter, sanitizeSensitiveFields, resetPassword);

export default router;