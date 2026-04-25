import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questions: [String],
  answers: [{
    question: String,
    answer: String,
    timeSpent: Number
  }],
  resumeText: String,
  type: { type: String, enum: ["technical", "hr", "mixed"], default: "mixed" },
  result: {
    overallScore: Number,
    confidenceScore: Number,
    correctnessScore: Number,
    communicationScore: Number,
    strongTopics: [String],
    weakTopics: [String],
    improvements: [String],
    questionAnalysis: [{
      question: String,
      answer: String,
      feedback: String,
      score: Number
    }]
  },
  warningCount: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "completed", "terminated"], default: "pending" }
}, { timestamps: true });

const Interview = mongoose.model("Interview", interviewSchema);
export default Interview;
