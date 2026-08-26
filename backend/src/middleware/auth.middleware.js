import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async(req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (accessToken) {
            try {
                const decoded = jwt.verify(
                    accessToken,
                    process.env.JWT_ACCESS_SECRET
                );

                const user = await User.findById(decoded.id).select("-password");

                if (!user) {
                    return res.status(401).json({ message: "User not found" });
                }

                const currentVersion = typeof user.tokenVersion === "number" ? user.tokenVersion : 1;
                if (typeof decoded.tokenVersion === "number" && decoded.tokenVersion === currentVersion) {
                    req.user = {
                        id: user._id.toString(),
                        _id: user._id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };

                    return next();
                }
                // Token version mismatch or legacy token without version -> fall through to refresh check
            } catch (err) {
                // Invalid or expired access token -> fall through to refresh check
            }
        }

        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "Session expired" });
        }

        try {
            const decodedRefresh = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET
            );

            const user = await User.findById(decodedRefresh.id).select("-password");

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            const currentVersion = typeof user.tokenVersion === "number" ? user.tokenVersion : 1;
            if (typeof decodedRefresh.tokenVersion !== "number" || decodedRefresh.tokenVersion !== currentVersion) {
                return res.status(401).json({ message: "Session revoked" });
            }

            const newAccessToken = jwt.sign(
                { id: user._id, tokenVersion: currentVersion },
                process.env.JWT_ACCESS_SECRET,
                { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
            );

            res.cookie("accessToken", newAccessToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/",
                maxAge: 15 * 60 * 1000,
            });

            req.user = {
                id: user._id.toString(),
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            };

            return next();

        } catch (refreshError) {
            return res.status(401).json({ message: "Session expired" });
        }

    } catch (error) {
        return res.status(401).json({ message: "Not authorized" });
    }
};

