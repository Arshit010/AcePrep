import User from "../models/User.js";
import PendingUser from "../models/PendingUser.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendOtpEmail, sendResetPasswordEmail } from "../services/email.service.js";

const generateAccessToken = (userOrId, version) => {
    const id = typeof userOrId === "object" ? (userOrId._id || userOrId.id) : userOrId;
    const tokenVersion = typeof userOrId === "object" ? userOrId.tokenVersion : version;
    const safeVersion = typeof tokenVersion === "number" ? tokenVersion : 1;
    return jwt.sign(
        { id, tokenVersion: safeVersion },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
    );
};

const generateRefreshToken = (userOrId, version) => {
    const id = typeof userOrId === "object" ? (userOrId._id || userOrId.id) : userOrId;
    const tokenVersion = typeof userOrId === "object" ? userOrId.tokenVersion : version;
    const safeVersion = typeof tokenVersion === "number" ? tokenVersion : 1;
    return jwt.sign(
        { id, tokenVersion: safeVersion },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
    );
};

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
};

const clearCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    expires: new Date(0),
};

function generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
}

function hashOtp(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

const MIN_PASSWORD_CHARS = 6;
const MAX_PASSWORD_BYTES = 72;

function validatePassword(password) {
    if (!password || typeof password !== "string") {
        return { valid: false, message: "Password is required" };
    }

    if (password.length < MIN_PASSWORD_CHARS) {
        return { valid: false, message: `Password must be at least ${MIN_PASSWORD_CHARS} characters` };
    }

    if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
        return { valid: false, message: "Password must not exceed 72 bytes" };
    }

    return { valid: true };
}

export const register = async(req, res) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.toLowerCase().trim();
        const password = req.body.password?.trim();

        if (!name || !email || !password)
            return res.status(400).json({ message: "All fields required" });

        const passwordVal = validatePassword(password);
        if (!passwordVal.valid) {
            return res.status(400).json({ message: passwordVal.message });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "Email already registered" });

        const otp = generateOtp();
        const hashedOtp = hashOtp(otp);

        await PendingUser.deleteMany({ email });
        await PendingUser.create({
            name,
            email,
            password,
            otp: hashedOtp,
            otpExpires: new Date(Date.now() + 10 * 60 * 1000),
        });

        try {
            await sendOtpEmail(email, otp, name);
        } catch (emailErr) {
            console.error("OTP email send failed:", emailErr.message);
            return res.status(500).json({
                message: "Failed to send verification email. Please try again.",
            });
        }

        res.status(200).json({
            message: "Verification code sent to your email",
            email,
            requiresOtp: true,
        });

    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Registration failed" });
    }
};

export const verifyOtp = async(req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();
        const otp = req.body.otp?.trim();

        if (!email || !otp)
            return res.status(400).json({ message: "Email and verification code are required" });

        const pending = await PendingUser.findOne({ email });

        if (!pending)
            return res.status(400).json({
                message: "No pending registration found. Please sign up again.",
            });

        if (pending.otpExpires < new Date()) {
            await PendingUser.deleteOne({ email });
            return res.status(400).json({
                message: "Verification code has expired. Please sign up again.",
            });
        }

        const hashedInput = hashOtp(otp);
        if (hashedInput !== pending.otp) {
            return res.status(400).json({
                message: "Invalid verification code",
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await PendingUser.deleteOne({ email });
            return res.status(400).json({ message: "Email already registered" });
        }

        const user = await User.create({
            name: pending.name,
            email: pending.email,
            password: pending.password,
            role: "user",
        });

        await PendingUser.deleteOne({ email });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            message: "Email verified , account created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: "Verification failed" });
    }
};

export const resendOtp = async(req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();

        if (!email)
            return res.status(400).json({ message: "Email is required" });

        const pending = await PendingUser.findOne({ email });

        if (!pending)
            return res.status(400).json({
                message: "No pending registration found. Please sign up again.",
            });

        const otp = generateOtp();
        const hashedOtp = hashOtp(otp);

        await PendingUser.updateOne(
            { email },
            {
                otp: hashedOtp,
                otpExpires: new Date(Date.now() + 10 * 60 * 1000),
                createdAt: new Date(),
            }
        );

        try {
            await sendOtpEmail(email, otp, pending.name);
        } catch (emailErr) {
            console.error("Resend OTP email failed:", emailErr.message);
            return res.status(500).json({
                message: "Failed to send verification email. Please try again.",
            });
        }

        res.status(200).json({
            message: "New verification code sent to your email",
        });

    } catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({ message: "Failed to resend verification code" });
    }
};

