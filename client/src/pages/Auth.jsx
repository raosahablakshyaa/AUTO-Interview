import React, { useRef, useState, useCallback } from "react";
import { TbRobot } from "react-icons/tb";
import { FcGoogle } from "react-icons/fc";
import { motion } from "motion/react";
import axios from "axios";

function Auth() {
  const [fillPercent, setFillPercent] = useState(0);
  const dragging = useRef(false);
  const sliderRef = useRef(null);
  const thumbSize = 48;

  const handleGoogleLogin = () => {
    try{
        const response = await signInWithPopup(auth, provider);
        let User = response.user;
        let name = User.displayName;    
        let email = User.email;
        const result = await axios.post(`${ServerURL}api/auth/google`, {
            name,
            email
        });
        console.log(result.data)
    }catch(error){
        console.log(`GOOGLE LOGIN ERROR ${error}`)
    }};

  const getPercent = useCallback((clientX) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const maxX = rect.width - thumbSize;
    const x = Math.min(Math.max(clientX - rect.left - thumbSize / 2, 0), maxX);
    return (x / maxX) * 100;
  }, []);

  const onMouseDown = () => { dragging.current = true; };

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    requestAnimationFrame(() => setFillPercent(getPercent(e.clientX)));
  }, [getPercent]);

  const onRelease = useCallback((clientX) => {
    if (!dragging.current) return;
    dragging.current = false;
    const percent = getPercent(clientX);
    if (percent >= 90) {
      setFillPercent(100);
      setTimeout(handleGoogleLogin, 300);
    } else {
      setFillPercent(0);
    }
  }, [getPercent]);

  const onMouseUp = useCallback((e) => onRelease(e.clientX), [onRelease]);
  const onTouchMove = useCallback((e) => {
    requestAnimationFrame(() => setFillPercent(getPercent(e.touches[0].clientX)));
  }, [getPercent]);
  const onTouchEnd = useCallback((e) => onRelease(e.changedTouches[0].clientX), [onRelease]);

  const thumbLeft = `calc(${fillPercent} * (100% - ${thumbSize}px) / 100)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5 }}
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
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="relative w-full h-14 rounded-full border border-gray-300 bg-gray-100 overflow-hidden select-none max-w-xs mx-auto"
        >
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            style={{
              width: `calc(${fillPercent} * (100% - ${thumbSize}px) / 100 + ${thumbSize}px)`,
              transition: dragging.current ? 'none' : 'width 0.3s ease'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm font-medium text-gray-600">Slide to sign in</span>
          </div>
          <div
            onMouseDown={onMouseDown}
            onTouchStart={onMouseDown}
            className="absolute top-1 h-12 w-12 bg-white rounded-full shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing z-10 border border-gray-200"
            style={{
              left: thumbLeft,
              transition: dragging.current ? 'none' : 'left 0.3s ease'
            }}
          >
            <FcGoogle size={22} />
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default Auth;
