import aiClient, { DEFAULT_MODEL, callAiWithRetry } from "./aiClient.js";

const topicCoverageMap = {
    dsa: "arrays, linked lists, stacks, queues, trees, graphs, dynamic programming, greedy algorithms",
    "operating systems": "processes, threads, CPU scheduling, synchronization, memory management, paging, deadlocks, file systems",
    "computer networks": "OSI/TCP-IP layers, routing, switching, DNS, HTTP/HTTPS, TCP vs UDP, congestion, sockets",
    dbms: "normalization, indexing, transactions, ACID, joins, query optimization, concurrency control, locking",
    javascript: "closures, event loop, promises, async-await, scopes, prototypes, DOM events, performance",
    react: "state, props, hooks, rendering, lifecycle, context, performance, APIs, security",
    cybersecurity: "authentication, authorization, OWASP, encryption, network security, threat models, incident response",
    hr: "behavioral communication, teamwork, conflict resolution, leadership, accountability, failure recovery, motivation",
    "hr questions": "behavioral communication, teamwork, conflict resolution, leadership, accountability, failure recovery, motivation",
    "web development": "HTML, CSS, JavaScript, React, APIs, authentication, browser behavior, security"
};

function isSimilar(q1, q2) {
    const a = q1.toLowerCase().replace(/[^\w\s]/g, "");
    const b = q2.toLowerCase().replace(/[^\w\s]/g, "");
    return a.includes(b.slice(0, 25)) || b.includes(a.slice(0, 25));
}

function filterDuplicates(previousQuestions, questions) {
    if (!previousQuestions.length) return questions;
    return questions.filter(q =>
        !previousQuestions.some(prev => isSimilar(prev, q))
    );
}

function resolveTopicCoverage(topic) {
    const normalized = String(topic || "").toLowerCase().trim();
    return topicCoverageMap[normalized] || "core concepts, practical scenarios, debugging, design decisions, and real world tradeoffs";
}

function randomSeedPhrase() {
    const angles = [
        "Focus on real-world debugging scenarios this time.",
        "Emphasize tradeoff analysis and decision-making.",
        "Prioritize system design and architecture thinking.",
        "Lean into edge cases and failure modes.",
        "Ask questions that test problem decomposition.",
        "Include a question about performance optimization.",
        "Explore practical coding and implementation.",
        "Focus on conceptual clarity and fundamentals.",
        "Ask about common mistakes and how to avoid them.",
        "Test the candidate's ability to explain things simply.",
        "Include a question on scalability considerations.",
        "Ask about team collaboration and code review.",
        "Explore testing strategies and quality assurance.",
        "Focus on API design and integration patterns.",
        "Emphasize security awareness and best practices."
    ];

    const shuffled = angles.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2).join(" ");
}

function createFallbackQuestions(subject, difficulty, count) {
    const warmups = {
        easy: [
            `To get us started, what does ${subject} mean in simple terms?`,
            `Let's begin with the basics. Why does ${subject} matter in practice?`
        ],
        medium: [
            `To start us off, how would you explain the core idea behind ${subject} to a teammate?`,
            `Let's begin with a practical one. Where does ${subject} usually create tradeoffs?`
        ],
        hard: [
            `Let's start with a realistic scenario. Where can ${subject} fail under pressure?`,
            `To open, what is the hardest tradeoff you usually face in ${subject}?`
        ]
    };

    const deeper = [
        `Walk me through a realistic scenario where ${subject} breaks down and how you would respond.`,
        `What tradeoffs would you evaluate before choosing an approach in ${subject}?`,
        `Describe a mistake a candidate might make in ${subject} and how you would correct it.`,
        `How would you explain your decision-making if two valid approaches to ${subject} both seem reasonable?`,
        `What signal would tell you that your current approach to ${subject} is not scaling well?`
    ];

    return [...(warmups[difficulty] || warmups.medium), ...deeper].slice(0, count);
}

