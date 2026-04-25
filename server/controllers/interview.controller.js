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

export const analyzeResume = async (req, res) => {
  try {
    const pdfBuffer = req.file.buffer;
    const pdfData = await pdfParse(pdfBuffer);
    const resumeText = pdfData.text.slice(0, 3000);

    const prompt = `You are an expert HR recruiter and resume reviewer. Analyze this resume and give honest feedback.

Resume:
${resumeText}

Provide a JSON response with this exact structure:
{
  "score": <0-100>,
  "verdict": "good" | "average" | "poor",
  "summary": "2-3 line overall summary",
  "missingSection": ["section1", "section2"],
  "weakPoints": ["weakness1", "weakness2", "weakness3"],
  "strongPoints": ["strength1", "strength2", "strength3"],
  "improvements": [
    { "section": "section name", "tip": "what to improve and how" }
  ],
  "atsScore": <0-100>,
  "atsTips": ["tip1", "tip2", "tip3"]
}

Be very honest. If resume is poor, say so clearly.`;

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
    const { type, domain, targetCompany, language = "english", questionCount = 7 } = req.body;
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

    await User.findByIdAndUpdate(req.userID, { $inc: { credits: -10 } });

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