export const login = async(req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();
        const password = req.body.password?.trim();

        if (!email || !password)
            return res.status(400).json({
                message: "Email and password required",
            });

        const passwordVal = validatePassword(password);
        if (!passwordVal.valid) {
            return res.status(400).json({ message: passwordVal.message });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user)
            return res.status(400).json({
                message: "Invalid email or password",
            });

        const match = await bcrypt.compare(password, user.password);

        if (!match)
            return res.status(400).json({
                message: "Invalid email or password",
            });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
    }
};

export const refreshToken = async(req, res) => {
    try {
        const token = req.cookies?.refreshToken;

        if (!token)
            return res.status(401).json({
                message: "Refresh token missing",
            });

        const decoded = jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET
        );

        const user = await User.findById(decoded.id);

        if (!user)
            return res.status(401).json({
                message: "User not found",
            });

        const currentVersion = typeof user.tokenVersion === "number" ? user.tokenVersion : 1;
        if (typeof decoded.tokenVersion !== "number" || decoded.tokenVersion !== currentVersion) {
            return res.status(401).json({
                message: "Session revoked",
            });
        }

        const newAccessToken = generateAccessToken(user);

        res.cookie("accessToken", newAccessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });

        res.status(200).json({
            message: "Access token refreshed",
        });

    } catch (error) {
        return res.status(401).json({
            message: "Invalid refresh token",
        });
    }
};

export const logout = async(req, res) => {
    try {
        const userId = req.user?._id?.toString() || req.user?.id || req.body?.userId;

        if (userId) {
            await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
        } else if (req.cookies?.refreshToken) {
            try {
                const decodedRefresh = jwt.verify(
                    req.cookies.refreshToken,
                    process.env.JWT_REFRESH_SECRET
                );
                if (decodedRefresh?.id) {
                    await User.findByIdAndUpdate(decodedRefresh.id, { $inc: { tokenVersion: 1 } });
                }
            } catch (ignore) {}
        }

        res.clearCookie("accessToken", clearCookieOptions);
        res.clearCookie("refreshToken", clearCookieOptions);

        return res.status(200).json({
            message: "Logged out successfully",
        });

    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            message: "Logout failed",
        });
    }
};

export const forgotPassword = async(req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();
        const genericMessage = "If an account exists with that email address, a password reset link has been sent.";

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(200).json({ message: genericMessage });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire =
            new Date(Date.now() + 15 * 60 * 1000);

        await user.save({ validateBeforeSave: false });

        const resetLink =
            `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        try {
            await sendResetPasswordEmail(email, resetLink);
        } catch (emailErr) {
            console.error("Password reset email send failed:", emailErr.message);
        }

        res.status(200).json({
            message: genericMessage,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to generate reset link",
        });
    }
};

export const resetPassword = async(req, res) => {
    try {
        const { token } = req.params;
        const password = req.body.password?.trim();

        const passwordVal = validatePassword(password);
        if (!passwordVal.valid) {
            return res.status(400).json({ message: passwordVal.message });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: new Date() },
        }).select("+password");

        if (!user)
            return res.status(400).json({
                message: "Invalid or expired reset link",
            });

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.tokenVersion = (typeof user.tokenVersion === "number" ? user.tokenVersion : 1) + 1;

        await user.save();

        res.status(200).json({
            message: "Password updated successfully",
        });

    } catch (error) {
        res.status(500).json({
            message: "Password reset failed",
        });
    }
};

export const getMe = async(req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch user",
        });
    }
};
