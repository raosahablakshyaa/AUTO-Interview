import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { TbRobot } from "react-icons/tb";
import { MdOutlineUploadFile, MdPictureAsPdf, MdCheckCircle, MdCancel, MdTrendingUp, MdWarning, MdCode, MdWork, MdSchool, MdLightbulb } from "react-icons/md";
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
  { id: 15, label: "15 min", questions: 3, timePerQ: 180, credits: 5 },
  { id: 30, label: "30 min", questions: 5, timePerQ: 240, credits: 10 },
  { id: 45, label: "45 min", questions: 7, timePerQ: 300, credits: 15 },
  { id: 60, label: "60 min", questions: 10, timePerQ: 300, credits: 20 },
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
    const selectedDuration = durations.find(d => d.id === duration);
    if (user.credits < selectedDuration.credits) return setError(`Insufficient credits. Need ${selectedDuration.credits} credits for ${selectedDuration.label} interview.`);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("type", type);
      formData.append("language", language);
      const selectedDuration = durations.find(d => d.id === duration);
      formData.append("questionCount", selectedDuration.questions);
      formData.append("credits", selectedDuration.credits);
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
    <div className="w-full min-h-screen bg-gray-50 px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-2 mb-8 sm:mb-10">
          <div className="bg-black text-white p-2 rounded-lg">
            <TbRobot size={20} />
          </div>
          <span className="font-bold text-lg">Auto_Interview</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left - Upload Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full lg:max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 flex-shrink-0"
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
                <div className="flex flex-col sm:flex-row gap-3">
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
                <div className="flex flex-col sm:flex-row gap-3">
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
                      <span className={`text-xs font-semibold ${duration === d.id ? "text-yellow-300" : "text-yellow-600"}`}>{d.credits} credits</span>
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
              {loading ? "Generating Questions..." : `Start Interview (${durations.find(d => d.id === duration)?.credits} credits)`}
            </button>
          </motion.div>

          {/* Right - Resume Analysis */}
          <AnimatePresence>
            {resumeAnalysis && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 space-y-4">

                {/* Verdict + Score */}
                {(() => { const config = getVerdictConfig(resumeAnalysis.verdict); return (
                  <div className={`rounded-2xl border p-5 ${config.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {config.icon}
                      <span className={`font-bold text-lg ${config.text}`}>{config.label}</span>
                      <span className={`ml-auto text-3xl font-bold ${getScoreColor(resumeAnalysis.score)}`}>{resumeAnalysis.score}/100</span>
                    </div>
                    <p className={`text-sm ${config.text}`}>{resumeAnalysis.summary}</p>
                  </div>
                ); })()}

                {/* Section-by-Section Scores */}
                {resumeAnalysis.sectionScores && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-800 mb-4">Section Wise Breakdown</h3>
                    <div className="space-y-4">
                      {Object.entries(resumeAnalysis.sectionScores).map(([key, val], i) => {
                        const pct = Math.round((val.score / val.max) * 100);
                        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
                        return (
                          <div key={i} className="border border-gray-100 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-800">{label}</span>
                              <span className={`text-sm font-bold ${getScoreColor(pct)}`}>{val.score}/{val.max}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.08 }}
                                className={`h-1.5 rounded-full ${pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500"}`} />
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{val.feedback}</p>
                            {val.missing?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {val.missing.map((m, j) => <span key={j} className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full">Missing: {m}</span>)}
                              </div>
                            )}
                            {val.issues?.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {val.issues.map((iss, j) => <li key={j} className="text-xs text-red-600 flex items-start gap-1"><span className="flex-shrink-0">•</span>{iss}</li>)}
                              </ul>
                            )}
                            {val.rewrite && (
                              <div className="mt-2 bg-blue-50 rounded-lg p-3">
                                <p className="text-xs text-blue-600 font-medium mb-1">✏️ Suggested Rewrite:</p>
                                <p className="text-xs text-blue-700">{val.rewrite}</p>
                              </div>
                            )}
                            {val.suggestions?.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 font-medium mb-1">Suggested certifications:</p>
                                <div className="flex flex-wrap gap-1">
                                  {val.suggestions.map((s, j) => <span key={j} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">{s}</span>)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ATS Score */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">ATS Compatibility</h3>
                    <span className={`text-2xl font-bold ${getScoreColor(resumeAnalysis.atsScore)}`}>{resumeAnalysis.atsScore}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${resumeAnalysis.atsScore}%` }} transition={{ duration: 0.8 }}
                      className={`h-2 rounded-full ${resumeAnalysis.atsScore >= 70 ? "bg-green-500" : resumeAnalysis.atsScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`} />
                  </div>
                  <ul className="space-y-1.5">
                    {resumeAnalysis.atsTips?.map((tip, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>{tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Bullet Point Analysis */}
                {resumeAnalysis.bulletPointAnalysis && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-800 mb-3">Bullet Point Quality</h3>
                    <div className="flex gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${resumeAnalysis.bulletPointAnalysis.hasMetrics ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {resumeAnalysis.bulletPointAnalysis.hasMetrics ? "✓ Has Metrics" : "✗ No Metrics"}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${resumeAnalysis.bulletPointAnalysis.usesActionVerbs ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {resumeAnalysis.bulletPointAnalysis.usesActionVerbs ? "✓ Action Verbs" : "✗ Weak Verbs"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{resumeAnalysis.bulletPointAnalysis.feedback}</p>
                  </div>
                )}

                {/* Strong & Weak */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><MdCheckCircle className="text-green-500" /> Strong Points</h3>
                    <ul className="space-y-2">
                      {resumeAnalysis.strongPoints?.map((p, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><MdCancel className="text-red-500" /> Weak Points</h3>
                    <ul className="space-y-2">
                      {resumeAnalysis.weakPoints?.map((p, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Keywords */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><MdCode className="text-purple-500" /> Keywords Analysis</h3>
                  {resumeAnalysis.keywordsFound?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2 font-medium">✓ Found in your resume</p>
                      <div className="flex flex-wrap gap-2">
                        {resumeAnalysis.keywordsFound.map((k, i) => <span key={i} className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{k}</span>)}
                      </div>
                    </div>
                  )}
                  {resumeAnalysis.keywordsMissing?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium">✗ Missing — add these</p>
                      <div className="flex flex-wrap gap-2">
                        {resumeAnalysis.keywordsMissing.map((k, i) => <span key={i} className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">{k}</span>)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section Analysis */}
                <div className="space-y-3">
                  {resumeAnalysis.experienceAnalysis && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><MdWork className="text-blue-500" /> Experience Analysis</h3>
                      <p className="text-sm text-gray-600">{resumeAnalysis.experienceAnalysis}</p>
                    </div>
                  )}
                  {resumeAnalysis.educationAnalysis && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><MdSchool className="text-indigo-500" /> Education Analysis</h3>
                      <p className="text-sm text-gray-600">{resumeAnalysis.educationAnalysis}</p>
                    </div>
                  )}
                  {resumeAnalysis.skillsAnalysis && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><MdCode className="text-purple-500" /> Skills Analysis</h3>
                      <p className="text-sm text-gray-600">{resumeAnalysis.skillsAnalysis}</p>
                    </div>
                  )}
                </div>

                {/* Missing Sections */}
                {resumeAnalysis.missingSection?.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                    <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2"><MdWarning className="text-yellow-500" /> Missing Sections</h3>
                    <div className="flex flex-wrap gap-2">
                      {resumeAnalysis.missingSection.map((s, i) => <span key={i} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">{s}</span>)}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><MdTrendingUp className="text-blue-500" /> Fix Your Resume</h3>
                  <ul className="space-y-4">
                    {resumeAnalysis.improvements?.map((item, i) => (
                      <li key={i} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.priority === "high" ? "bg-red-100 text-red-600" : item.priority === "medium" ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-500"
                          }`}>{item.priority?.toUpperCase()}</span>
                          <span className="text-sm font-semibold text-gray-800">{item.section}</span>
                        </div>
                        {item.issue && <p className="text-xs text-red-600 mb-2">⚠ {item.issue}</p>}
                        <p className="text-sm text-gray-600">✏ {item.tip}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Overall Tips */}
                {resumeAnalysis.overallTips?.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                    <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2"><MdLightbulb className="text-blue-500" /> Top 3 High-Impact Changes</h3>
                    <ul className="space-y-2">
                      {resumeAnalysis.overallTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                          <span className="font-bold flex-shrink-0">{i + 1}.</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default UploadResume;
