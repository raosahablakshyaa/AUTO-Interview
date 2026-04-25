import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: "Unauthorized" });
        const decoded = jwt.verify(token, process.env.JWTSECRET);
        req.userID = decoded.userID;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

export default isAuth;
