import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
    try {
        let { token } = req.cookies;

        if (!token) {
            return res.status(401).json({message: "Unauthorized"});
            }
        const verified = jwt.verify(token, process.env.JWTSECRET);

        if (!verified) {
            return res.status(401).json({message: "Unauthorized"});
        }

        req.userID = verified.userID;

        next();

    } catch (error) {
        console.log(`AUTH MIDDLEWARE ERROR: ${error}`);
        return res.status(500).json({
            message: "Authentication failed"
        });
    }
};

export default isAuth;          