import mongoose from "mongoose";

/* 
   ANSWER SUB-SCHEMA
*/
const answerSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },

    userAnswer: {
        type: String,
        required: true
    },

    aiFeedback: {
        type: String,
        default: ""
    },

    answerSummary: {
        type: String,
        default: ""
    },

    idealAnswer: {
        type: String,
        default: ""
    },

    followUp: {
        type: String,
        default: ""
    },

    encouragement: {
        type: String,
        default: ""
    },

    feedbackHighlights: [{
        type: String
    }],

    score: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
    },

    communicationScore: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
    },

    technicalAccuracyScore: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
    }
}, { _id: false });


/* 
   INTERVIEW MAIN SCHEMA
 */
const interviewSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },


    type: {
        type: String,
        enum: ["resume", "topic", "role", "video_topic"],
        required: true
    },


    role: {
        type: String,
        default: null
    },

    skills: [{
        type: String
    }],


    topic: {
        type: String,
        default: null
    },

    topics: [{
        type: String
    }],

    language: {
        type: String,
        default: "English"
    },

    questionCount: {
        type: Number,
        default: 5
    },

    durationMinutes: {
        type: Number,
        default: 10
    },

    voiceStyle: {
        type: String,
        default: "Professional male"
    },

    customTone: {
        type: String,
        default: ""
    },

    sessionFormat: {
        type: String,
        enum: ["text", "video"],
        default: "text"
    },

    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "medium"
    },

    questions: [{
        type: String,
        required: true
    }],

    answers: [answerSchema],

    totalScore: {
        type: Number,
        default: 0
    },

    confidenceScore: {
        type: Number,
        default: 0
    },

    communicationScore: {
        type: Number,
        default: 0
    },

    technicalAccuracyScore: {
        type: Number,
        default: 0
    },

    integrityScore: {
        type: Number,
        default: 100
    },

    suspiciousActionsCount: {
        type: Number,
        default: 0
    },

    suspiciousEvents: [{
        type: String
    }],

    overallFeedback: { // final report summary
        type: String,
        default: ""
    },

    suggestions: { // improvement suggestions
        type: String,
        default: ""
    },

    strengths: [{
        type: String
    }],

    weaknesses: [{
        type: String
    }],

    recommendedTopics: [{
        type: String
    }]
}, { timestamps: true });

interviewSchema.add({
    status: {
        type: String,
        enum: ["generated", "in_progress", "completed", "abandoned"],
        default: "generated"
    }
});



const Interview =
    mongoose.models.Interview ||
    mongoose.model("Interview", interviewSchema);

export default Interview;
