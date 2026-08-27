import Interview from "../models/Interview.js";
import { generateInterviewQuestions } from "../services/ai.service.js";
import { evaluateAnswer } from "../services/evaluate.service.js";
import { generateFinalReport } from "../services/report.service.js";

const getUserId = (req) =>
    req.user?._id?.toString() || req.user?.id;

const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, Number(value) || min));

export const generateInterview = async(req, res) => {
    try {
        const { role, difficulty } = req.body;
        const userId = getUserId(req);

        if (!role || !difficulty)
            return res.status(400).json({ message: "Role and difficulty are required" });

        if (!userId)
            return res.status(401).json({ message: "Unauthorized user" });

        const safeRole = String(role).trim().slice(0, 100);

        const pastInterviews = await Interview.find({
            user: userId,
            type: "role",
            role: { $regex: new RegExp(`^${safeRole.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("questions");

        const previousQuestions = pastInterviews
            .flatMap(interview => interview.questions || [])
            .slice(0, 50);

        const questions = await generateInterviewQuestions(role, difficulty, 5, previousQuestions);

        const interview = await Interview.create({
            user: userId,
            type: "role",
            role,
            difficulty,
            questions,
            answers: [],
            totalScore: 0,
            status: "generated"
        });

        res.status(201).json({
            interviewId: interview._id,
            questions
        });

    } catch (error) {
        console.error("Generate interview error:", error);
        res.status(500).json({ message: "Interview generation failed" });
    }
};

export const startTopicInterview = async(req, res) => {
    try {
        const { topic, difficulty } = req.body;
        const userId = getUserId(req);

        if (!topic)
            return res.status(400).json({ message: "Topic is required" });

        const safeTopic = String(topic).trim().slice(0, 100);

        const pastInterviews = await Interview.find({
            user: userId,
            type: "topic",
            topic: { $regex: new RegExp(`^${safeTopic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("questions");

        const previousQuestions = pastInterviews
            .flatMap(interview => interview.questions || [])
            .slice(0, 50);

        const questions = await generateInterviewQuestions(topic, difficulty || "medium", 5, previousQuestions);

        const interview = await Interview.create({
            user: userId,
            type: "topic",
            topic,
            difficulty: difficulty || "medium",
            questions,
            answers: [],
            totalScore: 0,
            status: "generated"
        });

        res.json({
            interviewId: interview._id,
            questions
        });

    } catch (error) {
        console.error("Topic interview error:", error);
        res.status(500).json({ message: "Failed to start interview" });
    }
};

export const startVideoTopicInterview = async(req, res) => {
    try {
        const {
            topic,
            topics,
            difficulty,
            questionCount,
            durationMinutes,
            voiceStyle,
            customTone,
            language
        } = req.body;
        const userId = getUserId(req);

        if (!topic) {
            return res.status(400).json({ message: "Primary topic is required" });
        }

        const safePrimaryTopic = String(topic).trim().slice(0, 100);

        const normalizedTopics = Array.isArray(topics) ?
            topics.map(item => String(item || "").trim().slice(0, 100)).filter(Boolean).slice(0, 8) :
            [safePrimaryTopic];

        const safeDurationMinutes = clamp(durationMinutes, 5, 60);
        const safeQuestionCount =
            Math.max(3,
                Math.min(
                    questionCount ? Number(questionCount) : Math.ceil((safeDurationMinutes || 10) / 2),
                    12
                ));

        const pastInterviews = await Interview.find({
            user: userId,
            type: "video_topic",
            topic: { $regex: new RegExp(`^${safePrimaryTopic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("questions");

        const previousQuestions = pastInterviews
            .flatMap(interview => interview.questions || [])
            .slice(0, 50);

        const questions = await generateInterviewQuestions({
            mode: "video_topic",
            topic,
            topics: normalizedTopics,
            durationMinutes: safeDurationMinutes,
            voiceStyle: voiceStyle || "Professional male",
            customTone: customTone || "",
            language: language || "English"
        }, difficulty || "medium", safeQuestionCount, previousQuestions);

        const interview = await Interview.create({
            user: userId,
            type: "video_topic",
            topic,
            topics: normalizedTopics,
            difficulty: difficulty || "medium",
            questionCount: safeQuestionCount,
            durationMinutes: safeDurationMinutes,
            voiceStyle: voiceStyle || "Professional male",
            customTone: customTone || "",
            language: language || "English",
            sessionFormat: "video",
            questions,
            answers: [],
            totalScore: 0,
            integrityScore: 100,
            suspiciousActionsCount: 0,
            suspiciousEvents: [],
            status: "generated"
        });

        res.json({
            interviewId: interview._id,
            questions
        });

    } catch (error) {
        console.error("Video topic interview error:", error);
        res.status(500).json({ message: "Failed to start video interview" });
    }
};

export const submitAnswer = async(req, res) => {
    try {
        const { interviewId, questionIndex, answer, integrity } = req.body;
        const userId = getUserId(req);

        const interview = await Interview.findById(interviewId);
        if (!interview) return res.status(404).json({ message: "Interview not found" });

        if (interview.user.toString() !== userId)
            return res.status(403).json({ message: "Unauthorized interview access" });

        if (interview.status === "abandoned")
            return res.status(400).json({ message: "This interview has already been quit." });

        const question = interview.questions[questionIndex];
        if (!question)
            return res.status(400).json({ message: "Invalid question index" });

        const existingAnswer = interview.answers[questionIndex];
        if (existingAnswer) {
            return res.json({
                completed: interview.status === "completed",
                interviewId: interview._id,
                answerSummary: existingAnswer.answerSummary,
                encouragement: existingAnswer.encouragement,
                quickFeedback: existingAnswer.aiFeedback,
                feedbackHighlights: existingAnswer.feedbackHighlights || [],
                followUp: "",
                integrityScore: interview.integrityScore
            });
        }

        const evaluation = await evaluateAnswer(question, answer);

        interview.answers.push({
            question,
            userAnswer: answer,
            aiFeedback: evaluation.feedback || "No feedback generated",
            answerSummary: evaluation.summary || "",
            idealAnswer: evaluation.idealAnswer || "",
            followUp: evaluation.followUp || "",
            encouragement: evaluation.encouragement || "",
            feedbackHighlights: Array.isArray(evaluation.feedbackHighlights) ? evaluation.feedbackHighlights.slice(0, 3) : [],
            score: clamp(evaluation.score, 0, 10),
            communicationScore: clamp(evaluation.communicationScore, 0, 10),
            technicalAccuracyScore: clamp(evaluation.technicalAccuracyScore, 0, 10)
        });

        interview.totalScore = interview.answers.reduce((sum, item) => sum + item.score, 0);
        interview.communicationScore = interview.answers.reduce((sum, item) => sum + item.communicationScore, 0);
        interview.technicalAccuracyScore = interview.answers.reduce((sum, item) => sum + item.technicalAccuracyScore, 0);

        if (integrity && typeof integrity === "object") {
            const incomingIntegrity = clamp(integrity.integrityScore, 0, 100);

            const currentIntegrity = typeof interview.integrityScore === "number" ? interview.integrityScore : 100;
            interview.integrityScore = Math.min(currentIntegrity, incomingIntegrity);

            const incomingCount = clamp(integrity.suspiciousActionsCount, 0, 999);
            interview.suspiciousActionsCount = Math.max(incomingCount, interview.suspiciousActionsCount || 0);

            if (Array.isArray(integrity.suspiciousEvents)) {

                const merged = [...(interview.suspiciousEvents || []), ...integrity.suspiciousEvents]
                    .map(item => String(item))
                    .slice(-50);
                interview.suspiciousEvents = merged;
            }
        }

        interview.status =
            interview.answers.length === interview.questions.length ?
            "completed" :
            "in_progress";

        if (interview.status === "completed") {
            const report = await generateFinalReport(interview);

            interview.confidenceScore = clamp(report.confidenceScore, 0, 100);
            interview.communicationScore = clamp(report.communicationScore, 0, 100);
            interview.technicalAccuracyScore = clamp(report.technicalAccuracyScore, 0, 100);
            interview.integrityScore = clamp(
                interview.integrityScore || report.integrityScore,
                0,
                100
            );
            interview.overallFeedback = report.summary || "";
            interview.suggestions = Array.isArray(report.improvementTips) ?
                report.improvementTips.join(" | ") :
                report.summary || "";
            interview.strengths = report.strengths || [];
            interview.weaknesses = report.weaknesses || [];
            interview.recommendedTopics = report.recommendedTopics || report.suggested_topics || [];
        }

        await interview.save();

        const latestAnswer = interview.answers[interview.answers.length - 1];

        res.json({
            completed: interview.status === "completed",
            interviewId: interview._id,
            answerSummary: latestAnswer.answerSummary,
            encouragement: latestAnswer.encouragement,
            quickFeedback: latestAnswer.aiFeedback,
            feedbackHighlights: latestAnswer.feedbackHighlights || [],
            followUp: "",
            integrityScore: interview.integrityScore
        });

    } catch (error) {
        console.error("Submit answer error:", error);
        res.status(500).json({ message: "Answer submission failed" });
    }
};

export const saveIntegrity = async(req, res) => {
    try {
        const { interviewId, integrityScore, suspiciousActionsCount, suspiciousEvents } = req.body;
        const userId = getUserId(req);

        const interview = await Interview.findById(interviewId);
        if (!interview) return res.status(404).json({ message: "Interview not found" });

        if (interview.user.toString() !== userId)
            return res.status(403).json({ message: "Unauthorized" });

        if (interview.status === "completed")
            return res.status(400).json({ message: "Interview already completed" });

        if (interview.status === "abandoned")
            return res.status(400).json({ message: "Interview already quit" });

        const incoming = clamp(integrityScore, 0, 100);
        const current = typeof interview.integrityScore === "number" ? interview.integrityScore : 100;
        interview.integrityScore = Math.min(current, incoming);

        const incomingCount = clamp(suspiciousActionsCount, 0, 999);
        interview.suspiciousActionsCount = Math.max(incomingCount, interview.suspiciousActionsCount || 0);

        if (Array.isArray(suspiciousEvents)) {
            const merged = [...(interview.suspiciousEvents || []), ...suspiciousEvents]
                .map(item => String(item))
                .filter((v, i, a) => a.indexOf(v) === i)
                .slice(-50);
            interview.suspiciousEvents = merged;
        }

        await interview.save();

        res.json({ saved: true, integrityScore: interview.integrityScore });

    } catch (error) {
        console.error("Save integrity error:", error);
        res.status(500).json({ message: "Failed to save integrity" });
    }
};

export const abandonInterview = async(req, res) => {
    try {
        const { interviewId, integrityScore, suspiciousActionsCount, suspiciousEvents } = req.body;
        const userId = getUserId(req);

        const interview = await Interview.findById(interviewId);
        if (!interview) return res.status(404).json({ message: "Interview not found" });

        if (interview.user.toString() !== userId)
            return res.status(403).json({ message: "Unauthorized interview access" });

        if (interview.status === "completed")
            return res.status(400).json({ message: "Interview already completed" });

        if (interview.status === "abandoned") {
            return res.json({ abandoned: true, interviewId: interview._id });
        }

        const incomingIntegrity = clamp(integrityScore, 0, 100);
        const currentIntegrity = typeof interview.integrityScore === "number" ? interview.integrityScore : 100;
        interview.integrityScore = Math.min(currentIntegrity, incomingIntegrity);

        const incomingCount = clamp(suspiciousActionsCount, 0, 999);
        interview.suspiciousActionsCount = Math.max(incomingCount, interview.suspiciousActionsCount || 0);

        if (Array.isArray(suspiciousEvents)) {
            interview.suspiciousEvents = [...(interview.suspiciousEvents || []), ...suspiciousEvents]
                .map(item => String(item))
                .filter((item, index, list) => list.indexOf(item) === index)
                .slice(-50);
        }

        interview.status = "abandoned";
        await interview.save();

        res.json({ abandoned: true, interviewId: interview._id });

    } catch (error) {
        console.error("Abandon interview error:", error);
        res.status(500).json({ message: "Failed to quit interview" });
    }
};

export const getInterviewResult = async(req, res) => {
    try {
        const interviewId = req.params.id;
        const userId = getUserId(req);

        const interview = await Interview.findById(interviewId);

        if (!interview)
            return res.status(404).json({ message: "Interview not found" });

        if (interview.user.toString() !== userId)
            return res.status(403).json({ message: "Unauthorized access" });

        return res.json({
            type: interview.type,
            role: interview.role,
            topic: interview.topic,
            topics: interview.topics,
            difficulty: interview.difficulty,
            questionCount: interview.questionCount,
            durationMinutes: interview.durationMinutes,
            voiceStyle: interview.voiceStyle,
            customTone: interview.customTone,
            language: interview.language,
            sessionFormat: interview.sessionFormat,
            totalScore: interview.totalScore,
            confidenceScore: interview.confidenceScore,
            communicationScore: interview.communicationScore,
            technicalAccuracyScore: interview.technicalAccuracyScore,
            integrityScore: interview.integrityScore,
            suspiciousActionsCount: interview.suspiciousActionsCount,
            suspiciousEvents: interview.suspiciousEvents,
            overallFeedback: interview.overallFeedback,
            suggestions: interview.suggestions,
            strengths: interview.strengths,
            weaknesses: interview.weaknesses,
            recommendedTopics: interview.recommendedTopics,
            status: interview.status,
            questions: interview.questions,
            answers: interview.answers,
            createdAt: interview.createdAt
        });

    } catch (error) {
        console.error("Get result error:", error);
        res.status(500).json({ message: "Failed to fetch result" });
    }
};

export const getInterviewHistory = async(req, res) => {
    try {
        const userId = getUserId(req);

        const interviews = await Interview.find({ user: userId })
            .sort({ createdAt: -1 })
            .select("_id type role topic topics difficulty questionCount durationMinutes sessionFormat createdAt totalScore integrityScore");

        res.json(interviews);

    } catch (error) {
        console.error("History error:", error);
        res.status(500).json({ message: "Failed to fetch history" });
    }
};

export const deleteInterview = async(req, res) => {
    try {
        const interviewId = req.params.id;
        const userId = getUserId(req);

        const interview = await Interview.findOneAndDelete({
            _id: interviewId,
            user: userId
        });

        if (!interview)
            return res.status(404).json({ message: "Interview not found" });

        res.json({ success: true, message: "Interview deleted successfully" });

    } catch (error) {
        console.error("Delete interview error:", error);
        res.status(500).json({ message: "Failed to delete interview" });
    }
};
