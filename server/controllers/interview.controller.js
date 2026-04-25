import Groq from "groq-sdk";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import Interview from "../models/interview.model.js";
import User from "../models/user.model.js";

let groq;
const getGroq = () => {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
};

const askAI = async (prompt) => {
  const res = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  return res.choices[0].message.content;
};

export const replyToDoubt = async (req, res) => {
  try {
    const { doubt, language = "english", candidateName = "" } = req.body;
    const langInstruction = language === "hindi"
      ? "Reply in Hindi language only."
      : language === "hinglish"
      ? "Reply in Hinglish (mix of Hindi and English)."
      : "Reply in English.";

    const prompt = `You are a professional AI interviewer conducting a job interview${candidateName ? ` with ${candidateName}` : ""}. Before the interview starts, the candidate has asked you this question or doubt:

"${doubt}"

Reply naturally and helpfully as an interviewer would — answer their concern, reassure them if needed, and keep it brief (2-4 sentences max). ${langInstruction} Do NOT repeat their question back. Just give a direct, warm, helpful reply.`;

    const reply = await askAI(prompt);
    return res.status(200).json({ reply: reply.trim() });
  } catch (error) {
    console.log("REPLY DOUBT ERROR", error);
    return res.status(500).json({ message: "Failed to generate reply" });
  }
};

