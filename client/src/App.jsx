import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";

import Home from "./pages/home";
import Auth from "./pages/Auth";

// apne redux slice ka correct path yahan lagao
import { setUserData } from "./redux/userSlice";

export const ServerURL = "http://localhost:5173/";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(
          ServerURL + "api/user/current-user",
          {
            withCredentials: true,
          }
        );

        // user data redux store me save karna
        dispatch(setUserData(result.data));

        console.log(result.data);
      } catch (error) {
        console.log(error);
      }
    };

    getUser();
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
    </Routes>
  );
}

export default App;