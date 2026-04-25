import React, { useState } from "react";
import { TbRobot } from "react-icons/tb";
import { FcGoogle } from "react-icons/fc";
import { MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { motion, AnimatePresence } from "motion/react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/userSlice";
import { ServerURL } from "../App";

function Auth() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [mode, setMode] = useState("login"); // login | signup
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "signup" && !form.name.trim()) return setError("Name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (!form.password) return setError("Password is required");
    if (mode === "signup" && form.password.length < 6) return setError("Password must be at least 6 characters");

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const res = await axios.post(`${ServerURL}${endpoint}`, payload, { withCredentials: true });
      dispatch(setUser(res.data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await signInWithPopup(auth, provider);
      const { displayName, email, photoURL } = response.user;
      const res = await axios.post(`${ServerURL}/api/auth/google`, {
        name: displayName, email, picture: photoURL
      }, { withCredentials: true });
      dispatch(setUser(res.data.user));
      navigate("/");
    } catch (err) {
      setError("Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-black text-white p-2 rounded-lg">
            <TbRobot size={22} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Auto_Interview</h1>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setForm({ name: "", email: "", password: "" }); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${mode === m ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Name — signup only */}
            {mode === "signup" && (
              <div className="relative">
                <MdPerson size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="name"
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <MdEmail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <MdLock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={mode === "signup" ? "Password (min 6 chars)" : "Password"}
                value={form.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
              >
                {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </motion.form>
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <FcGoogle size={20} />
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
}

export default Auth;
