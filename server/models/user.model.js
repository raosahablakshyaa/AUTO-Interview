import mongoose from "mongoose";

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password: {
        type: String,
        default: null
    },
    picture: {
        type: String,
        default: ""
    },
    credits:{
        type:Number,
        required:true,
        default:100
    },
    resumeText: { type: String, default: "" },
    candidateName: { type: String, default: "" },
    bio: { type: String, default: "" },
    phone: { type: String, default: "" },
    college: { type: String, default: "" },
    degree: { type: String, default: "" },
    graduationYear: { type: String, default: "" },
    skills: [{ type: String }],
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    targetRole: { type: String, default: "" }
},{timestamps:true})


const User = mongoose.model("User",userSchema)

export default User