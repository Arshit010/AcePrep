import Feedback from "../models/Feedback.js";
import Interview from "../models/Interview.js";


/* SUBMIT FEEDBACK*/
export const submitFeedback = async(req, res) => {
    try {
        const userId = req.user?._id;
        const { interviewId, rating, comment } = req.body;


        if (!interviewId || !rating) {
            return res.status(400).json({ message: "Interview and rating are required" });
        }


        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }


        if (interview.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized feedback attempt" });
        }


        const feedback = await Feedback.create({
            user: userId,
            interview: interviewId,
            rating,
            comment
        });

        res.status(201).json({
            message: "Feedback submitted successfully",
            feedback
        });

    } catch (error) {
        console.error("Feedback submit error:", error);
        res.status(500).json({ message: "Failed to submit feedback" });
    }
};



/* GET MY FEEDBACKS */
export const getMyFeedbacks = async(req, res) => {
    try {
        const userId = req.user?._id;

        const feedbacks = await Feedback.find({ user: userId })
            .populate("interview", "role difficulty totalScore status createdAt")
            .sort({ createdAt: -1 });

        res.json(feedbacks);

    } catch (error) {
        console.error("Fetch feedback error:", error);
        res.status(500).json({ message: "Failed to fetch feedbacks" });
    }
};



export const getInterviewFeedback = async(req, res) => {
    try {
        const userId = req.user?._id?.toString() || req.user?.id;
        const { interviewId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const feedback = await Feedback.findOne({ interview: interviewId })
            .populate("user", "name email");

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        const feedbackUserId = feedback.user?._id ? feedback.user._id.toString() : feedback.user.toString();
        if (feedbackUserId !== userId.toString()) {
            return res.status(403).json({ message: "Forbidden" });
        }

        res.json(feedback);

    } catch (error) {
        console.error("Fetch interview feedback error:", error);
        res.status(500).json({ message: "Failed to fetch feedback" });
    }
};