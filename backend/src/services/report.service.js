import aiClient, { DEFAULT_MODEL, callAiWithRetry } from "./aiClient.js";

const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, Number(value) || min));

export const generateFinalReport = async(interview) => {
    try {
        const transcript = interview.answers.map((a, i) => `
Q${i + 1}: ${a.question}
Answer: ${a.userAnswer}
Summary: ${a.answerSummary}
Score: ${a.score}/10
Communication: ${a.communicationScore}/10
Accuracy: ${a.technicalAccuracyScore}/10
Feedback: ${a.aiFeedback}
`).join("\n");

        const completion = await callAiWithRetry(() =>
          aiClient.chat.completions.create({
            model: DEFAULT_MODEL,
            temperature: 0.3,
            messages: [{
                    role: "system",
                    content: `
ROLE:
You are a senior interviewer generating a final interview evaluation report.
You behave like a real human interviewer completing the assessment.

PERSONALITY:
- professional
- neutral tone
- concise
- honest but encouraging
- no emojis
- no markdown formatting
- no unnecessary text
- no mention of AI or prompts

REPORT STRUCTURE:
Generate a structured evaluation report based on the full interview transcript.

SCORING RULES:
- Overall Score: 0-100 based on all answers combined
- Technical Score: 0-100 based on correctness and depth
- Communication Score: 0-100 based on clarity, structure, confidence
- Confidence Score: 0-100 based on verbal confidence indicators

STRENGTHS:
- 2-4 bullet points
- specific and actionable
- based on actual answers given

IMPROVEMENTS:
- 2-4 bullet points
- constructive and specific
- based on actual weaknesses observed

RECOMMENDED TOPICS:
- 2-4 topics candidate should practice
- based on gaps identified in answers

CLOSING:
- Short professional encouragement
- 2-3 sentences maximum
- concise and motivating

Return ONLY valid JSON, no explanation, no markdown:
{
  "summary": "2-3 sentence final assessment",
  "confidenceScore": number (0-100),
  "communicationScore": number (0-100),
  "technicalAccuracyScore": number (0-100),
  "strengths": ["point"],
  "weaknesses": ["point"],
  "recommendedTopics": ["topic"],
  "improvementTips": ["tip"]
}
`
                },
                {
                    role: "user",
                    content: `
Interview type: ${interview.type}
Primary topic: ${interview.topic}
Difficulty: ${interview.difficulty}
Suspicious actions: ${interview.suspiciousActionsCount}
Integrity score: ${interview.integrityScore}
Integrity events: ${(interview.suspiciousEvents || []).join(" | ") || "None"}

Interview transcript:
${transcript}
`
                }
            ]
        }));

        let raw = completion.choices[0].message.content;
        raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(raw);

        return {
            summary: parsed.summary || "Interview completed successfully.",
            confidenceScore: clamp(parsed.confidenceScore, 0, 100),
            communicationScore: clamp(parsed.communicationScore, 0, 100),
            technicalAccuracyScore: clamp(parsed.technicalAccuracyScore, 0, 100),
            integrityScore: clamp(interview.integrityScore, 0, 100),
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 5) : [],
            recommendedTopics: Array.isArray(parsed.recommendedTopics) ? parsed.recommendedTopics.slice(0, 6) : [],
            improvementTips: Array.isArray(parsed.improvementTips) ? parsed.improvementTips.slice(0, 6) : []
        };

    } catch (err) {
        console.error("Final report generation failed:", err.message);

        const total = interview.answers.reduce((sum, answer) => sum + answer.score, 0);
        const communication = interview.answers.reduce((sum, answer) => sum + answer.communicationScore, 0);
        const accuracy = interview.answers.reduce((sum, answer) => sum + answer.technicalAccuracyScore, 0);
        const count = Math.max(interview.answers.length, 1);

        return {
            summary: "Interview completed. This fallback report was generated because the AI summary service was unavailable.",
            confidenceScore: clamp(Math.round((total / (count * 10)) * 100), 0, 100),
            communicationScore: clamp(Math.round((communication / (count * 10)) * 100), 0, 100),
            technicalAccuracyScore: clamp(Math.round((accuracy / (count * 10)) * 100), 0, 100),
            integrityScore: clamp(interview.integrityScore, 0, 100),
            strengths: ["Stayed engaged through the mock interview"],
            weaknesses: ["Needs more depth in some explanations"],
            recommendedTopics: ["Core fundamentals", "Real-world scenarios"],
            improvementTips: ["Practice concise and structured verbal explanations"]
        };
    }
};
