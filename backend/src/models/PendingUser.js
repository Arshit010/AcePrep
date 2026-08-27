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
        expires: 600,
    },
});

const PendingUser =
    mongoose.models.PendingUser ||
    mongoose.model("PendingUser", pendingUserSchema);

export default PendingUser;
