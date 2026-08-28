import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import { globalApiLimiter } from "./middleware/rateLimiter.middleware.js";
import { csrfGuard } from "./middleware/csrfGuard.middleware.js";
import logger from "./services/logger.service.js";

const app = express();

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(
    helmet({
        crossOriginResourcePolicy: false,
        contentSecurityPolicy: false,
    })
);

const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173", "http://localhost:3000"] : [])
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`CORS rejected origin: ${origin}`);
                callback(new Error("CORS origin policy violation"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Idempotency-Key", "idempotency-key", "X-AcePrep-Client", "x-aceprep-client", "X-Refresh-Token", "x-refresh-token"],
        exposedHeaders: ["X-Access-Token"],
    })
);

app.use("/api", globalApiLimiter);

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/api", csrfGuard);

app.use((req, res, next) => {
    if (req.body && typeof req.body === "object") {
        for (let key in req.body) {
            if (key.includes("$") || key.includes(".")) {
                delete req.body[key];
            }
        }
    }
    next();
});

app.get(["/", "/health", "/api/health"], (req, res) => {
    res.json({ message: "AcePrep API running 🚀", status: "healthy", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/feedbacks", feedbackRoutes);

app.use("/api", (req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: "API route not found",
    });
});

app.use((err, req, res, next) => {
    logger.error("GLOBAL ERROR", {
        path: req.originalUrl,
        method: req.method,
        error: err.message,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const statusCode = err.status || err.statusCode || 500;

    res.status(statusCode).json({
        error: statusCode === 429 ? "Too Many Requests" : "Server Error",
        message: isProduction ?
            "An unexpected error occurred. Please try again later." :
            err.message,
    });
});

const PORT = process.env.PORT || 5001;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        logger.info("MongoDB connected successfully");
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error("DB connection failed", { error: err.message });
    });
