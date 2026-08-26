import mongoose from "mongoose";

const usageLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Interview",
    default: null,
  },
  requestType: {
    type: String,
    enum: [
      "start_interview",
      "generate_question",
      "submit_answer",
      "generate_report",
      "resume_parse",
    ],
    required: true,
  },
  aiModel: {
    type: String,
    default: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  },
  inputTokens: {
    type: Number,
    default: 0,
  },
  outputTokens: {
    type: Number,
    default: 0,
  },
  estimatedCost: {
    type: Number,
    default: 0,
  },
  ip: {
    type: String,
    default: "",
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, { timestamps: true });

// Compound index for monthly quota querying
usageLogSchema.index({ user: 1, requestType: 1, timestamp: -1 });

const UsageLog = mongoose.models.UsageLog || mongoose.model("UsageLog", usageLogSchema);
export default UsageLog;
