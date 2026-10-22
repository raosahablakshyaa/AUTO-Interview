import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.userID).select("-__v -password -resumeText");
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ user });
    } catch (error) {
        console.log(`GET USER ERROR ${error}`);
        return res.status(500).json({ message: "Failed to get user" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, bio, phone, college, degree, graduationYear, skills, github, linkedin, targetRole, picture } = req.body;
        const updated = await User.findByIdAndUpdate(
            req.userID,
            { name, bio, phone, college, degree, graduationYear, skills, github, linkedin, targetRole, picture },
            { new: true }
        ).select("-__v -password -resumeText");
        return res.status(200).json({ user: updated });
    } catch (error) {
        console.log(`UPDATE PROFILE ERROR ${error}`);
        return res.status(500).json({ message: "Failed to update profile" });
    }
};

export const getStats = async (req, res) => {
    try {
        const interviews = await Interview.find({ userId: req.userID }).select("result status warningCount createdAt type");
        const completed = interviews.filter(i => i.status === "completed");
        const avgScore = completed.length > 0
            ? Math.round(completed.reduce((sum, i) => sum + (i.result?.overallScore || 0), 0) / completed.length)
            : 0;
        return res.status(200).json({
            totalInterviews: interviews.length,
            completedInterviews: completed.length,
            terminatedInterviews: interviews.filter(i => i.status === "terminated").length,
            avgScore,
            recentInterviews: interviews.slice(-5).reverse()
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to get stats" });
    }
};
