import logger from "../services/logger.service.js";

const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173", "http://localhost:3000"] : [])
].filter(Boolean);

/**
 * Middleware: Defends against Cross-Site Request Forgery (CSRF).
 * Applies ONLY to state-changing HTTP methods (POST, PUT, PATCH, DELETE).
 * Requires X-AcePrep-Client header and validates Origin for browser calls.
 * Excludes server-to-server webhooks.
 */
export const csrfGuard = (req, res, next) => {
    // Safe HTTP methods do not modify server state and are exempt
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(req.method)) {
        return next();
    }


    // 1. Require custom client header (cannot be sent by cross-site simple forms)
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

    // 2. Validate Origin if present
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
