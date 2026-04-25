export const getCurrentUser = (req,res) => {
    try {
        const userId = req.userID;
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }
        return res.status(200).json({user});

    } catch (error) {
        console.log(`GET CURRENT USER ERROR: ${error}`);
        return res.status(500).json({
            message: "Failed to get current user"
        });
    }
};