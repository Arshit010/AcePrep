import aiClient, { DEFAULT_MODEL, callAiWithRetry } from "./aiClient.js";

const sanitizeReviewLine = (value, fallback = "") => {
    const text = String(value || fallback)
        .replace(/\?/g, ".")
        .replace(/\s+/g, " ")
        .trim();

    return text || fallback;
};

export const evaluateAnswer = async(question, userAnswer) => {
    try {
        const completion = await callAiWithRetry(() =>
          aiClient.chat.completions.create({
            model: DEFAULT_MODEL,
            temperature: 0.2,

            messages: [{
                    role: "system",
                    content: `
ROLE:
You are an experienced human interviewer giving a brief review of a spoken candidate response.

EVALUATION CRITERIA:
- technical correctness
- clarity of explanation
- logical reasoning
- completeness of answer
- communication quality
- confidence indicators

PERSONALITY:
- professional
- neutral tone
- concise
- constructive
- honest but encouraging
- no emojis
- no markdown
- no unnecessary text

CRITICAL RULES:
- You are ONLY reviewing the candidate's answer. You must NOT ask any questions.
- Do NOT include follow-up questions, clarifying questions, or any kind of question in your response.
- Do NOT phrase any feedback as a question.
- Every field must be a declarative statement, never interrogative.
- summary must be a single sentence, maximum 20 words
- summary must capture the main idea of the candidate's answer
- feedback must be maximum 12 words, a statement not a question
- feedback must be constructive and actionable
- encouragement must sound human and supportive, maximum 14 words
- feedbackHighlights must contain 2 or 3 short on-the-spot coaching statements
- idealAnswer must be a short note on what was missing, not the full answer
- never reveal the complete correct answer
- never output long paragraphs
- never ask the candidate anything

Return ONLY valid JSON, no explanation, no markdown:
{
  "score": number (0-10),
  "communicationScore": number (0-10),
  "technicalAccuracyScore": number (0-10),
  "summary": "one line summary of candidate answer under 20 words",
  "feedback": "short improvement suggestion under 12 words, must not be a question",
  "encouragement": "short human-like reaction under 14 words",
  "feedbackHighlights": ["short coaching statement", "short coaching statement"],
  "idealAnswer": "short note on what was missing"
}
`
                },
                {
                    role: "user",
                    content: `
Question: ${question}
Candidate Answer: ${userAnswer}
`
                }
            ]
        }));

        let raw = completion.choices[0].message.content;
        raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(raw);

        return {
            score: Number(parsed.score) || 0,
            communicationScore: Number(parsed.communicationScore) || 0,
            technicalAccuracyScore: Number(parsed.technicalAccuracyScore) || 0,
            summary: sanitizeReviewLine(parsed.summary),
            feedback: sanitizeReviewLine(parsed.feedback, "No feedback"),
            encouragement: sanitizeReviewLine(parsed.encouragement, "Thanks. Let's keep going."),
            feedbackHighlights: Array.isArray(parsed.feedbackHighlights) ?
                parsed.feedbackHighlights.slice(0, 3).map((item) => sanitizeReviewLine(item)).filter(Boolean) :
                [],
            idealAnswer: sanitizeReviewLine(parsed.idealAnswer),
            followUp: "",
            missing: parsed.missing || []
        };

    } catch (err) {
        console.error("Answer evaluation failed:", err.message);

        return {
            score: 0,
            communicationScore: 0,
            technicalAccuracyScore: 0,
            summary: "",
            feedback: "Evaluation failed.",
            encouragement: "Thanks. Let's move ahead.",
            feedbackHighlights: [],
            idealAnswer: "",
            followUp: "",
            missing: []
        };
    }
};
