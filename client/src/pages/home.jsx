import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { TbRobot } from "react-icons/tb";
import { MdOutlineUploadFile, MdOutlineAnalytics, MdSecurity, MdArrowForward, MdArrowBack, MdCheck } from "react-icons/md";
import { BsCameraVideo } from "react-icons/bs";
import { motion, AnimatePresence } from "motion/react";
import resumeImg from "../assets/resume.png";
import aiImg from "../assets/ai-ans.png";
import confiImg from "../assets/confi.png";
import engImg from "../assets/engineering.jpeg";
import govtImg from "../assets/govt job.jpeg";
import medImg from "../assets/medical.jpeg";
import mbaImg from "../assets/mba.jpeg";
import teachImg from "../assets/teaching.png";
import startupImg from "../assets/stratup.jpeg";
import hrImg from "../assets/HR.png";
import mmImg from "../assets/MM.png";

const careerData = {
  "Engineering": {
    icon: "⚙️",
    subcategories: {
      "Internship": {
        branches: {
          "Computer Science": ["Google", "Microsoft", "Amazon", "Meta", "Adobe", "Flipkart", "Uber", "Other"],
          "AI / ML": ["OpenAI", "DeepMind", "Anthropic", "Google DeepMind", "NVIDIA", "Tesla", "Other"],
          "Mechanical": ["Tesla", "SpaceX", "Tata Motors", "Mahindra", "L&T", "Bosch", "Other"],
          "Civil": ["L&T", "DLF", "Shapoorji", "NHAI", "AECOM", "Other"],
          "Electrical": ["Siemens", "ABB", "Schneider", "BHEL", "Power Grid", "Other"],
          "Electronics": ["Qualcomm", "Intel", "Samsung", "Texas Instruments", "ISRO", "Other"],
          "Biotechnology": ["Biocon", "Dr. Reddy's", "Cipla", "Serum Institute", "Other"],
        }
      },
      "Full-Time Job": {
        branches: {
          "Computer Science": ["Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix", "Adobe", "Other"],
          "AI / ML": ["OpenAI", "Anthropic", "DeepMind", "NVIDIA", "Tesla", "Cohere", "Other"],
          "Mechanical": ["Tesla", "SpaceX", "Tata Motors", "Mahindra", "Bosch", "Caterpillar", "Other"],
          "Civil": ["L&T", "Shapoorji", "AECOM", "Jacobs", "DLF", "Other"],
          "Electrical": ["Siemens", "ABB", "GE", "Schneider", "BHEL", "Other"],
          "Electronics": ["Qualcomm", "Intel", "Samsung", "ISRO", "DRDO", "Other"],
          "Biotechnology": ["Biocon", "Cipla", "Sun Pharma", "Pfizer", "Other"],
        }
      },
      "Placement Preparation": {
        branches: {
          "Computer Science": ["Google", "Microsoft", "Amazon", "Infosys", "TCS", "Wipro", "Cognizant", "Other"],
          "AI / ML": ["Google", "Microsoft", "Amazon", "NVIDIA", "OpenAI", "Other"],
          "Mechanical": ["Tata Motors", "Mahindra", "L&T", "Bosch", "Maruti", "Other"],
          "Civil": ["L&T", "NHAI", "DLF", "Shapoorji", "Other"],
          "Electrical": ["BHEL", "Siemens", "ABB", "Power Grid", "Other"],
          "Electronics": ["Qualcomm", "Samsung", "Intel", "ISRO", "Other"],
          "Biotechnology": ["Biocon", "Dr. Reddy's", "Cipla", "Other"],
        }
      },
      "Off-Campus Hiring": {
        branches: {
          "Computer Science": ["Flipkart", "Zomato", "CRED", "Razorpay", "PhonePe", "Meesho", "Other"],
          "AI / ML": ["Sarvam AI", "Krutrim", "Ola", "Flipkart", "Other"],
          "Mechanical": ["Ola Electric", "Tata Motors", "Hero", "Other"],
          "Electronics": ["Ola Electric", "ISRO", "DRDO", "Other"],
        }
      },
      "Startup Jobs": {
        branches: {
          "Computer Science": ["Zomato", "Swiggy", "CRED", "Razorpay", "PhonePe", "Zepto", "Other"],
          "AI / ML": ["Sarvam AI", "Krutrim", "Ola", "Other"],
          "Mechanical": ["Ola Electric", "Simple Energy", "Other"],
          "Electronics": ["Ola Electric", "Other"],
        }
      },
    }
  },
  "Government Jobs": {
    icon: "🏛️",
    subcategories: {
      "Haryana Government": { branches: ["Teacher", "Police", "Clerk", "D Group", "Patwari", "Judiciary", "Health Department", "HSSC Jobs"], companies: [] },
      "Central Government": { branches: ["IAS", "IPS", "IFS", "IRS", "UPSC CSE"], companies: [] },
      "Banking": { branches: ["SBI PO", "IBPS PO", "RBI Grade B", "SBI Clerk", "IBPS Clerk"], companies: [] },
      "Railway": { branches: ["RRB NTPC", "RRB Group D", "RRB JE", "RRB ALP"], companies: [] },
      "Defence": { branches: ["NDA", "CDS", "AFCAT", "Indian Army", "Indian Navy", "Indian Air Force"], companies: [] },
      "SSC": { branches: ["SSC CGL", "SSC CHSL", "SSC MTS", "SSC GD", "SSC CPO"], companies: [] },
      "State PSC": { branches: ["UPPSC", "MPPSC", "BPSC", "RPSC", "KPSC"], companies: [] },
    }
  },
  "Medical": {
    icon: "🏥",
    subcategories: {
      "NEET UG": { branches: ["MBBS", "BDS", "BAMS", "BHMS", "BUMS"], companies: [] },
      "NEET PG": { branches: ["MD", "MS", "MDS", "DNB"], companies: [] },
      "Hospital Jobs": { branches: ["Doctor", "Nurse", "Pharmacist", "Lab Technician", "Radiologist"], companies: ["AIIMS", "Apollo", "Fortis", "Max Hospital", "Other"] },
      "UPSC Medical": { branches: ["UPSC CMS", "State Medical Services"], companies: [] },
    }
  },
  "Law": {
    icon: "⚖️",
    subcategories: {
      "CLAT": { branches: ["LLB", "LLM", "BA LLB", "BBA LLB"], companies: [] },
      "Judiciary": { branches: ["Civil Judge", "Magistrate", "District Judge"], companies: [] },
      "Law Firms": { branches: ["Corporate Law", "Criminal Law", "IPR", "Tax Law"], companies: ["Cyril Amarchand", "AZB & Partners", "Trilegal", "Other"] },
      "AIBE": { branches: ["Bar Council Exam"], companies: [] },
    }
  },
  "MBA / Management": {
    icon: "📊",
    subcategories: {
      "CAT Preparation": { branches: ["IIM Ahmedabad", "IIM Bangalore", "IIM Calcutta", "IIM Lucknow", "Other IIMs"], companies: [] },
      "Campus Placements": { branches: ["Finance", "Marketing", "Operations", "HR", "Consulting"], companies: ["McKinsey", "BCG", "Bain", "Goldman Sachs", "JP Morgan", "Other"] },
      "GMAT / GRE": { branches: ["Harvard", "Wharton", "Stanford GSB", "INSEAD", "Other"], companies: [] },
    }
  },
  "Teaching": {
    icon: "📚",
    subcategories: {
      "School Teaching": { branches: ["Primary Teacher", "TGT", "PGT", "Special Educator"], companies: [] },
      "College Professor": { branches: ["Assistant Professor", "Associate Professor", "NET/SET"], companies: [] },
      "Coaching Institute": { branches: ["JEE", "NEET", "UPSC", "Banking", "SSC"], companies: ["Allen", "Aakash", "Unacademy", "BYJU'S", "Other"] },
      "CTET / STET": { branches: ["Paper 1", "Paper 2", "State TET"], companies: [] },
    }
  },
  "Startup / Business": {
    icon: "🚀",
    subcategories: {
      "Founding Team": { branches: ["Co-Founder", "CTO", "CPO", "CMO"], companies: [] },
      "Early Stage Jobs": { branches: ["Product Manager", "Growth Hacker", "Full Stack Dev", "Data Scientist"], companies: ["Y Combinator", "Sequoia", "Other Startups"] },
      "Freelancing": { branches: ["Web Development", "Design", "Content", "Marketing", "Consulting"], companies: [] },
    }
  },
  "General Corporate": {
    icon: "🏢",
    subcategories: {
      "Sales & Marketing": { branches: ["Business Development", "Digital Marketing", "Brand Manager", "Sales Executive"], companies: ["HUL", "P&G", "Nestle", "ITC", "Other"] },
      "Finance & Accounts": { branches: ["CA", "CFA", "Financial Analyst", "Accountant"], companies: ["Deloitte", "PwC", "EY", "KPMG", "Other"] },
      "HR": { branches: ["HR Executive", "Talent Acquisition", "HR Business Partner"], companies: [] },
      "Operations": { branches: ["Supply Chain", "Logistics", "Project Manager"], companies: [] },
    }
  },
};

