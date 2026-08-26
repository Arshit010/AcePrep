import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    name: String,
    description: String,
    tech_stack: [String]
}, { _id: false });

const profileSchema = new mongoose.Schema({
    role: String,
    experience_level: String,
    skills: [String],
    technologies: [String],
    projects: [projectSchema],
    interview_type: String
}, { _id: false });

const resumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    filename: String,
    content: String,
    profile: profileSchema
}, { timestamps: true });

export default mongoose.model("Resume", resumeSchema);