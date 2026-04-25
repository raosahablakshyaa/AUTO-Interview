import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { TbRobot } from "react-icons/tb";
import { MdOutlineUploadFile, MdPictureAsPdf, MdCheckCircle, MdCancel, MdTrendingUp, MdWarning } from "react-icons/md";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { ServerURL } from "../App";

const interviewTypes = [
  { id: "technical", label: "Technical", icon: "💻" },
  { id: "hr", label: "HR", icon: "🤝" },
  { id: "mixed", label: "Mixed", icon: "🎯" },
];

const languages = [
  { id: "english", label: "🇬🇧 English" },
  { id: "hindi", label: "🇮🇳 Hindi" },
  { id: "hinglish", label: "🔀 Hinglish" },
];

const durations = [
  { id: 15, label: "15 min", questions: 3, timePerQ: 180 },
  { id: 30, label: "30 min", questions: 5, timePerQ: 240 },
  { id: 45, label: "45 min", questions: 7, timePerQ: 300 },
  { id: 60, label: "60 min", questions: 10, timePerQ: 300 },
];

function UploadResume() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const [file, setFile] = useState(null);
  const [type, setType] = useState("mixed");
  const [language, setLanguage] = useState("english");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [resumeAnalysis, setResumeAnalysis] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f && f.type === "application/pdf") { setFile(f); setResumeAnalysis(null); setError(""); }
    else setError("Only PDF files are allowed");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") { setFile(f); setResumeAnalysis(null); setError(""); }
    else setError("Only PDF files are allowed");
  };

  const handleAnalyzeResume = async () => {
    if (!file) return setError("Please upload a resume");
    setAnalyzing(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await axios.post(`${ServerURL}/api/interview/analyze-resume`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResumeAnalysis(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to analyze resume");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartInterview = async () => {
    if (!file) return setError("Please upload a resume");
    if (user.credits < 10) return setError("Insufficient credits");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("type", type);
      formData.append("language", language);
      const selectedDuration = durations.find(d => d.id === duration);
      formData.append("questionCount", selectedDuration.questions);
      const res = await axios.post(`${ServerURL}/api/interview/generate`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      navigate("/interview", { state: { questions: res.data.questions, interviewId: res.data.interviewId, candidateName: res.data.candidateName, language, timePerQ: selectedDuration.timePerQ } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getVerdictConfig = (verdict) => {
    if (verdict === "good") return { color: "bg-green-50 border-green-200", text: "text-green-700", icon: <MdCheckCircle className="text-green-500" size={20} />, label: "Good Resume" };
    if (verdict === "average") return { color: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", icon: <MdWarning className="text-yellow-500" size={20} />, label: "Average Resume" };
    return { color: "bg-red-50 border-red-200", text: "text-red-700", icon: <MdCancel className="text-red-500" size={20} />, label: "Needs Improvement" };
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-black text-white p-2 rounded-lg">
            <TbRobot size={20} />
          </div>
          <span className="font-bold text-lg">Auto_Interview</span>
        </div>

        <div className="flex gap-6 items-start">

          {/* Left - Upload Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8 flex-shrink-0"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Upload Resume</h2>
            <p className="text-gray-500 text-sm mb-6">AI will analyze your resume and generate interview questions</p>

            {/* Credits */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-6">
              <span className="text-sm text-gray-600">Available Credits</span>
              <span className="font-bold text-black">{user?.credits || 0}</span>
            </div>

            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center mb-4 hover:border-gray-400 transition cursor-pointer"
              onClick={() => document.getElementById("resume-input").click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <MdPictureAsPdf size={32} className="text-red-500" />
                  <span className="text-gray-700 font-medium">{file.name}</span>
                </div>
              ) : (
                <>
                  <MdOutlineUploadFile size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Drop your resume here</p>
                  <p className="text-gray-400 text-sm mt-1">or click to browse — PDF only</p>
                </>
              )}
              <input id="resume-input" type="file" accept=".pdf" className="hidden" onChange={handleFile} />
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Analyze Resume Button */}
            <button
              onClick={handleAnalyzeResume}
              disabled={analyzing || !file}
              className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mb-3"
            >
              {analyzing ? "Analyzing Resume..." : "🔍 Analyze Resume First"}
            </button>

            {/* Interview Type */}
            {resumeAnalysis && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Interview Type</p>
                <div className="flex gap-3">
                  {interviewTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition cursor-pointer ${type === t.id ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {resumeAnalysis && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Interview Language</p>
                <div className="flex gap-3">
                  {languages.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLanguage(l.id)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition cursor-pointer ${language === l.id ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {resumeAnalysis && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">⏱️ How much time do you have?</p>
                <p className="text-xs text-gray-400 mb-3">We'll schedule your interview accordingly</p>
                <div className="grid grid-cols-2 gap-2">
                  {durations.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDuration(d.id)}
                      className={`py-3 rounded-xl border text-sm font-medium transition cursor-pointer flex flex-col items-center gap-0.5 ${
                        duration === d.id ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <span className="font-bold">{d.label}</span>
                      <span className={`text-xs ${duration === d.id ? "text-gray-300" : "text-gray-400"}`}>{d.questions} questions</span>
                    </button>
                  ))}
                </div>
              </div>
            )}



            {/* Start Interview Button */}
            <button
              onClick={handleStartInterview}
              disabled={loading || !file}
              className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Generating Questions..." : "Start Interview (10 credits)"}
            </button>
          </motion.div>

          {/* Right - Resume Analysis */}
          <AnimatePresence>
            {resumeAnalysis && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 space-y-4"
              >
                {/* Verdict */}
                {(() => {
                  const config = getVerdictConfig(resumeAnalysis.verdict);
                  return (
                    <div className={`rounded-2xl border p-5 ${config.color}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {config.icon}
                        <span className={`font-bold text-lg ${config.text}`}>{config.label}</span>
                        <span className={`ml-auto text-3xl font-bold ${getScoreColor(resumeAnalysis.score)}`}>{resumeAnalysis.score}/100</span>
                      </div>
                      <p className={`text-sm ${config.text}`}>{resumeAnalysis.summary}</p>
                    </div>
                  );
                })()}

                {/* ATS Score */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">ATS Score</h3>
                    <span className={`text-2xl font-bold ${getScoreColor(resumeAnalysis.atsScore)}`}>{resumeAnalysis.atsScore}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${resumeAnalysis.atsScore}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-2 rounded-full ${resumeAnalysis.atsScore >= 70 ? "bg-green-500" : resumeAnalysis.atsScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                    />
                  </div>
                  <ul className="space-y-1">
                    {resumeAnalysis.atsTips?.map((tip, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Strong & Weak */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <MdCheckCircle className="text-green-500" /> Strong Points
                    </h3>
                    <ul className="space-y-2">
                      {resumeAnalysis.strongPoints?.map((p, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <MdCancel className="text-red-500" /> Weak Points
                    </h3>
                    <ul className="space-y-2">
                      {resumeAnalysis.weakPoints?.map((p, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Missing Sections */}
                {resumeAnalysis.missingSection?.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                    <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                      <MdWarning className="text-yellow-500" /> Missing Sections
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {resumeAnalysis.missingSection.map((s, i) => (
                        <span key={i} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MdTrendingUp className="text-blue-500" /> How to Improve
                  </h3>
                  <ul className="space-y-3">
                    {resumeAnalysis.improvements?.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                        <div>
                          <span className="text-sm font-medium text-gray-800">{item.section}: </span>
                          <span className="text-sm text-gray-600">{item.tip}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default UploadResume;
