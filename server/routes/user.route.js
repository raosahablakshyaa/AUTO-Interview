import express from "express";
import { getCurrentUser, updateProfile, getStats } from "../controllers/user.controller.js";
import isAuth from "../middlewares/isAuth.js";

const userRouter = express.Router();

userRouter.get("/current-user", isAuth, getCurrentUser);
userRouter.put("/update-profile", isAuth, updateProfile);
userRouter.get("/stats", isAuth, getStats);

export default userRouter;
