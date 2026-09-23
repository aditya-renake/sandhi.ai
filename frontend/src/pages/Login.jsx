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
  ArrowLeft,
  CheckCircle2,
  HeartPulse
} from "lucide-react"
import { registerPatient, loginPatient } from "../utils/supabaseClient"

export default function Login() {
  const navigate = useNavigate()
  
  // Main Portal Selector: "patient" | "admin"
  const [portalMode, setPortalMode] = useState("patient")

  // Patient Sub-mode: "signin" | "signup"
  const [patientTab, setPatientTab] = useState("signin")
  
  // Patient Sign In State
  const [patientId, setPatientId] = useState("+91 98640 12845")
  const [patientPassword, setPatientPassword] = useState("sandhi123")
  const [showPatientPass, setShowPatientPass] = useState(false)

  // Patient Sign Up State
  const [signupName, setSignupName] = useState("")
  const [signupPhone, setSignupPhone] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupAge, setSignupAge] = useState(54)
  const [signupGender, setSignupGender] = useState("Female")
  const [signupHeight, setSignupHeight] = useState(158)
  const [signupWeight, setSignupWeight] = useState(62)
  const [signupState, setSignupState] = useState("Assam")
  const [signupDistrict, setSignupDistrict] = useState("Kamrup Metropolitan")
  const [signupOccupation, setSignupOccupation] = useState("Tea Garden Worker")
  const [signupPriorInjury, setSignupPriorInjury] = useState("No")
  const [signupFamilyHistory, setSignupFamilyHistory] = useState("No")

  // Doctor / Admin Sign In State
  const [adminUser, setAdminUser] = useState("invictus")
  const [adminPass, setAdminPass] = useState("invictus@11")
  const [showAdminPass, setShowAdminPass] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Calculate dynamic BMI for registration
  const bmiValue = signupHeight && signupWeight 
    ? (signupWeight / Math.pow(signupHeight / 100, 2)).toFixed(1)
    : "24.8"

  // 1. Handle Patient Login
  const handlePatientSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccessMsg("")

    try {
      const res = await loginPatient(patientId, patientPassword)
      if (res.success) {
        setSuccessMsg("Welcome back, " + res.patient.name + "! Opening your knee checkup...")
        setTimeout(() => navigate("/screening"), 600)
      } else {
        setError(res.error || "Could not find patient record. Please register below.")
      }
    } catch (err) {
      setError("Sign in error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // 2. Handle Patient Registration
  const handlePatientSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccessMsg("")

    if (!signupName.trim() || !signupPhone.trim()) {
      setError("Please provide at least your Name and Phone Number.")
      setLoading(false)
      return
    }

    try {
      const newPatientData = {
        name: signupName.trim(),
        phone: signupPhone.trim(),
        password: signupPassword.trim() || "sandhi123",
        age: Number(signupAge) || 54,
        gender: signupGender,
        height: Number(signupHeight) || 158,
        weight: Number(signupWeight) || 62,
        bmi: Number(bmiValue),
        state: signupState,
        district: signupDistrict,
        occupation: signupOccupation,
        priorInjury: signupPriorInjury,
        familyHistory: signupFamilyHistory,
        joint: "Right Knee"
      }

      const res = await registerPatient(newPatientData)
      if (res.success) {
        setSuccessMsg("Registration successful! Welcome, " + res.patient.name + ".")
        setTimeout(() => navigate("/screening"), 800)
      } else {
        setError(res.error || "Registration could not be completed.")
      }
    } catch (err) {
      setError("Registration error. Please verify input fields.")
    } finally {
      setLoading(false)
    }
  }

  // 3. Handle Admin / Doctor Login
  const handleAdminSignIn = (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccessMsg("")

    setTimeout(() => {
      if (adminUser.toLowerCase() === "invictus" && adminPass === "invictus@11") {
        setSuccessMsg("Doctor credentials verified. Opening Clinical Hub...")
        localStorage.setItem("sandhi_token", "admin_demo_jwt_2026")
        localStorage.setItem("sandhi_portal_mode", "doctor")
        localStorage.setItem("sandhi_user", JSON.stringify({
          username: "invictus",
          full_name: "Dr. Invictus (Medical Officer)",
          role: "orthopedic_lead",
          hospital: "GMCH Guwahati / MDoNER"
        }))
        setTimeout(() => navigate("/dashboard"), 700)
      } else {
        setError("Invalid Medical Officer credentials. Use invictus / invictus@11.")
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      <div className="w-full max-w-xl space-y-6">
        
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-800 hover:text-teal-950 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-sm mb-1">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Sign In to Sandhi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Community Knee Health & Osteoarthritis Care Portal
          </p>
        </div>

        {/* Top Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => { setPortalMode("patient"); setError(""); setSuccessMsg("") }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              portalMode === "patient"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Senior & Citizen</span>
          </button>
          <button
            type="button"
            onClick={() => { setPortalMode("admin"); setError(""); setSuccessMsg("") }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              portalMode === "admin"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Doctor & Clinic</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm font-medium text-rose-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Card Body */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* PATIENT PORTAL */}
          {portalMode === "patient" && (
            <div className="space-y-5">
              {/* Tab Switch: Sign In vs Sign Up */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => { setPatientTab("signin"); setError("") }}
                  className={`pb-3 text-xs sm:text-sm font-bold border-b-2 mr-6 transition cursor-pointer ${
                    patientTab === "signin"
                      ? "border-teal-700 text-teal-800"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Citizen Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setPatientTab("signup"); setError("") }}
                  className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
                    patientTab === "signup"
                      ? "border-teal-700 text-teal-800"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  New Patient Registration
                </button>
              </div>

              {/* Sign In Form */}
              {patientTab === "signin" && (
                <form onSubmit={handlePatientSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phone Number or Patient Name
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        placeholder="+91 98640 12845 or Bimla Karmakar"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Passcode / PIN (optional)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPatientPass ? "text" : "password"}
                        value={patientPassword}
                        onChange={(e) => setPatientPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPatientPass(!showPatientPass)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPatientPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <span>Loading Patient Record...</span>
                    ) : (
                      <>
                        <span>Sign In & Open Knee Hub</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <p className="text-xs text-slate-500">
                      Checking for the first time?{" "}
                      <button
                        type="button"
                        onClick={() => setPatientTab("signup")}
                        className="text-teal-700 font-bold hover:underline cursor-pointer"
                      >
                        Register New Patient
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* Sign Up Form */}
              {patientTab === "signup" && (
                <form onSubmit={handlePatientSignUp} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="e.g. Maya Sharma"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+91 98640 XXXXX"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                      <input
                        type="number"
                        value={signupAge}
                        onChange={(e) => setSignupAge(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none font-medium"
                        min="18"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                      <select
                        value={signupGender}
                        onChange={(e) => setSignupGender(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none font-medium"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Passcode</label>
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="sandhi123"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  {/* Height & Weight */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={signupHeight}
                        onChange={(e) => setSignupHeight(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-sm text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={signupWeight}
                        onChange={(e) => setSignupWeight(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-sm text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <span>Saving Patient Information...</span>
                    ) : (
                      <>
                        <span>Complete Registration & Begin</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* DOCTOR & CLINIC PORTAL */}
          {portalMode === "admin" && (
            <div className="space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900">
                <p className="font-bold">Doctor & Medical Officer Access</p>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  Sign in to view patient screening records, kinematic biomarkers, and triage referrals.
                </p>
              </div>

              <form onSubmit={handleAdminSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Medical Officer ID
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      placeholder="invictus"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Security Passcode
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showAdminPass ? "text" : "password"}
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Verifying Doctor Credentials...</span>
                  ) : (
                    <>
                      <span>Sign In to Doctor Hub</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-600">
                  <span>Demo Doctor: <strong>invictus / invictus@11</strong></span>
                  <button
                    type="button"
                    onClick={() => { setAdminUser("invictus"); setAdminPass("invictus@11") }}
                    className="text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
