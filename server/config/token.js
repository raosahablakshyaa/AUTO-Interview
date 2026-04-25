import   jwt  from "jsonwebtoken"
const getToken = async (userID)=>{
    try{const token = jwt.sign({userID}, process.env.JWTSECRET, {expiresIn: "7d"})
        return token;
        
    }catch(error){
        console.log(`TOKEN ERROR ${error}`)
    }


}

export default getToken