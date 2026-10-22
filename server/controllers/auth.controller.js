import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import getToken from "../config/token.js";

const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields are required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, picture: "" });
    const token = await getToken(user._id);
    setTokenCookie(res, token);
    return res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email, credits: user.credits, picture: user.picture } });
  } catch (error) {
    console.log(`REGISTER ERROR:`, error);
    if (error.code === 11000) return res.status(400).json({ message: "Email already registered" });
    return res.status(500).json({ message: error.message || "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    const token = await getToken(user._id);
    setTokenCookie(res, token);
    return res.status(200).json({ user: { _id: user._id, name: user.name, email: user.email, credits: user.credits, picture: user.picture } });
  } catch (error) {
    console.log(`LOGIN ERROR:`, error);
    return res.status(500).json({ message: error.message || "Login failed" });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { name, email, picture } = req.body;
    let user = await User.findOne({ email });
    if (!user) user = await User.create({ name, email, picture });
    const token = await getToken(user._id);
    setTokenCookie(res, token);
    return res.status(200).json({ user: { _id: user._id, name: user.name, email: user.email, credits: user.credits, picture: user.picture } });
  } catch (error) {
    console.log(`GOOGLE AUTH ERROR: ${error}`);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed" });
  }
};
