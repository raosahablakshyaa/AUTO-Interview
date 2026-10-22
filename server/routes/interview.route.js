import express from "express";
import multer from "multer";
import { generateQuestions, analyzeInterview, getInterviewHistory, analyzeResume, replyToDoubt } from "../controllers/interview.controller.js";
import isAuth from "../middlewares/isAuth.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const interviewRouter = express.Router();

interviewRouter.post("/reply-doubt", isAuth, replyToDoubt);
interviewRouter.post("/analyze-resume", isAuth, upload.single("resume"), analyzeResume);
interviewRouter.post("/generate", isAuth, upload.single("resume"), generateQuestions);
interviewRouter.post("/analyze", isAuth, analyzeInterview);
interviewRouter.get("/history", isAuth, getInterviewHistory);

export default interviewRouter;
