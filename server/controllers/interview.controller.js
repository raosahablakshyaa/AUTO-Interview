import Groq from "groq-sdk";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import Interview from "../models/interview.model.js";
import User from "../models/user.model.js";

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const askAI = async (prompt, maxTokens = 950, jsonMode = false) => {
  const res = await getGroq().chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: maxTokens,
    ...(jsonMode ? { reasoning_effort: "low" } : {}),
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });
  const choice = res.choices[0];
  if (choice?.finish_reason === "length") {
    throw new Error("AI response exceeded the completion token limit");
  }
  const content = choice?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI returned an empty response");
  }
  return content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
};

const parseJsonObject = (text) => {
  const parsed = JSON.parse(text);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI response must be a JSON object");
  }
  return parsed;
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
    const resumeText = pdfData.text.slice(0, 2000);

    const prompt1 = `Analyze this resume. Return ONLY valid JSON, no markdown.
Resume: ${resumeText}
JSON: {"score":0,"verdict":"good","summary":"s","atsScore":0,"atsTips":["t"],"strongPoints":["s"],"weakPoints":["w"],"keywordsFound":["k"],"keywordsMissing":["k"],"overallTips":["t"],"missingSection":[]}`;

    const prompt2 = `Analyze this resume. Return ONLY valid JSON, no markdown.
Resume: ${resumeText}
JSON: {"experienceAnalysis":"s","educationAnalysis":"s","skillsAnalysis":"s","bulletPointAnalysis":{"hasMetrics":true,"usesActionVerbs":true,"feedback":"s"},"improvements":[{"section":"s","priority":"high","issue":"s","tip":"s"}],"sectionScores":{"basicDetails":{"score":0,"max":10,"feedback":"s","missing":[]},"professionalSummary":{"score":0,"max":10,"feedback":"s","rewrite":"s"},"education":{"score":0,"max":10,"feedback":"s","missing":[]},"experience":{"score":0,"max":25,"feedback":"s","issues":[]},"projects":{"score":0,"max":20,"feedback":"s","issues":[]},"certifications":{"score":0,"max":7,"feedback":"s","suggestions":[]},"skills":{"score":0,"max":10,"feedback":"s","missing":[]},"formatting":{"score":0,"max":8,"feedback":"s","issues":[]}}}`;

    const [text1, text2] = await Promise.all([
      askAI(prompt1, 4096, true),
      askAI(prompt2, 4096, true),
    ]);
    const analysis = { ...parseJsonObject(text1), ...parseJsonObject(text2) };

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

Return ONLY a JSON object with a "questions" array containing ${questionCount} question strings. Example: {"questions":["Question 1?", "[CODE] Write a function to..."]}`;

    const text = await askAI(prompt, 4096, true);
    const response = parseJsonObject(text);
    const questions = response.questions;
    if (!Array.isArray(questions) || questions.some((question) => typeof question !== "string")) {
      throw new Error("AI response must contain a questions array of strings");
    }

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

    const text = await askAI(prompt, 4096, true);
    const analysis = parseJsonObject(text);

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
