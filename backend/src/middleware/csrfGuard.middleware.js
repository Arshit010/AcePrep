import logger from "../services/logger.service.js";

const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173", "http://localhost:3000"] : [])
].filter(Boolean);

export const csrfGuard = (req, res, next) => {

    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    const clientHeader = req.headers["x-aceprep-client"];
    if (!clientHeader) {
        logger.warn(`CSRF blocked request missing X-AcePrep-Client header`, {
            path: req.originalUrl || req.path,
            method: req.method,
            ip: req.ip,
        });
        return res.status(403).json({
            error: "Forbidden",
            message: "CSRF protection: Missing required request header",
        });
    }

    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
        logger.warn(`CSRF blocked request with untrusted origin: ${origin}`, {
            path: req.originalUrl || req.path,
            method: req.method,
            ip: req.ip,
        });
        return res.status(403).json({
            error: "Forbidden",
            message: "CSRF protection: Untrusted request origin",
        });
    }

    next();
};
