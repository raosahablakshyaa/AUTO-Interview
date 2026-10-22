import React, { useRef, useState, useCallback, useEffect } from "react";
import { TbRobot } from "react-icons/tb";
import { FcGoogle } from "react-icons/fc";
import { motion } from "motion/react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../redux/userSlice";
import { auth, provider } from "../utils/firebase";
import { signInWithPopup } from "firebase/auth";
import { ServerURL } from "../App";

const THUMB = 48;

function Auth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [fill, setFill] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const dragging = useRef(false);

  const getPercent = useCallback((clientX) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const max = rect.width - THUMB;
    const x = Math.min(Math.max(clientX - rect.left - THUMB / 2, 0), max);
    return (x / max) * 100;
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const response = await signInWithPopup(auth, provider);
      const { displayName: name, email, photoURL: picture } = response.user;
      const res = await axios.post(`${ServerURL}/api/auth/google`, { name, email, picture }, { withCredentials: true });
      dispatch(setUser(res.data.user));
      navigate("/");
    } catch (error) {
      console.log("GOOGLE LOGIN ERROR", error);
      setFill(0);
    }
  };

  const onStart = useCallback(() => {
    dragging.current = true;
    setIsDragging(true);
  }, []);

  const onMove = useCallback((clientX) => {
    if (!dragging.current) return;
    setFill(getPercent(clientX));
  }, [getPercent]);

  const onEnd = useCallback((clientX) => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    const percent = getPercent(clientX);
    if (percent >= 88) {
      setFill(100);
      setTimeout(handleGoogleLogin, 200);
    } else {
      setFill(0);
    }
  }, [getPercent]);

  // Mouse events on window so drag works outside slider
  useEffect(() => {
    const move = (e) => onMove(e.clientX);
    const up = (e) => onEnd(e.clientX);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [onMove, onEnd]);

  const thumbLeft = `calc(${fill} * (100% - ${THUMB}px) / 100)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-10">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-black text-white p-2 rounded-lg">
            <TbRobot size={22} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Auto_Interview</h1>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue to Auto_Interview</p>
        </div>

        <div
          ref={sliderRef}
          className="relative w-full h-14 rounded-full border border-gray-300 bg-gray-100 overflow-hidden select-none"
        >
          {/* Fill bar */}
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            style={{
              width: `calc(${fill} * (100% - ${THUMB}px) / 100 + ${THUMB}px)`,
              transition: isDragging ? "none" : "width 0.3s ease",
            }}
          />

          {/* Label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`text-sm font-medium transition-colors ${fill > 40 ? "text-white" : "text-gray-500"}`}>
              {fill >= 88 ? "Signing in..." : "Slide to sign in →"}
            </span>
          </div>

          {/* Thumb */}
          <div
            onMouseDown={onStart}
            onTouchStart={(e) => { onStart(); onMove(e.touches[0].clientX); }}
            onTouchMove={(e) => onMove(e.touches[0].clientX)}
            onTouchEnd={(e) => onEnd(e.changedTouches[0].clientX)}
            className="absolute top-1 h-12 w-12 bg-white rounded-full shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing z-10 border border-gray-200"
            style={{
              left: thumbLeft,
              transition: isDragging ? "none" : "left 0.3s ease",
            }}
          >
            <FcGoogle size={22} />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">Drag the Google icon all the way to sign in</p>
      </div>
    </motion.div>
  );
}

export default Auth;
