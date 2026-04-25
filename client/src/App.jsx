import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUser, setLoading } from "./redux/userSlice";

import Home from "./pages/home";
import Auth from "./pages/Auth";
import UploadResume from "./pages/UploadResume";
import InterviewRoom from "./pages/InterviewRoom";
import Result from "./pages/Result";
import Profile from "./pages/Profile";

export const ServerURL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.user);

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch(`${ServerURL}/api/user/current-user`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data.user) dispatch(setUser(data.user));
        else dispatch(setLoading(false));
      } catch (error) {
        dispatch(setLoading(false));
      }
    };
    getUser();
  }, []);

  const isProfileComplete = !!(user?.phone && user?.college && user?.targetRole);

  if (loading) return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/upload-resume" element={user ? (isProfileComplete ? <UploadResume /> : <Navigate to="/profile" />) : <Navigate to="/auth" />} />
      <Route path="/interview" element={user ? (isProfileComplete ? <InterviewRoom /> : <Navigate to="/profile" />) : <Navigate to="/auth" />} />
      <Route path="/result" element={user ? <Result /> : <Navigate to="/auth" />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
    </Routes>
  );
}

export default App;
