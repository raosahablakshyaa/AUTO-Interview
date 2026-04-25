import User from "../models/user.model.js";
import getToken from "../config/token.js";

export const googleAuth = async (req, res) => {
    try {


        
        const { name, email, picture } = req.body;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                picture
            });
        }

        let token = await getToken(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ user });

    } catch (error) {
        console.log(`GOOGLE AUTH ERROR: ${error}`);
        return res.status(500).json({
            message: "Google authentication failed"
        });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("token");

        return res.status(200).json({
            message: "Logged out successfully"
        });

    } catch (error) {
        console.log(`LOGOUT ERROR: ${error}`);
        return res.status(500).json({
            message: "Logout failed"
        });
    }
};