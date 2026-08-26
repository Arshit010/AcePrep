import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
    },

    /* Stored as plain text — will be hashed by the User model when the
       real account is created after OTP verification. */
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 72,
    },

    otp: {
        type: String,
        required: true,
    },

    otpExpires: {
        type: Date,
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // TTL: auto-delete after 10 minutes
    },
});

const PendingUser =
    mongoose.models.PendingUser ||
    mongoose.model("PendingUser", pendingUserSchema);

export default PendingUser;
