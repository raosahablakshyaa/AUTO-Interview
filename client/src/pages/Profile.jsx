import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "motion/react";
import { TbRobot } from "react-icons/tb";
import { MdEdit, MdSave, MdLogout, MdAdd, MdClose, MdPerson, MdPhone, MdSchool, MdWork, MdCode, MdBarChart } from "react-icons/md";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import axios from "axios";
import { ServerURL } from "../App";
import { setUser, clearUser } from "../redux/userSlice";

function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.user);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "", bio: "", phone: "", college: "", degree: "",
    graduationYear: "", skills: [], github: "", linkedin: "", targetRole: "", picture: ""
  });

  const isProfileComplete = !!(user?.phone && user?.college && user?.targetRole);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        bio: user.bio || "",
        phone: user.phone || "",
        college: user.college || "",
        degree: user.degree || "",
        graduationYear: user.graduationYear || "",
        skills: user.skills || [],
        github: user.github || "",
        linkedin: user.linkedin || "",
        targetRole: user.targetRole || "",
        picture: user.picture || ""
      });
      // Auto open edit mode if profile incomplete
      if (!user.phone || !user.college || !user.targetRole) {
        setEditing(true);
      }
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${ServerURL}/api/user/stats`, { withCredentials: true });
      setStats(res.data);
    } catch (e) {}
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setForm(p => ({ ...p, skills: [...p.skills, s] }));
    setSkillInput("");
  };

  const removeSkill = (skill) => setForm(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }));

  const handleSave = async () => {
    if (!form.phone || !form.college || !form.targetRole)
      return setError("Phone, College and Target Role are required to complete your profile.");
    setLoading(true);
    setError("");
    try {
      const res = await axios.put(`${ServerURL}/api/user/update-profile`, form, { withCredentials: true });
      dispatch(setUser(res.data.user));
      setSuccess("Profile updated successfully!");
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await axios.get(`${ServerURL}/api/auth/logout`, { withCredentials: true });
    dispatch(clearUser());
    navigate("/");
  };

  const avatarLetter = (form.name || user?.name || "U")[0].toUpperCase();

  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="w-full px-4 sm:px-8 py-4 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => isProfileComplete ? navigate("/") : null}>
          <div className="bg-black text-white p-2 rounded-lg"><TbRobot size={20} /></div>
          <span className="font-bold text-lg">Auto_Interview</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {isProfileComplete && (
            <button onClick={() => navigate("/upload-resume")} className="bg-black text-white px-3 sm:px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition cursor-pointer">
              Start Interview
            </button>
          )}
          <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition cursor-pointer">
            <MdLogout size={18} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Incomplete banner */}
      {!isProfileComplete && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 text-center">
          <p className="text-yellow-800 text-sm font-medium">
            ⚠️ Please complete your profile before starting an interview — Phone, College & Target Role are required.
          </p>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div className="flex items-center gap-5 mb-4 sm:mb-0">
              <div>
                {form.picture ? (
                  <img src={form.picture} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center text-3xl font-bold">
                    {avatarLetter}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
                <p className="text-gray-500 text-sm">{user?.email}</p>
                {user?.targetRole && <p className="text-blue-600 text-sm mt-1">🎯 {user.targetRole}</p>}
                <span className="bg-black text-white text-xs px-3 py-1 rounded-full mt-2 inline-block">{user?.credits} credits</span>
              </div>
            </div>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${editing ? "bg-black text-white hover:bg-gray-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              {editing ? <><MdSave size={16} /> {loading ? "Saving..." : "Save Profile"}</> : <><MdEdit size={16} /> Edit Profile</>}
            </button>
          </div>

          {!isProfileComplete && editing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4 text-sm text-yellow-800">
              📋 Fill in <strong>Phone</strong>, <strong>College</strong> and <strong>Target Role</strong> to complete your profile.
            </div>
          )}

          {success && <p className="text-green-600 text-sm mb-4 bg-green-50 px-4 py-2 rounded-xl">{success}</p>}
          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field icon={<MdPerson size={16} />} label="Full Name" name="name" value={form.name} editing={editing} onChange={handleChange} />
            <Field icon={<MdPhone size={16} />} label="Phone *" name="phone" value={form.phone} editing={editing} onChange={handleChange} placeholder="+91 XXXXX XXXXX" required />
            <Field icon={<MdSchool size={16} />} label="College / University *" name="college" value={form.college} editing={editing} onChange={handleChange} required />
            <Field icon={<MdSchool size={16} />} label="Degree" name="degree" value={form.degree} editing={editing} onChange={handleChange} placeholder="B.Tech CSE" />
            <Field icon={<MdSchool size={16} />} label="Graduation Year" name="graduationYear" value={form.graduationYear} editing={editing} onChange={handleChange} placeholder="2025" />
            <Field icon={<MdWork size={16} />} label="Target Role *" name="targetRole" value={form.targetRole} editing={editing} onChange={handleChange} placeholder="SDE-1, ML Engineer..." required />
            <Field icon={<FaGithub size={16} />} label="GitHub" name="github" value={form.github} editing={editing} onChange={handleChange} placeholder="https://github.com/username" />
            <Field icon={<FaLinkedin size={16} />} label="LinkedIn" name="linkedin" value={form.linkedin} editing={editing} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
          </div>

          {/* Bio */}
          <div className="mt-4">
            <label className="text-xs text-gray-500 font-medium mb-1 block">Bio</label>
            {editing ? (
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} placeholder="Tell us about yourself..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-black resize-none" />
            ) : (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 min-h-[60px]">{form.bio || <span className="text-gray-400">No bio added</span>}</p>
            )}
          </div>

          {/* Skills */}
          <div className="mt-4">
            <label className="text-xs text-gray-500 font-medium mb-2 block"><MdCode size={14} className="inline mr-1" />Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.skills.map((s, i) => (
                <span key={i} className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {s}
                  {editing && <MdClose size={14} className="cursor-pointer text-gray-400 hover:text-red-500" onClick={() => removeSkill(s)} />}
                </span>
              ))}
              {form.skills.length === 0 && !editing && <span className="text-sm text-gray-400">No skills added</span>}
            </div>
            {editing && (
              <div className="flex gap-2">
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill (press Enter)"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-black" />
                <button onClick={addSkill} className="bg-black text-white px-4 py-2 rounded-xl text-sm cursor-pointer hover:bg-gray-800 transition">
                  <MdAdd size={18} />
                </button>
              </div>
            )}
          </div>

          {!editing && (form.github || form.linkedin) && (
            <div className="flex gap-3 mt-4">
              {form.github && <a href={form.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"><FaGithub size={16} /> GitHub</a>}
              {form.linkedin && <a href={form.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition"><FaLinkedin size={16} /> LinkedIn</a>}
            </div>
          )}
        </motion.div>

        {/* Stats */}
        {stats && isProfileComplete && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><MdBarChart size={20} /> Interview Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Interviews", value: stats.totalInterviews, color: "text-gray-800" },
                { label: "Completed", value: stats.completedInterviews, color: "text-green-600" },
                { label: "Terminated", value: stats.terminatedInterviews, color: "text-red-500" },
                { label: "Avg Score", value: stats.avgScore ? `${stats.avgScore}%` : "N/A", color: "text-blue-600" },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Field({ icon, label, name, value, editing, onChange, placeholder, required }) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
        {icon} {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {editing ? (
        <input name={name} value={value} onChange={onChange} placeholder={placeholder || label}
          className={`w-full border rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-black transition ${required && !value ? "border-red-300 bg-red-50" : "border-gray-200"}`} />
      ) : (
        <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 min-h-[40px]">
          {value || <span className="text-gray-400">Not added</span>}
        </p>
      )}
    </div>
  );
}

export default Profile;