export const analyzeResume = async (req, res) => {
  try {
    const pdfBuffer = req.file.buffer;
    const pdfData = await pdfParse(pdfBuffer);
    const resumeText = pdfData.text.slice(0, 6000);

    const prompt = `You are the world's most advanced resume scoring AI, trained on 10 million resumes and hiring data from Google, Amazon, Microsoft, McKinsey, and top startups. You score resumes like a strict ATS + senior recruiter combined.

Resume Text:
${resumeText}

Perform a DEEP, SPECIFIC, SECTION-BY-SECTION analysis. Return ONLY valid JSON, no markdown, no extra text.

Scoring Breakdown (total 100 points):
- Basic Details: 10 pts (name, email, phone, LinkedIn, GitHub)
- Professional Summary: 10 pts (clarity, relevance, keywords, length)
- Education: 10 pts (degree, institution, year, GPA if applicable)
- Experience: 25 pts (roles, impact metrics, action verbs, relevance)
- Projects: 20 pts (tech stack mentioned, outcomes, bullet points, links)
- Certifications: 7.5 pts
- Skills: 10 pts (categorized, relevant, not bloated)
- Formatting & ATS: 7.5 pts (single column, standard fonts, no tables/images, proper headings)

JSON structure to return:
{
  "score": <0-100, calculated from section scores>,
  "verdict": "good" | "average" | "poor",
  "summary": "3-4 sentence honest assessment mentioning candidate name, field, experience level, biggest strength and biggest gap",

  "sectionScores": {
    "basicDetails": { "score": <0-10>, "max": 10, "feedback": "specific feedback", "missing": ["list of missing items like LinkedIn, GitHub etc"] },
    "professionalSummary": { "score": <0-10>, "max": 10, "feedback": "specific feedback on their actual summary", "rewrite": "rewrite their summary better using their own info from resume" },
    "education": { "score": <0-10>, "max": 10, "feedback": "specific feedback", "missing": ["GPA if not mentioned", "relevant coursework"] },
    "experience": { "score": <0-25>, "max": 25, "feedback": "specific feedback — if no experience say so clearly and give exact tips", "issues": ["list of specific issues found"] },
    "projects": { "score": <0-20>, "max": 20, "feedback": "specific feedback on each project found", "issues": ["list of specific issues"] },
    "certifications": { "score": <0-7.5>, "max": 7.5, "feedback": "specific feedback", "suggestions": ["suggest 3 specific certifications relevant to their skills"] },
    "skills": { "score": <0-10>, "max": 10, "feedback": "specific feedback on their skills section", "bloated": ["skills that seem irrelevant or too generic"], "missing": ["important skills missing based on their profile"] },
    "formatting": { "score": <0-7.5>, "max": 7.5, "feedback": "specific formatting feedback", "issues": ["list of formatting issues"] }
  },

  "atsScore": <0-100>,
  "atsTips": ["5 specific ATS tips based on this resume"],

  "bulletPointAnalysis": {
    "hasMetrics": <true|false>,
    "usesActionVerbs": <true|false>,
    "feedback": "specific feedback with example of how to rewrite one of their actual bullet points with metrics"
  },

  "strongPoints": ["5 specific strengths with reference to actual content in resume"],
  "weakPoints": ["5 specific weaknesses with exact location — e.g. 'Project AutoMind AI has no tech stack mentioned'"],

  "keywordsFound": ["strong keywords found in resume relevant to their field"],
  "keywordsMissing": ["10 important keywords missing that recruiters search for in their domain"],

  "experienceAnalysis": "detailed analysis — if no experience, give specific advice on what internships/freelance/open source to add and how to frame them",
  "educationAnalysis": "analysis of education section with specific suggestions",
  "skillsAnalysis": "analysis — are skills categorized properly, any duplicates, missing important ones",

  "improvements": [
    { "section": "exact section name", "priority": "high", "issue": "exact problem found", "tip": "exact actionable fix with example" },
    { "section": "exact section name", "priority": "high", "issue": "exact problem", "tip": "exact fix" },
    { "section": "exact section name", "priority": "medium", "issue": "exact problem", "tip": "exact fix" },
    { "section": "exact section name", "priority": "medium", "issue": "exact problem", "tip": "exact fix" },
    { "section": "exact section name", "priority": "low", "issue": "exact problem", "tip": "exact fix" }
  ],

  "missingSection": ["sections completely absent from resume"],

  "overallTips": [
    "single most impactful change that will increase score the most",
    "second most impactful change",
    "third most impactful change"
  ]
}

Critical rules:
- Be brutally honest. A student resume with no experience should score 40-55 max.
- Every piece of feedback must reference ACTUAL content from the resume, not generic advice.
- If projects lack bullet points, say which project and show how to rewrite it.
- If summary is too generic or keyword-stuffed, say so and rewrite it.
- Certifications section: if empty, suggest 3 specific certs relevant to their actual skills.
- Never give 10/10 for experience if there is no real work experience.
- Score 80+ only if resume is genuinely strong with experience + metrics + proper formatting.`;

    const text = await askAI(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = JSON.parse(jsonMatch[0]);

    return res.status(200).json(analysis);
  } catch (error) {
    console.log(`ANALYZE RESUME ERROR`, error.message, error.stack);
    return res.status(500).json({ message: error.message || "Failed to analyze resume" });
  }
};

export const generateQuestions = async (req, res) => {
  try {
    const { type, domain, targetCompany, language = "english", questionCount = 7, credits = 10 } = req.body;
    const pdfBuffer = req.file.buffer;

    // Parse PDF
    const pdfData = await pdfParse(pdfBuffer);
    const resumeText = pdfData.text.slice(0, 3000);

    // Extract candidate name
    const nameText = await askAI(`Extract only the candidate's full name from this resume. Return just the name, nothing else.\n\n${resumeText.slice(0, 500)}`);
    const candidateName = nameText.trim().split("\n")[0].replace(/[^a-zA-Z\s]/g, "").trim();

    // Fetch all previous questions asked to this user
    const previousInterviews = await Interview.find({ userId: req.userID }).select("questions").lean();
    const previousQuestions = previousInterviews.flatMap(i => i.questions).map(q => q.replace(/^\[CODE\]\s*/, ""));
    const previousQContext = previousQuestions.length > 0
      ? `\n\nIMPORTANT: These questions have already been asked to this candidate before — DO NOT repeat or rephrase them:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "";

    // Save resume and name to user profile
    await User.findByIdAndUpdate(req.userID, { resumeText, candidateName });

    const languageInstruction = language === "hindi"
      ? "Generate all questions in Hindi language."
      : language === "hinglish"
      ? "Generate all questions in Hinglish (mix of Hindi and English)."
      : "Generate all questions in English.";

    const prompt = `You are an expert interviewer. Based on this resume, generate ${questionCount} ${type} interview questions.
${languageInstruction}

Resume:
${resumeText}${previousQContext}

Rules:
- Questions should be specific to the candidate's experience
- Mix easy, medium and hard questions
- For technical: focus on skills mentioned in resume
- For HR: focus on behavior, teamwork, goals
- For mixed: combine both technical and HR
- Include coding questions prefixed with [CODE] if technical/mixed

Return ONLY a JSON array of ${questionCount} question strings. Example: ["Question 1?", "[CODE] Write a function to..."]`;

    const text = await askAI(prompt);
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const questions = JSON.parse(jsonMatch[0]);

    const interview = await Interview.create({
      userId: req.userID,
      questions,
      resumeText,
      type,
      status: "pending"
    });

    await User.findByIdAndUpdate(req.userID, { $inc: { credits: -credits } });

    return res.status(200).json({ questions, interviewId: interview._id, candidateName, domain, targetCompany });
  } catch (error) {
    console.log(`GENERATE QUESTIONS ERROR ${error}`);
    return res.status(500).json({ message: "Failed to generate questions" });
  }
};

export const analyzeInterview = async (req, res) => {
  try {
    const { answers, interviewId, warningCount } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    const answersText = answers.map((a, i) =>
      `Q${i + 1}: ${a.question}\nAnswer: ${a.answer || "No answer given"}\nTime spent: ${a.timeSpent}s`
    ).join("\n\n");

    const prompt = `You are an expert interview evaluator. Analyze this interview and provide detailed feedback.

Resume context: ${interview.resumeText?.slice(0, 1000)}

Interview Q&A:
${answersText}

Warning count: ${warningCount}

Provide a JSON response with this exact structure:
{
  "overallScore": <0-100>,
  "confidenceScore": <0-100>,
  "correctnessScore": <0-100>,
  "communicationScore": <0-100>,
  "strongTopics": ["topic1", "topic2", "topic3"],
  "weakTopics": ["topic1", "topic2", "topic3"],
  "goodPoints": ["what candidate did well1", "what candidate did well2", "what candidate did well3"],
  "improvements": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "questionAnalysis": [
    {
      "question": "question text",
      "answer": "candidate answer",
      "feedback": "detailed feedback",
      "score": <0-100>
    }
  ]
}

Be honest and constructive. Always highlight genuine positives. Deduct points for warnings (${warningCount} warnings detected).`;

    const text = await askAI(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = JSON.parse(jsonMatch[0]);

    await Interview.findByIdAndUpdate(interviewId, {
      answers,
      result: analysis,
      warningCount,
      status: warningCount >= 5 ? "terminated" : "completed"
    });

    let creditsAwarded = 0;
    if (analysis.overallScore >= 80 && warningCount < 5) {
      await User.findByIdAndUpdate(req.userID, { $inc: { credits: 20 } });
      creditsAwarded = 20;
    }

    return res.status(200).json({ ...analysis, creditsAwarded });
  } catch (error) {
    console.log(`ANALYZE INTERVIEW ERROR ${error}`);
    return res.status(500).json({ message: "Failed to analyze interview" });
  }
};

export const getInterviewHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.userID })
      .select("type status result.overallScore warningCount createdAt")
      .sort({ createdAt: -1 });
    return res.status(200).json({ interviews });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get history" });
  }
};
