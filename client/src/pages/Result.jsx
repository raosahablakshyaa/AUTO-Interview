import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { TbRobot } from "react-icons/tb";
import { MdWarning, MdCheckCircle, MdTrendingUp, MdTrendingDown, MdStar } from "react-icons/md";
import axios from "axios";
import { ServerURL } from "../App";
import confiImg from "../assets/confi.png";

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { answers = [], interviewId, warningCount = 0, terminated = false } = location.state || {};
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (answers.length === 0) { navigate("/"); return; }
    analyzeInterview();
  }, []);

  const analyzeInterview = async () => {
    try {
      const res = await axios.post(`${ServerURL}/api/interview/analyze`, {
        answers, interviewId, warningCount
      }, { withCredentials: true });
      setResult(res.data);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-black text-white p-3 rounded-xl inline-block mb-4">
          <TbRobot size={28} />
        </div>
        <p className="text-gray-600 font-medium">Analyzing your interview...</p>
        <p className="text-gray-400 text-sm mt-1">This may take a few seconds</p>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gray-50 py-8 sm:py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-black text-white p-2 rounded-lg">
            <TbRobot size={20} />
          </div>
          <span className="font-bold text-lg">Interview Results</span>
        </div>

        {result.creditsAwarded > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <MdCheckCircle size={24} className="text-green-500" />
            <p className="text-green-700 font-medium">🎉 Excellent performance! You scored above 80% — <span className="font-bold">+20 credits</span> added to your account.</p>
          </div>
        )}

        {terminated && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <MdWarning size={24} className="text-red-500" />
            <p className="text-red-700 font-medium">Interview was terminated due to too many violations</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">

            {/* Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Overall Score", value: result.overallScore, suffix: "%" },
                { label: "Confidence", value: result.confidenceScore, suffix: "%" },
                { label: "Correctness", value: result.correctnessScore, suffix: "%" },
                { label: "Warnings", value: warningCount, suffix: "", noColor: true },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center"
                >
                  <p className={`text-3xl font-bold mb-1 ${s.noColor ? "text-gray-800" : getScoreColor(s.value)}`}>
                    {s.value}{s.suffix}
                  </p>
                  <p className="text-gray-500 text-sm">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Progress Bars */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Performance Breakdown</h3>
              {[
                { label: "Overall Score", value: result.overallScore },
                { label: "Confidence Level", value: result.confidenceScore },
                { label: "Answer Correctness", value: result.correctnessScore },
                { label: "Communication", value: result.communicationScore },
              ].map((item, i) => (
                <div key={i} className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                      className={`h-2 rounded-full ${getScoreBg(item.value)}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Strong & Weak Topics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MdCheckCircle className="text-green-500" /> Strong Topics
                </h3>
                <ul className="space-y-2">
                  {result.strongTopics?.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />{t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MdTrendingDown className="text-red-500" /> Weak Topics
                </h3>
                <ul className="space-y-2">
                  {result.weakTopics?.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-2 h-2 bg-red-500 rounded-full" />{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* What You Did Well */}
            {result.goodPoints?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <MdStar className="text-green-500" size={20} /> What You Did Well
                </h3>
                <ul className="space-y-2">
                  {result.goodPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                      <MdCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />{point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvement Tips */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MdTrendingUp className="text-blue-500" /> How to Improve
              </h3>
              <ul className="space-y-3">
                {result.improvements?.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Q&A Review */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Question Review</h3>
              <div className="space-y-4">
                {result.questionAnalysis?.map((qa, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-800 mb-2">Q{i + 1}: {qa.question}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Your answer:</span> {qa.answer || "No answer given"}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Feedback:</span> {qa.feedback}</p>
                    <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getScoreBg(qa.score)} text-white`}>
                      Score: {qa.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => navigate("/upload-resume")}
                className="flex-1 bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition cursor-pointer"
              >
                Take Another Interview
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 bg-white text-black py-3 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
              >
                Go Home
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default Result;