export const generateInterviewQuestions = async(input, difficulty = "medium", questionCount = 5, previousQuestions = []) => {
    try {
        const safeQuestionCount = Math.max(1, Math.min(Number(questionCount) || 5, 12));

        const interviewerSystemPrompt = `
ROLE:
You are an AI Interviewer conducting a real-time professional interview.
You behave like an experienced human interviewer.

PRIMARY GOAL:
Generate structured, realistic interview questions that a real interviewer would ask.

PERSONALITY:
- professional
- neutral tone
- concise
- respectful
- slightly challenging
- human-like conversational flow
- avoids robotic phrasing
- avoids emojis
- avoids unnecessary text

COMMUNICATION STYLE:
- one question at a time
- short sentences
- natural phrasing
- realistic interview pacing
- no long paragraphs
- no storytelling
- no unnecessary explanations
- no repetition

DIFFICULTY LOGIC:

easy:
- basic definitions
- simple explanations
- purpose of a concept

medium:
- applied concepts
- comparisons
- reasoning questions
- tradeoffs
- choosing between approaches

hard:
- problem solving
- edge cases
- optimization concepts
- tradeoffs
- real-world scenarios
- failure scenarios
- debugging under pressure
- system behavior under stress
- FAANG-level demanding questions

YOU MUST STRICTLY FOLLOW THE SELECTED DIFFICULTY.

QUESTION RULES:
- avoid multi-part questions
- avoid very long questions
- avoid theoretical essays
- avoid irrelevant questions
- avoid repeating previous questions
- questions must sound like a real human interviewer speaking
- questions must be clear, unambiguous, and concise
- start with a concise warm-up question, then go deeper
- do not reveal answers

ANTI-REPETITION:
Each interview MUST feel completely different from previous ones.
Avoid famous textbook phrasing.
Use fresh angles, creative scenarios, and different subtopics every time.
${randomSeedPhrase()}

Generate EXACTLY ${safeQuestionCount} questions.

Return ONLY JSON:
[
  {"question":"..."},
  {"question":"..."}
]
`;

        const exclusionBlock = previousQuestions.length
            ? `\n\nDO NOT ask any of these previously asked questions (or anything too similar):\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nGenerate completely fresh questions that cover different angles and subtopics.`
            : "";

        let messages;

        if (typeof input === "string") {
            messages = [
                { role: "system", content: interviewerSystemPrompt },
                {
                    role: "user",
                    content: `Topic: ${input}\nDifficulty: ${difficulty}\nCoverage: ${resolveTopicCoverage(input)}\nMake the questions unique, creative, and completely new.${exclusionBlock}`
                }
            ];
        } else if (input?.mode === "video_topic") {
            messages = [
                { role: "system", content: interviewerSystemPrompt },
                {
                    role: "user",
                    content: `
Session Mode: Video interview
Primary Topic: ${input.topic}
Focus Topics: ${input.topics?.join(", ")}
Difficulty: ${difficulty}
Number of Questions: ${safeQuestionCount}
Interview Duration: ${input.durationMinutes || 10} minutes
Language: ${input.language || "English"}

Coverage Expectations:
${input.topics?.map(topic => `- ${topic}: ${resolveTopicCoverage(topic)}`).join("\n")}

Build a realistic interviewer-led sequence.
Start with a concise warm-up question, then go deeper.
Sound calm, professional, and interviewer-like.
Do not reveal answers.
Adapt question depth based on topic coverage.${exclusionBlock}
`
                }
            ];
        } else {
            messages = [
                { role: "system", content: interviewerSystemPrompt },
                {
                    role: "user",
                    content: `
Candidate Profile:
Role: ${input.role}
Experience: ${input.experience_level}
Skills: ${input.skills?.join(", ")}
Technologies: ${input.technologies?.join(", ")}
Projects: ${input.projects?.join(", ")}

Difficulty: ${difficulty}

Ask questions relevant to this person specifically.${exclusionBlock}
`
                }
            ];
        }

        const completion = await callAiWithRetry(() =>
          aiClient.chat.completions.create({
            model: DEFAULT_MODEL,
            temperature: 0.95,
            top_p: 0.95,
            frequency_penalty: 0.9,
            presence_penalty: 0.9,
            messages,
          })
        );

        const raw = completion.choices[0].message.content;
        const jsonMatch = raw.match(/\[[\s\S]*\]/);

        if (!jsonMatch) throw new Error("AI returned non JSON");

        let parsed = JSON.parse(jsonMatch[0]).map(q => q.question);

        parsed = filterDuplicates(previousQuestions, parsed);

        if (parsed.length < safeQuestionCount) {
            const subject = typeof input === "string" ? input : input?.mode === "video_topic" ? input.topic : input.role;
            parsed = [...parsed, ...createFallbackQuestions(subject, difficulty, safeQuestionCount)].slice(0, safeQuestionCount);
        }

        return parsed.slice(0, safeQuestionCount);

    } catch (err) {
        console.error("Question generation failed:", err.message);
        throw new Error("AI question generation failed");
    }
};
