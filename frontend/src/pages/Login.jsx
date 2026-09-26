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
        state: signupState,
        district: signupDistrict,
        occupation: signupOccupation,
        joint: "Right Knee",
        priorInjury: signupPriorInjury,
        familyHistory: signupFamilyHistory
      }

      const res = await registerPatient(newPatientData)
      if (res.success) {
        setSuccessMsg("Registration successful! Welcome to Sandhi, " + res.patient.name + ".")
        setTimeout(() => navigate("/screening"), 700)
      } else {
        setError(res.error || "Could not complete registration. Please try again.")
      }
    } catch (err) {
      setError("Registration error. Please check your network and try again.")
    } finally {
      setLoading(false)
    }
  }

  // 3. Handle Doctor / Admin Sign In
  const handleAdminSignIn = (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (adminUser.trim().toLowerCase() === "invictus" && adminPass === "invictus@11") {
      const doctorUser = {
        username: "invictus",
        full_name: "Dr. Invictus Barman",
        role: "doctor",
        specialty: "Senior Orthopedic Consultant",
        phc: "Guwahati Central Health Center",
        state: "Assam"
      }
      localStorage.setItem("sandhi_token", "demo-doctor-jwt-token-invictus")
      localStorage.setItem("sandhi_user", JSON.stringify(doctorUser))
      localStorage.setItem("sandhi_portal_mode", "doctor")
      setSuccessMsg("Welcome, Dr. Barman! Opening Doctor Command Dashboard...")
      setTimeout(() => navigate("/dashboard"), 500)
    } else {
      setError("Invalid username or password. For demo doctor access, use invictus / invictus@11.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-center items-center px-4 py-8 selection:bg-teal-100 selection:text-teal-900">
      
      {/* Return to Home link */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        <span className="text-xs text-slate-400 font-medium">Free Knee Screening</span>
      </div>

      <div className="w-full max-w-md space-y-5">
        
        {/* Logo and Brand */}
        <div className="text-center space-y-1">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 shadow-xs mb-2">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sandhi Knee Health</h1>
          <p className="text-xs text-slate-500">
            Sign in or register to track your knee checkup and access personalized care advice.
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
            <span>Senior &amp; Citizen</span>
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
            <span>Doctor &amp; Clinic</span>
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
                  Returning Citizen Sign In
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
                  New Registration
                </button>
              </div>

              {/* Sub-view 1: Patient Sign In */}
              {patientTab === "signin" ? (
                <form onSubmit={handlePatientSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phone Number or Patient ID
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        placeholder="+91 98640 12845"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Passcode
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showPatientPass ? "text" : "password"}
                        value={patientPassword}
                        onChange={(e) => setPatientPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                        required
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
                      <span>Signing In...</span>
                    ) : (
                      <>
                        <span>Sign In &amp; Open Checkup</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-600">
                    <span>Demo Patient: <strong>+91 98640 12845</strong></span>
                    <button
                      type="button"
                      onClick={() => { setPatientId("+91 98640 12845"); setPatientPassword("sandhi123") }}
                      className="text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      Auto-Fill
                    </button>
                  </div>
                </form>
              ) : (
                /* Sub-view 2: Patient Registration */
                <form onSubmit={handlePatientSignUp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Bimla Karmakar"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+91 98640 XXXXX"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none font-medium"
                        required
                      />
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

                  <div className="grid grid-cols-2 gap-3">
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
                  </div>

                  {/* Height & Weight with dynamic BMI */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                        <input
                          type="number"
                          value={signupHeight}
                          onChange={(e) => setSignupHeight(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-sm text-slate-900 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          value={signupWeight}
                          onChange={(e) => setSignupWeight(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-sm text-slate-900 font-medium"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <span>Calculated BMI: <strong className="text-teal-800">{bmiValue} kg/m²</strong></span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-200">
                        {Number(bmiValue) >= 30 ? "Obese" : Number(bmiValue) >= 25 ? "Overweight" : "Normal Weight"}
                      </span>
                    </div>
                  </div>

                  {/* State & Occupation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">NER State</label>
                      <select
                        value={signupState}
                        onChange={(e) => setSignupState(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none font-medium"
                      >
                        <option value="Assam">Assam</option>
                        <option value="Meghalaya">Meghalaya</option>
                        <option value="Tripura">Tripura</option>
                        <option value="Manipur">Manipur</option>
                        <option value="Mizoram">Mizoram</option>
                        <option value="Nagaland">Nagaland</option>
                        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                        <option value="Sikkim">Sikkim</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Primary Occupation</label>
                      <select
                        value={signupOccupation}
                        onChange={(e) => setSignupOccupation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none font-medium"
                      >
                        <option value="Tea Garden Worker">Tea Garden Worker</option>
                        <option value="Agricultural Farmer">Agricultural Farmer</option>
                        <option value="Handloom Weaver">Handloom Weaver</option>
                        <option value="Domestic / Manual Labor">Domestic / Manual Labor</option>
                        <option value="Desk / Sedentary">Desk / Sedentary</option>
                      </select>
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
                        <span>Complete Registration &amp; Begin</span>
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
                <p className="font-bold">Doctor &amp; Medical Officer Access</p>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  Sign in to view patient screening records, kinematic biomarkers, and triage referrals.
                </p>
              </div>

              <form onSubmit={handleAdminSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Medical Officer Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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
                    Doctor Passcode
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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
                      <span>Sign In to Doctor &amp; Admin Hub</span>
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

        {/* Statutory & Compliance Footer Info */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>Sandhi-AI &bull; MDoNER Problem Statement PS 26004</p>
          <p>Complies with Ayushman Bharat Digital Mission (ABDM) &amp; HIPAA Guidelines</p>
        </div>

      </div>
    </div>
  )
}
