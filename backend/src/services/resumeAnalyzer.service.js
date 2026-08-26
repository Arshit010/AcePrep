import aiClient, { DEFAULT_MODEL, callAiWithRetry } from "./aiClient.js";

const COMPREHENSIVE_SKILL_DICTIONARY = [
    // Languages & Syntax
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "Go", "Rust",
    "PHP", "Ruby", "Swift", "Kotlin", "R", "SQL", "HTML", "CSS", "HTML5", "CSS3",
    "Bash", "Shell", "PowerShell", "Dart", "Scala", "Perl",

    // Web Frameworks & Frontend
    "React", "React.js", "ReactJS", "Redux", "Next.js", "Vue", "Vue.js", "Angular",
    "Tailwind", "TailwindCSS", "Bootstrap", "Sass", "Webpack", "Vite",
    "jQuery", "Material UI", "Chakra UI", "Svelte",

    // Backend & APIs
    "Node.js", "NodeJS", "Node", "Express", "Express.js", "Django", "Flask",
    "FastAPI", "Spring Boot", "Spring", "ASP.NET", ".NET", "Ruby on Rails",
    "NestJS", "REST API", "GraphQL", "Microservices", "WebSockets",

    // Databases & Storage
    "MongoDB", "PostgreSQL", "Postgres", "MySQL", "SQLite", "Redis", "Oracle",
    "Firebase", "Supabase", "DynamoDB", "Cassandra", "Elasticsearch", "Prisma",
    "Mongoose", "Sequelize",

    // DevOps, Cloud & Tools
    "Docker", "Kubernetes", "AWS", "Amazon Web Services", "Azure", "GCP",
    "Google Cloud", "Git", "GitHub", "GitLab", "CI/CD", "Jenkins", "Nginx",
    "Linux", "Terraform", "Postman", "Vercel", "Netlify",

    // Data Science, ML & AI
    "Machine Learning", "Deep Learning", "Artificial Intelligence", "AI",
    "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-Learn", "OpenCV",
    "NLP", "Data Analysis", "Data Visualization", "Tableau", "Power BI",

    // Concepts & Soft Skills
    "Object-Oriented Programming", "OOP", "Data Structures", "Algorithms",
    "System Design", "Agile", "Scrum", "Problem Solving", "Communication",
    "Team Leadership", "Project Management", "UI/UX Design", "Figma"
];

function extractKeywordsFromText(resumeText) {
    if (!resumeText || typeof resumeText !== "string") return [];
    const textLower = resumeText.toLowerCase();
    const foundTech = new Set();

    for (const kw of COMPREHENSIVE_SKILL_DICTIONARY) {
        const kwLower = kw.toLowerCase();
        if (textLower.includes(kwLower)) {
            foundTech.add(kw);
        }
    }
    return Array.from(foundTech);
}

function extractProjectsFromText(resumeText) {
    if (!resumeText || typeof resumeText !== "string") return [];
    const lines = resumeText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const projects = [];

    for (const line of lines) {
        if (/^[•\-\*]\s*([A-Z0-9].{3,80})/i.test(line) || /^[0-9]\.\s*([A-Z0-9].{3,80})/i.test(line)) {
            const cleanLine = line.replace(/^[•\-\*\d\.]+\s*/, '').trim();
            if (cleanLine.length > 8 && cleanLine.length < 90) {
                projects.push({
                    name: cleanLine.slice(0, 60),
                    description: "Candidate project extracted from resume",
                    tech_stack: []
                });
            }
        }
    }
    return projects.slice(0, 4);
}

/* ---------------- SAFE JSON EXTRACTOR ---------------- */
function extractJSON(text) {
    if (!text) return null;

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1) return null;

    try {
        return JSON.parse(text.slice(start, end + 1));
    } catch {
        return null;
    }
}


function normalizeProjects(projects, fallbackProjects = []) {
    const list = Array.isArray(projects) && projects.length > 0 ? projects : fallbackProjects;
    if (!Array.isArray(list)) return [];

    return list.map(p => ({
        name: String(p?.name || "Project"),
        description: String(p?.description || ""),
        tech_stack: Array.isArray(p?.tech_stack) ? p.tech_stack.map(t => String(t)) : []
    }));
}


function fallbackProfile(keywordFallback = [], projectFallback = []) {
    const tech = keywordFallback.length > 0 ? keywordFallback : ["JavaScript", "HTML/CSS", "SQL", "Git", "Web Technologies"];
    const skills = keywordFallback.length > 0 ? keywordFallback.slice(0, 8) : ["Problem Solving", "Software Engineering", "Analytical Thinking", "Communication", "Git"];

    return {
        role: "Software Developer",
        experience_level: "fresher",
        skills: skills,
        technologies: tech,
        projects: normalizeProjects([], projectFallback)
    };
}


export const analyzeResume = async(resumeText) => {
    if (!resumeText || typeof resumeText !== "string") {
        return fallbackProfile();
    }

    const keywordFallback = extractKeywordsFromText(resumeText);
    const projectFallback = extractProjectsFromText(resumeText);

    const prompt = `
Analyze this candidate resume text and extract the candidate profile into JSON:

{
  "role": "e.g. Software Developer, Full Stack Engineer, Frontend Developer, Backend Engineer, Data Analyst",
  "experience_level": "fresher | junior | mid | senior",
  "skills": ["technical and soft skills"],
  "technologies": ["languages, frameworks, databases, libraries, tools"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Short project summary",
      "tech_stack": ["tech used"]
    }
  ]
}

Instructions:
- Extract all programming languages, web technologies, frameworks, tools, soft skills, and projects present.
- Return ONLY valid raw JSON without markdown text wrapper.

Resume Content:
${resumeText.slice(0, 12000)}
`;

    try {
        const res = await callAiWithRetry(() =>
            aiClient.chat.completions.create({
                model: DEFAULT_MODEL,
                temperature: 0.1,
                messages: [{ role: "user", content: prompt }]
            })
        );

        const raw = res.choices?.[0]?.message?.content;
        const parsed = extractJSON(raw);

        if (!parsed) {
            console.log("AI returned non-JSON response, using keyword and section fallback");
            return fallbackProfile(keywordFallback, projectFallback);
        }

        const aiTech = Array.isArray(parsed.technologies) ? parsed.technologies.map(t => String(t).trim()).filter(Boolean) : [];
        const mergedTech = [...new Set([...aiTech, ...keywordFallback])];
        const finalTech = mergedTech.length > 0 ? mergedTech : ["JavaScript", "HTML/CSS", "SQL", "Git", "Web Development"];

        const aiSkills = Array.isArray(parsed.skills) ? parsed.skills.map(s => String(s).trim()).filter(Boolean) : [];
        const mergedSkills = [...new Set([...aiSkills, ...finalTech.slice(0, 6)])];
        const finalSkills = mergedSkills.length > 0 ? mergedSkills : ["Problem Solving", "Software Engineering", "Analytical Thinking", "Git", "Communication"];

        return {
            role: String(parsed.role || "Software Developer").trim(),
            experience_level: String(parsed.experience_level || "fresher").trim(),
            skills: finalSkills,
            technologies: finalTech,
            projects: normalizeProjects(parsed.projects, projectFallback)
        };

    } catch (err) {
        console.error("AI RESUME ANALYSIS EXCEPTION:", err.message);
        return fallbackProfile(keywordFallback, projectFallback);
    }
};