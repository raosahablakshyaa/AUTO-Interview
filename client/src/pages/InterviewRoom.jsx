import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { TbRobot } from "react-icons/tb";
import { MdMic, MdMicOff, MdWarning, MdCode, MdFaceRetouchingOff } from "react-icons/md";
import { BsCameraVideo, BsCameraVideoOff } from "react-icons/bs";
import Editor from "@monaco-editor/react";
import { ServerURL } from "../App";
import femaleAI from "../assets/Videos/female-ai.mp4";
import maleAI from "../assets/Videos/male-ai.mp4";

function InterviewRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions = [], interviewId, candidateName = "", domain = "" } = location.state || {};

  const isCodingQuestion = (q) => q?.startsWith("[CODE]");
  const cleanQuestion = (q) => q?.replace(/^\[CODE\]\s*/, "");

  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const aiVideoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const noiseIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const warningCountRef = useRef(0);
  const answersRef = useRef([]);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [warningCount, setWarningCount] = useState(0);
  const [cameraOn, setCameraOn] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120);
  const [phase, setPhase] = useState("intro");
  const [aiGender] = useState(Math.random() > 0.5 ? "female" : "male");
  const [codeAnswer, setCodeAnswer] = useState("");
  const [faceStatus, setFaceStatus] = useState("ok"); // ok | no-face | multiple
  const [isBlurred, setIsBlurred] = useState(false);
  const [warningAlert, setWarningAlert] = useState(null);

  // Keep answersRef in sync
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { warningCountRef.current = warningCount; }, [warningCount]);

  // Chrome speechSynthesis keep-alive fix
  useEffect(() => {
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
    return () => clearInterval(keepAlive);
  }, []);

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (webcamRef.current) webcamRef.current.srcObject = stream;
        startRecording(stream);
        startNoiseDetection(stream);
      } catch (err) {
        addWarning("Camera/Mic access denied");
      }
    };
    startCamera();
    return () => {
      stopMedia();
    };
  }, []);

  // Tab switch detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) addWarning("Tab switch detected!");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreen = () => {
      if (!document.fullscreenElement) addWarning("Fullscreen exited!");
    };
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  // Copy / Paste / Cut block
  useEffect(() => {
    const block = (e) => {
      e.preventDefault();
      addWarning(`${e.type.charAt(0).toUpperCase() + e.type.slice(1)} detected!`);
    };
    document.addEventListener("copy", block);
    document.addEventListener("paste", block);
    document.addEventListener("cut", block);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("cut", block);
    };
  }, []);

  // Right click block
  useEffect(() => {
    const block = (e) => { e.preventDefault(); addWarning("Right click detected!"); };
    document.addEventListener("contextmenu", block);
    return () => document.removeEventListener("contextmenu", block);
  }, []);

  // Keyboard shortcuts block (Alt+Tab, Ctrl+C, Ctrl+V, F12, etc.)
  useEffect(() => {
    const block = (e) => {
      const blocked = (e.ctrlKey && ["c","v","x","u","s","a","p"].includes(e.key.toLowerCase())) ||
        (e.altKey && e.key === "Tab") ||
        e.key === "F12" || e.key === "F11" ||
        (e.ctrlKey && e.shiftKey && ["i","j","c"].includes(e.key.toLowerCase()));
      if (blocked) {
        e.preventDefault();
        addWarning(`Blocked shortcut: ${e.ctrlKey ? "Ctrl+" : ""}${e.altKey ? "Alt+" : ""}${e.key}`);
      }
    };
    document.addEventListener("keydown", block);
    return () => document.removeEventListener("keydown", block);
  }, []);

  // Window blur (user switched app)
  useEffect(() => {
    const handleBlur = () => {
      setIsBlurred(true);
      addWarning("Window focus lost — switched app!");
    };
    const handleFocus = () => setIsBlurred(false);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Face detection using canvas sampling
  useEffect(() => {
    if (!webcamRef.current) return;
    faceIntervalRef.current = setInterval(() => {
      const video = webcamRef.current;
      const canvas = faceCanvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const skinPixels = countSkinPixels(imageData);
      const ratio = skinPixels / (canvas.width * canvas.height);
      if (ratio < 0.02) {
        setFaceStatus("no-face");
        addWarning("No face detected — please stay in frame!");
      } else if (ratio > 0.35) {
        setFaceStatus("multiple");
        addWarning("Multiple faces detected!");
      } else {
        setFaceStatus("ok");
      }
    }, 5000);
    return () => clearInterval(faceIntervalRef.current);
  }, []);

  const countSkinPixels = (imageData) => {
    let count = 0;
    for (let i = 0; i < imageData.data.length; i += 16) {
      const r = imageData.data[i], g = imageData.data[i + 1], b = imageData.data[i + 2];
      if (r > 95 && g > 40 && b > 20 && r > g && r > b && (r - g) > 15 && Math.abs(r - g) > 15) count++;
    }
    return count * 4;
  };

  // Noise / background voice detection
  const startNoiseDetection = (stream) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      noiseIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        if (avg > 40 && !isListening) addWarning("Background noise detected!");
      }, 8000);
    } catch (e) {}
  };

  // Timer
  useEffect(() => {
    if (phase !== "answering") return;
    if (timeLeft <= 0) { handleNextQuestion(); return; }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase]);

  // Start intro
  useEffect(() => {
    if (questions.length === 0) { navigate("/upload-resume"); return; }
    if (sessionStorage.getItem("interviewDone") === interviewId) { navigate("/upload-resume", { replace: true }); return; }
    setTimeout(() => {
      const intro = candidateName
        ? `Hello ${candidateName}, welcome to your AI interview. I have reviewed your resume and prepared some questions for you. Please ensure you are alone, your face is clearly visible, and you do not switch tabs or applications. Let's begin.`
        : `Welcome to your AI interview. Please ensure you are alone, your face is clearly visible, and you do not switch tabs. Let's begin.`;
      speakAI(intro, () => { setPhase("question"); askQuestion(0); });
    }, 1000);
  }, []);

  const stopMedia = () => {
    // Stop all tracks explicitly
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => { t.stop(); });
      streamRef.current = null;
    }
    if (webcamRef.current) {
      webcamRef.current.srcObject = null;
    }
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    window.speechSynthesis.cancel();
    clearInterval(faceIntervalRef.current);
    clearInterval(noiseIntervalRef.current);
    analyserRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };
  const addWarning = (msg) => {
    setWarningAlert(msg);
    setTimeout(() => setWarningAlert(null), 3000);
    setWarnings(prev => [...prev.slice(-4), { msg, time: new Date().toLocaleTimeString() }]);
    setWarningCount(prev => {
      const next = prev + 1;
      warningCountRef.current = next;
      if (next >= 5) {
        stopMedia();
        document.exitFullscreen?.();
        sessionStorage.setItem("interviewDone", interviewId);
        navigate("/result", { state: { terminated: true, answers: answersRef.current, interviewId }, replace: true });
      }
      return next;
    });
  };

  const startRecording = (stream) => {
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) {} };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
  };

  const speakAI = (text, onDone) => {
    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const enVoices = voices.filter(v => v.lang.startsWith("en"));
      const preferred = enVoices.find(v =>
        aiGender === "female"
          ? v.name.includes("Samantha") || v.name.includes("Google UK English Female") || v.name.includes("Zira") || v.name.includes("Susan")
          : v.name.includes("Daniel") || v.name.includes("Google UK English Male") || v.name.includes("David") || v.name.includes("Mark")
      ) || enVoices[0] || voices[0];

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = aiGender === "female" ? 1.05 : 0.95;
      utterance.volume = 1;
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        setAiSpeaking(true);
        aiVideoRef.current?.play();
      };
      utterance.onend = () => {
        setAiSpeaking(false);
        if (aiVideoRef.current) { aiVideoRef.current.pause(); aiVideoRef.current.currentTime = 0; }
        onDone?.();
      };
      utterance.onerror = (e) => {
        console.error("Speech error:", e);
        setAiSpeaking(false);
        if (aiVideoRef.current) { aiVideoRef.current.pause(); aiVideoRef.current.currentTime = 0; }
        onDone?.();
      };

      window.speechSynthesis.speak(utterance);
    };

    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        doSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          doSpeak();
        };
      }
    }, 200);
  };

  const askQuestion = (index) => {
    if (index >= questions.length) { finishInterview(); return; }
    setPhase("question");
    setTimeLeft(120);
    setTranscript("");
    setCodeAnswer("");
    speakAI(cleanQuestion(questions[index]), () => setPhase("answering"));
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(t);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleNextQuestion = () => {
    stopListening();
    const finalAnswer = isCodingQuestion(questions[currentQ]) ? codeAnswer || transcript : transcript;
    const newAnswers = [...answersRef.current, { question: cleanQuestion(questions[currentQ]), answer: finalAnswer, timeSpent: 120 - timeLeft, isCoding: isCodingQuestion(questions[currentQ]) }];
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
    const next = currentQ + 1;
    if (next >= questions.length) { finishInterview(); return; }
    setCurrentQ(next);
    askQuestion(next);
  };

  const finishInterview = () => {
    setPhase("finished");
    setTimeout(() => stopMedia(), 2000);
    document.exitFullscreen?.();
    sessionStorage.setItem("interviewDone", interviewId);
    navigate("/result", { state: { answers: answersRef.current, interviewId, warningCount: warningCountRef.current }, replace: true });
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (questions.length === 0) return null;

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white flex flex-col select-none" onContextMenu={(e) => e.preventDefault()}>

      {/* Blur overlay when window loses focus */}
      {isBlurred && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center">
          <div className="text-center">
            <MdWarning size={48} className="text-red-400 mx-auto mb-3" />
            <p className="text-white text-xl font-bold">Return to Interview</p>
            <p className="text-gray-400 text-sm mt-1">You switched away — this has been recorded</p>
          </div>
        </div>
      )}

      {/* Warning Alert Toast */}
      <AnimatePresence>
        {warningAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg"
          >
            <MdWarning size={18} /> {warningAlert}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden canvas for face detection */}
      <canvas ref={faceCanvasRef} className="hidden" />

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="bg-white text-black p-1.5 rounded-lg">
            <TbRobot size={18} />
          </div>
          <span className="font-bold">Auto_Interview</span>
          <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">● LIVE PROCTORED</span>
        </div>
        <div className="flex items-center gap-4">
          {phase === "answering" && (
            <div className={`px-3 py-1 rounded-full text-sm font-mono font-bold ${timeLeft < 30 ? "bg-red-500" : "bg-gray-700"}`}>
              {formatTime(timeLeft)}
            </div>
          )}
          <div className="text-sm text-gray-400">Q {currentQ + 1}/{questions.length}</div>

          {/* Face status */}
          {faceStatus !== "ok" && (
            <div className="flex items-center gap-1 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs">
              <MdFaceRetouchingOff size={14} /> {faceStatus === "no-face" ? "No Face" : "Multiple Faces"}
            </div>
          )}

          {warningCount > 0 && (
            <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
              <MdWarning size={14} /> {warningCount}/5 warnings
            </div>
          )}
          {phase === "answering" && (
            <button
              onClick={finishInterview}
              className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-medium hover:bg-red-500/30 transition cursor-pointer"
            >
              Submit Early
            </button>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 gap-4 p-4">

        {/* AI Video + Question */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="relative bg-gray-800 rounded-2xl overflow-hidden flex-1 flex items-center justify-center">
            <video
              ref={aiVideoRef}
              src={aiGender === "female" ? femaleAI : maleAI}
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-sm">
              AI Interviewer {aiSpeaking && <span className="ml-1 text-green-400">● Speaking</span>}
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gray-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-gray-400">Question {currentQ + 1}</p>
                {isCodingQuestion(questions[currentQ]) && (
                  <span className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs">
                    <MdCode size={12} /> Coding
                  </span>
                )}
              </div>
              <p className="text-white font-medium">{cleanQuestion(questions[currentQ])}</p>
            </motion.div>
          </AnimatePresence>

          {/* Coding Playground */}
          {phase === "answering" && isCodingQuestion(questions[currentQ]) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-2xl overflow-hidden"
              style={{ height: "280px" }}
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 border-b border-gray-600">
                <MdCode size={14} className="text-blue-400" />
                <span className="text-xs text-gray-300">Code Editor</span>
              </div>
              <Editor
                height="240px"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={codeAnswer}
                onChange={(val) => setCodeAnswer(val || "")}
                options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: "on" }}
              />
            </motion.div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-80 flex flex-col gap-4">

          {/* User Camera */}
          <div className="relative bg-gray-800 rounded-2xl overflow-hidden h-52">
            {cameraOn ? (
              <video ref={webcamRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <BsCameraVideoOff size={32} />
              </div>
            )}
            <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-1 rounded-full">You</div>
            {/* Face status indicator on camera */}
            <div className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full ${faceStatus === "ok" ? "bg-green-500/80" : "bg-red-500/80"}`}>
              {faceStatus === "ok" ? "✓ Face OK" : faceStatus === "no-face" ? "⚠ No Face" : "⚠ Multiple"}
            </div>
            <button
              onClick={() => setCameraOn(p => !p)}
              className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full cursor-pointer"
            >
              {cameraOn ? <BsCameraVideo size={14} /> : <BsCameraVideoOff size={14} />}
            </button>
          </div>

          {/* Transcript */}
          <div className="bg-gray-800 rounded-2xl p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">Your Answer</p>
              <button
                onClick={isListening ? stopListening : startListening}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs cursor-pointer ${isListening ? "bg-red-500" : "bg-green-600"}`}
              >
                {isListening ? <><MdMicOff size={12} /> Stop</> : <><MdMic size={12} /> Speak</>}
              </button>
            </div>
            <p className="text-gray-300 text-sm min-h-20">
              {transcript || <span className="text-gray-600">Click Speak and start answering...</span>}
            </p>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <p className="text-red-400 text-xs font-medium mb-2 flex items-center gap-1"><MdWarning size={14} /> Violations Log</p>
              {warnings.slice(-3).map((w, i) => (
                <p key={i} className="text-red-300 text-xs">{w.time}: {w.msg}</p>
              ))}
            </div>
          )}

          {/* Next Button */}
          {phase === "answering" && (
            <button
              onClick={handleNextQuestion}
              className="w-full bg-white text-black py-3 rounded-xl font-medium hover:bg-gray-200 transition cursor-pointer"
            >
              {currentQ + 1 >= questions.length ? "Finish Interview" : "Next Question →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewRoom;