const categoryImages = {
  "Engineering": engImg,
  "Government Jobs": govtImg,
  "Medical": medImg,
  "MBA / Management": mbaImg,
  "Teaching": teachImg,
  "Startup / Business": startupImg,
  "General Corporate": hrImg,
  "Law": mmImg,
};

const features = [
  { icon: <MdOutlineUploadFile size={28} />, title: "Upload Resume", desc: "AI generates personalized interview questions from your resume" },
  { icon: <BsCameraVideo size={28} />, title: "AI Interview", desc: "Face-to-face AI interview with real-time proctoring" },
  { icon: <MdSecurity size={28} />, title: "Proctored", desc: "Tab switch, face detection, noise alerts" },
  { icon: <MdOutlineAnalytics size={28} />, title: "Detailed Analysis", desc: "Confidence score, correctness, strong/weak topics" },
];

function CareerSelector({ onStart }) {
  const [step, setStep] = useState(0); // 0=category, 1=subcategory, 2=branch, 3=company
  const [selected, setSelected] = useState({ category: "", subcategory: "", branch: "", company: "" });

  const category = careerData[selected.category];
  const subcategory = category?.subcategories[selected.subcategory];
  // Engineering has branch->companies map, others have flat branches+companies
  const isEngineeringStyle = subcategory?.branches && !Array.isArray(subcategory.branches);
  const branchList = isEngineeringStyle ? Object.keys(subcategory.branches) : (subcategory?.branches || []);
  const companyList = isEngineeringStyle
    ? (subcategory?.branches[selected.branch] || [])
    : (subcategory?.companies || []);
  const hasCompanies = companyList.length > 0;

  const steps = ["Category", "Type", "Specialization", hasCompanies ? "Dream Company" : null].filter(Boolean);

  const handleCategory = (cat) => {
    setSelected({ category: cat, subcategory: "", branch: "", company: "" });
    setStep(1);
  };

  const handleSubcategory = (sub) => {
    setSelected(p => ({ ...p, subcategory: sub, branch: "", company: "" }));
    setStep(2);
  };

  const handleBranch = (branch) => {
    setSelected(p => ({ ...p, branch }));
    const hasCo = isEngineeringStyle
      ? (subcategory?.branches[branch]?.length > 0)
      : (subcategory?.companies?.length > 0);
    if (hasCo) setStep(3);
    else setStep(4);
  };

  const handleCompany = (company) => {
    setSelected(p => ({ ...p, company }));
    setStep(4);
  };

  const reset = () => { setStep(0); setSelected({ category: "", subcategory: "", branch: "", company: "" }); };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Choose Your Path</h2>
        <p className="text-gray-500">Select your goal and we'll prepare a personalized interview experience</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center flex-wrap gap-2 mb-8 sm:mb-10">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${i < step ? "bg-black text-white" : i === step ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}`}>
              {i < step ? <MdCheck size={12} /> : <span>{i + 1}</span>}
              {s}
            </div>
            {i < steps.length - 1 && <div className={`w-6 h-px ${i < step ? "bg-black" : "bg-gray-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* Step 0 — Category */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {Object.entries(careerData).map(([cat, val]) => (
                <button key={cat} onClick={() => handleCategory(cat)}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-black hover:shadow-md transition-all cursor-pointer group text-left">
                  <div className="w-full h-28 overflow-hidden">
                    <img src={categoryImages[cat]} alt={cat} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-3 flex items-center gap-2">
                    <span className="text-lg">{val.icon}</span>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-black">{cat}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 1 — Subcategory */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <p className="text-center text-sm text-gray-500 mb-6">You selected: <span className="font-semibold text-black">{selected.category}</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {Object.keys(category?.subcategories || {}).map((sub) => (
                <button key={sub} onClick={() => handleSubcategory(sub)}
                  className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-black hover:shadow-md transition-all cursor-pointer">
                  <p className="text-sm font-semibold text-gray-800">{sub}</p>
                </button>
              ))}
            </div>
            <button onClick={reset} className="flex items-center gap-1 text-sm text-gray-400 hover:text-black mt-6 mx-auto cursor-pointer transition">
              <MdArrowBack size={16} /> Back
            </button>
          </motion.div>
        )}

        {/* Step 2 — Branch */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <p className="text-center text-sm text-gray-500 mb-6">
              <span className="font-semibold text-black">{selected.category}</span> → <span className="font-semibold text-black">{selected.subcategory}</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {subcategory?.branches && branchList.map((branch) => (
                <button key={branch} onClick={() => handleBranch(branch)}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-700 hover:border-black hover:shadow-md transition-all cursor-pointer text-center">
                  {branch}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-black mt-6 mx-auto cursor-pointer transition">
              <MdArrowBack size={16} /> Back
            </button>
          </motion.div>
        )}

        {/* Step 3 — Company */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <p className="text-center text-sm text-gray-500 mb-6">Which company are you targeting?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {companyList.map((co) => (
                <button key={co} onClick={() => handleCompany(co)}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-700 hover:border-black hover:shadow-md transition-all cursor-pointer text-center">
                  {co}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-black mt-6 mx-auto cursor-pointer transition">
              <MdArrowBack size={16} /> Back
            </button>
          </motion.div>
        )}

        {/* Step 4 — Final CTA */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
            className="bg-white border border-gray-200 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-sm">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your Path is Ready!</h3>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {[selected.category, selected.subcategory, selected.branch, selected.company].filter(Boolean).map((s, i) => (
                <span key={i} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 text-left">
              {["Mock Interview", "Interview Questions", "Resume Guidance", "Preparation Roadmap", "Eligibility Guidance", "Improvement Suggestions"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <MdCheck size={14} className="text-green-500 flex-shrink-0" /> {item}
                </div>
              ))}
            </div>
            <button onClick={() => onStart(selected)}
              className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition cursor-pointer flex items-center justify-center gap-2">
              Start My Interview Preparation <MdArrowForward size={18} />
            </button>
            <button onClick={reset} className="text-sm text-gray-400 hover:text-black mt-3 cursor-pointer transition block mx-auto">
              ← Change Selection
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const handleCareerStart = (selected) => {
    if (!user) { navigate("/auth"); return; }
    navigate("/upload-resume", { state: { careerPath: selected } });
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="w-full px-4 sm:px-8 py-4 flex items-center justify-between bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-2 rounded-lg"><TbRobot size={20} /></div>
          <span className="font-bold text-lg">Auto_Interview</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {user && <span className="hidden sm:inline text-sm text-gray-600">Credits: <span className="font-bold text-black">{user.credits}</span></span>}
          {user && (
            <div onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-gray-800 transition overflow-hidden">
              {user.picture ? <img src={user.picture} alt="avatar" className="w-full h-full object-cover" /> : (user.name?.[0] || "U").toUpperCase()}
            </div>
          )}
          <button onClick={() => navigate(user ? "/upload-resume" : "/auth")}
            className="bg-black text-white px-4 sm:px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition cursor-pointer">
            {user ? "Start" : "Get Started"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
          AI-Powered Interview <br /> Practice Platform
        </h1>
        <p className="text-gray-500 text-base sm:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto">
          Upload your resume, get personalized questions, practice with an AI interviewer, and receive detailed performance analysis.
        </p>
        <button onClick={() => navigate(user ? "/upload-resume" : "/auth")}
          className="bg-black text-white px-8 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition cursor-pointer">
          {user ? "Start Interview →" : "Get Started Free →"}
        </button>
      </motion.div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 sm:pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {features.map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} viewport={{ once: true }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="bg-gray-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">{f.icon}</div>
            <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Career Selector */}
      <div className="bg-white border-t border-gray-100">
        <CareerSelector onStart={handleCareerStart} />
      </div>

      {/* How it works */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "01", title: "Upload Resume", desc: "Upload your PDF resume", img: resumeImg },
              { step: "02", title: "AI Interview", desc: "Answer AI questions on camera", img: aiImg },
              { step: "03", title: "Get Results", desc: "Detailed performance analysis", img: confiImg },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                className="flex flex-col items-center">
                <span className="text-4xl font-bold text-gray-200 mb-3">{s.step}</span>
                <img src={s.img} alt={s.title} className="w-16 h-16 object-contain mb-3" />
                <h3 className="font-semibold text-gray-800 mb-1">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Home;
