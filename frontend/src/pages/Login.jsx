import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Phone, 
  User, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Building2, 
  Mail, 
  ArrowLeft,
  CheckCircle2,
  Stethoscope
} from "lucide-react"

function Login() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("signin") // "signin" | "signup"
  
  // Sign In State
  const [username, setUsername] = useState("invictus")
  const [password, setPassword] = useState("invictus@11")
  const [showPassword, setShowPassword] = useState(false)
  
  // Sign Up State
  const [fullName, setFullName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPhone, setSignupPhone] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [role, setRole] = useState("Medical Officer / Doctor")
  const [state, setState] = useState("Assam")
  const [healthCenter, setHealthCenter] = useState("GMCH Guwahati")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // 1. Attempt backend API authentication if available
      const response = await fetch("/api/v1/auth/login-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("sandhi_token", data.access_token)
        localStorage.setItem("sandhi_user", JSON.stringify({
          username: data.username,
          full_name: data.full_name || "Dr. " + data.username,
          role: data.role || "Doctor",
          state: data.state || "Assam",
          phone: ""
        }))
        navigate("/dashboard")
        return
      }

      // 2. Demo / Default Admin Credentials (invictus / invictus@11)
      if (username === "invictus" && password === "invictus@11") {
        localStorage.setItem("sandhi_user", JSON.stringify({
          username: "invictus",
          full_name: "Dr. Invictus Barman",
          role: "Nodal Orthopedic Officer",
          state: "Assam",
          phone: "+91 98640 11000",
          center: "GMCH Guwahati"
        }))
        navigate("/dashboard")
        return
      }

      // Check locally registered users
      const storedUsers = JSON.parse(localStorage.getItem("sandhi_registered_users") || "[]")
      const matched = storedUsers.find(u => (u.username === username || u.email === username) && u.password === password)
      if (matched) {
        localStorage.setItem("sandhi_user", JSON.stringify(matched))
        navigate("/dashboard")
        return
      }

      const errData = await response.json().catch(() => ({}))
      setError(errData.detail || "Invalid username or password")
    } catch {
      // Network fallback
      if (username === "invictus" && password === "invictus@11") {
        localStorage.setItem("sandhi_user", JSON.stringify({
          username: "invictus",
          full_name: "Dr. Invictus Barman",
          role: "Nodal Orthopedic Officer",
          state: "Assam",
          phone: "+91 98640 11000",
          center: "GMCH Guwahati"
        }))
        navigate("/dashboard")
      } else {
        setError("Invalid credentials. Use demo admin or create an account.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!fullName || !signupEmail || !signupPassword) {
      setError("Please fill in all required fields.")
      setLoading(false)
      return
    }

    const newUser = {
      username: signupEmail.split("@")[0],
      email: signupEmail,
      full_name: fullName,
      role: role,
      state: state,
      center: healthCenter,
      phone: signupPhone ? `+91 ${signupPhone}` : "+91 98000 00000",
      password: signupPassword
    }

    try {
      const storedUsers = JSON.parse(localStorage.getItem("sandhi_registered_users") || "[]")
      storedUsers.push(newUser)
      localStorage.setItem("sandhi_registered_users", JSON.stringify(storedUsers))
      localStorage.setItem("sandhi_user", JSON.stringify(newUser))

      setSuccessMsg("Account registered successfully! Redirecting to command hub...")
      setTimeout(() => {
        navigate("/dashboard")
      }, 800)
    } catch {
      localStorage.setItem("sandhi_user", JSON.stringify(newUser))
      navigate("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 px-4 py-8 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Return to Portal Button */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-teal-400 transition cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Portal Selection</span>
        </button>
        <span className="text-[11px] text-teal-500 font-mono bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
          Admin Gateway
        </span>
      </div>

      <div className="w-full max-w-md rounded-3xl bg-slate-900 p-7 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Branding Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-900/40 text-teal-400 font-bold text-2xl mb-3 shadow-inner ring-1 ring-teal-500/20">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Sandhi-AI Command Hub
          </h1>
          <p className="mt-1 text-xs text-teal-400 font-medium">
            Doctor, Specialist & MDoNER Admin Access
          </p>
        </div>

        {/* Dual Tab Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setActiveTab("signin"); setError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "signin"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("signup"); setError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "signup"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Demo Credentials Fast-Fill */}
        {activeTab === "signin" && (
          <div className="mb-5 rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs text-slate-300 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200">Demo Admin:</span>
              <span className="ml-1 font-mono text-teal-400">invictus</span> / <span className="font-mono text-teal-400">invictus@11</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setUsername("invictus")
                setPassword("invictus@11")
              }}
              className="text-[11px] font-bold text-teal-400 hover:text-teal-300 underline ml-2 transition-colors cursor-pointer"
            >
              Auto-fill
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-950/40 border border-red-500/40 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 p-3 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {activeTab === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Username or Official Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. invictus or doctor@gmch.gov.in"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 py-3 font-bold text-sm text-white disabled:opacity-50 transition-colors cursor-pointer shadow-lg shadow-teal-900/30"
            >
              {loading ? "Verifying..." : "Access Admin Command Hub"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Full Name & Title
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Stethoscope size={16} />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. P. K. Hazarika"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="doctor@hospital.gov.in"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">
                  NER State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="Assam">Assam</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Sikkim">Sikkim</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">
                  Hospital / Center
                </label>
                <input
                  type="text"
                  value={healthCenter}
                  onChange={(e) => setHealthCenter(e.target.value)}
                  placeholder="e.g. GMCH Guwahati"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Contact Phone
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-700 bg-slate-950 text-slate-400 text-xs">
                  +91
                </span>
                <input
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full rounded-r-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Create Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showSignupPassword ? "text" : "password"}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-10 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 py-3 font-bold text-sm text-white disabled:opacity-50 transition-colors cursor-pointer shadow-lg shadow-teal-900/30"
            >
              {loading ? "Registering..." : "Register Clinical Officer"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        {/* Quick link to Patient Portal */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Looking to take the knee health screening test?
          </p>
          <button
            type="button"
            onClick={() => navigate("/registration")}
            className="mt-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition cursor-pointer"
          >
            Go to Patient Screening Portal →
          </button>
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-500">
          MDoNER Healthcare Screening Platform &bull; Problem Statement 26004
        </p>

      </div>
    </div>
  )
}

export default Login
