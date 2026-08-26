import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const userSchema = new mongoose.Schema({
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

    role: {
        type: String,
        enum: ["user"],
        default: "user",
    },

    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 72,
        select: false,
    },

    tokenVersion: {
        type: Number,
        default: 1,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    resumes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resume",
    }, ],

    interviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Interview",
    }, ],
}, { timestamps: true });


userSchema.pre("save", async function() {

    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});


userSchema.methods.comparePassword = async function(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};


userSchema.methods.getAuthUser = function() {
    return mongoose.model("User").findById(this._id).select("+password");
};


const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
