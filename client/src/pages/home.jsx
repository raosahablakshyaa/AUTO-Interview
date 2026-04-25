import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { TbRobot } from "react-icons/tb";
import { MdOutlineUploadFile, MdOutlineAnalytics, MdSecurity } from "react-icons/md";
import { BsCameraVideo } from "react-icons/bs";
import { motion } from "motion/react";
import img1 from "../assets/img1.png";
import resumeImg from "../assets/resume.png";
import aiImg from "../assets/ai-ans.png";
import confiImg from "../assets/confi.png";
import creditImg from "../assets/credit.png";

function Home() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const features = [
    { icon: <MdOutlineUploadFile size={28} />, title: "Upload Resume", desc: "Upload your resume and AI will generate personalized interview questions" },
    { icon: <BsCameraVideo size={28} />, title: "AI Interview", desc: "Face-to-face AI interview with real-time proctoring and monitoring" },
    { icon: <MdSecurity size={28} />, title: "Proctored", desc: "Advanced cheating detection — tab switch, face detection, noise alerts" },
    { icon: <MdOutlineAnalytics size={28} />, title: "Detailed Analysis", desc: "Get confidence score, correctness, strong/weak topics and improvement tips" },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="w-full px-8 py-4 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-2 rounded-lg">
            <TbRobot size={20} />
          </div>
          <span className="font-bold text-lg">Auto_Interview</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-gray-600">Credits: <span className="font-bold text-black">{user.credits}</span></span>
          )}
          {user && (
            <div
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-gray-800 transition overflow-hidden"
            >
              {user.picture ? <img src={user.picture} alt="avatar" className="w-full h-full object-cover" /> : (user.name?.[0] || "U").toUpperCase()}
            </div>
          )}
          <button
            onClick={() => navigate(user ? "/upload-resume" : "/auth")}
            className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition cursor-pointer"
          >
            {user ? "Start Interview" : "Get Started"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-5xl mx-auto px-6 py-20 text-center"
      >
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          AI-Powered Interview <br /> Practice Platform
        </h1>
        <p className="text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
          Upload your resume, get personalized questions, practice with an AI interviewer, and receive detailed performance analysis.
        </p>
        <button
          onClick={() => navigate(user ? "/upload-resume" : "/auth")}
          className="bg-black text-white px-8 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition cursor-pointer"
        >
          {user ? "Start Interview →" : "Get Started Free →"}
        </button>
      </motion.div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="bg-gray-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              {f.icon}
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload Resume", desc: "Upload your PDF resume", img: resumeImg },
              { step: "02", title: "AI Interview", desc: "Answer AI questions on camera", img: aiImg },
              { step: "03", title: "Get Results", desc: "Detailed performance analysis", img: confiImg },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-4xl font-bold text-gray-200 mb-3">{s.step}</span>
                <img src={s.img} alt={s.title} className="w-16 h-16 object-contain mb-3" />
                <h3 className="font-semibold text-gray-800 mb-1">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Home;
