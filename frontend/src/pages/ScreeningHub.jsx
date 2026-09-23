import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  ClipboardList,
  Video,
  Activity,
  Award,
  ArrowRight,
  CheckCircle2,
  Clock,
  User,
  History,
  AlertCircle,
  RefreshCw,
  LogOut,
  Stethoscope,
  ChevronRight,
  PhoneCall,
  HeartPulse,
  HelpCircle,
  Smile
} from "lucide-react"
import Navbar from "../components/Navbar"
import {
  getCurrentScreeningSession,
  resetScreeningSession,
  getActiveUser,
  logoutUser
} from "../utils/supabaseClient"
import { getAllScreenings } from "../utils/screeningsStore"

export default function ScreeningHub() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [pastScreenings, setPastScreenings] = useState([])

  useEffect(() => {
    const user = getActiveUser()
    setCurrentUser(user)
    const currentSess = getCurrentScreeningSession()
    setSession(currentSess)

    const all = getAllScreenings()
    if (user) {
      const userTests = all.filter(s => 
        (s.patient?.name && user.name && s.patient.name.toLowerCase() === user.name.toLowerCase()) ||
        (s.patient?.phone && user.phone && s.patient.phone === user.phone) ||
        (s.patient?.id && user.id && s.patient.id === user.id)
      )
      setPastScreenings(userTests)
    } else {
      setPastScreenings(all.slice(0, 3))
    }
  }, [])

  const handleStartNew = () => {
    if (window.confirm("Start a new checkup? Your patient information will be saved.")) {
      const fresh = resetScreeningSession()
      setSession(fresh)
    }
  }

  const patient = session?.patient || currentUser || {
    name: "Bimla Karmakar",
    age: 58,
    gender: "Female",
    height: 158,
    weight: 62,
    state: "Assam",
    district: "Kamrup",
    joint: "Right Knee"
  }
  const steps = session?.steps || {}

  // Calculate completion
  const completedCount = [
    steps.step1?.completed,
    steps.step2?.completed,
    steps.step3?.completed,
    steps.step4?.completed
  ].filter(Boolean).length
  const progressPercent = Math.round((completedCount / 4) * 100)

  // Find next step to take
  const nextStepRoute = !steps.step1?.completed
    ? "/assessment"
    : !steps.step2?.completed
    ? "/movement"
    : !steps.step3?.completed
    ? "/analysis"
    : "/results"

  const nextStepTitle = !steps.step1?.completed
    ? "Step 1: Knee Questions"
    : !steps.step2?.completed
    ? "Step 2: 30-Second Movement Test"
    : !steps.step3?.completed
    ? "Step 3: Joint Sound Check"
    : "View Final Results & Advice"

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full space-y-6 sm:space-y-8">
        
        {/* Welcome & Patient Header */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 text-xl font-bold shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Welcome, {patient.name || "Patient"}
                  </h1>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 font-bold border border-teal-200">
                    Knee Checkup Hub
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 flex-wrap font-medium">
                  <span>Age: <strong>{patient.age || 58} years</strong></span>
                  <span>&bull;</span>
                  <span>Gender: <strong>{patient.gender || "Female"}</strong></span>
                  <span>&bull;</span>
                  <span>Location: <strong>{patient.state || "Assam"}, {patient.district || "Kamrup"}</strong></span>
                  <span>&bull;</span>
                  <span>Joint: <strong className="text-teal-800">{patient.joint || "Right Knee"}</strong></span>
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  You can complete these 4 simple steps at your own pace. Spoken audio is available on every step.
                </p>
              </div>
            </div>

            {/* Quick Action & Progress Box */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-5 md:w-72 shrink-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-teal-900 mb-2">
                  <span>Your Progress</span>
                  <span className="text-sm font-extrabold">{progressPercent}%</span>
                </div>
                <div className="w-full h-3 bg-teal-200/60 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-teal-700 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-teal-800 font-medium">
                  {completedCount} of 4 steps completed
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(nextStepRoute)}
                className="mt-4 w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>{nextStepTitle}</span>
                <ArrowRight size={16} />
              </button>
            </div>

          </div>
        </section>

        {/* 4 Step Cards for Patient / Senior */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-700" />
              <span>Your Knee Checkup Steps</span>
            </h2>
            <button
              onClick={handleStartNew}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1 px-3 bg-white border border-slate-200 rounded-lg shadow-2xs cursor-pointer"
              title="Reset progress to start over"
            >
              <RefreshCw size={13} />
              <span>Start Over</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Step 1 Card */}
            <div
              onClick={() => navigate("/assessment")}
              className={`rounded-2xl border p-5 sm:p-6 transition-all cursor-pointer bg-white flex flex-col justify-between hover:shadow-md ${
                steps.step1?.completed
                  ? "border-emerald-300 ring-1 ring-emerald-400/30"
                  : "border-slate-200 hover:border-teal-500"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-teal-700 text-white text-sm font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Takes 2 Minutes</span>
                  </div>
                  {steps.step1?.completed ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-700" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      Not Started
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Step 1: Knee Pain & Daily Habits Questions
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  5 simple questions about where your knee hurts when walking, climbing stairs, or resting at night.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-teal-800">
                <span>{steps.step1?.completed ? "Review Answers" : "Start Questions ➔"}</span>
                <ChevronRight size={18} />
              </div>
            </div>

            {/* Step 2 Card */}
            <div
              onClick={() => navigate("/movement")}
              className={`rounded-2xl border p-5 sm:p-6 transition-all cursor-pointer bg-white flex flex-col justify-between hover:shadow-md ${
                steps.step2?.completed
                  ? "border-emerald-300 ring-1 ring-emerald-400/30"
                  : "border-slate-200 hover:border-teal-500"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-teal-700 text-white text-sm font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Takes 30 Seconds</span>
                  </div>
                  {steps.step2?.completed ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-700" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      Ready
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Step 2: 30-Second Chair Stand Test
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Stand up and sit down safely from a sturdy chair. A video demo shows you exactly how to do it at your own speed.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-teal-800">
                <span>{steps.step2?.completed ? "Retake Movement Test" : "Start 30s Stand Test ➔"}</span>
                <ChevronRight size={18} />
              </div>
            </div>

            {/* Step 3 Card */}
            <div
              onClick={() => navigate("/analysis")}
              className={`rounded-2xl border p-5 sm:p-6 transition-all cursor-pointer bg-white flex flex-col justify-between hover:shadow-md ${
                steps.step3?.completed
                  ? "border-emerald-300 ring-1 ring-emerald-400/30"
                  : "border-slate-200 hover:border-teal-500"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-teal-700 text-white text-sm font-bold flex items-center justify-center">
                      3
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Takes 1 Minute</span>
                  </div>
                  {steps.step3?.completed ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-700" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      Ready
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Step 3: Knee Sound & Joint Check
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Checks for knee clicking, grinding, or popping sounds during movement.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-teal-800">
                <span>{steps.step3?.completed ? "Review Joint Check" : "Check Joint Sounds ➔"}</span>
                <ChevronRight size={18} />
              </div>
            </div>

            {/* Step 4 Card */}
            <div
              onClick={() => navigate("/results")}
              className={`rounded-2xl border p-5 sm:p-6 transition-all cursor-pointer bg-white flex flex-col justify-between hover:shadow-md ${
                steps.step4?.completed
                  ? "border-emerald-300 ring-1 ring-emerald-400/30"
                  : "border-slate-200 hover:border-teal-500"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-teal-700 text-white text-sm font-bold flex items-center justify-center">
                      4
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Instant</span>
                  </div>
                  {steps.step4?.completed ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-700" />
                      Report Ready
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      View Advice
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Step 4: Your Knee Results & Care Plan
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Clear, plain-language summary of your knee health, home exercises, and advice on when to consult a doctor.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-teal-800">
                <span>View Full Results & Advice ➔</span>
                <ChevronRight size={18} />
              </div>
            </div>

          </div>
        </section>

        {/* Elderly & Caregiver Assistance Box */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Smile size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Tips for Elderly Citizens & Caregivers
              </h4>
              <p className="text-xs text-amber-900 font-medium">
                Take your time! There is no rush. If you feel any sharp pain or unsteadiness during the movement test, stop immediately and rest.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:18001036004"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 transition shadow-2xs"
            >
              <PhoneCall size={14} className="text-amber-700" />
              <span>Call Helpline: 1800-103-6004</span>
            </a>
          </div>
        </section>

        {/* Past Screenings Table if any */}
        {pastScreenings.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-700" />
                <span>Your Past Knee Checks</span>
              </h3>
              <span className="text-xs text-slate-500">{pastScreenings.length} records saved</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Condition Level</th>
                    <th className="py-2.5 px-3">Reps</th>
                    <th className="py-2.5 px-3">Action Recommended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {pastScreenings.map((sc, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500">
                        {sc.timestamp ? new Date(sc.timestamp).toLocaleDateString() : "Recent"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {sc.patient?.name || "Patient"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          sc.scores?.riskCategory === "HIGH" 
                            ? "bg-rose-100 text-rose-800"
                            : sc.scores?.riskCategory === "MODERATE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {sc.scores?.riskCategory || "MODERATE"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {sc.scores?.sitToStandReps ?? 8} reps
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {sc.clinicalAction || "Home Exercises & Lifestyle"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </main>

    </div>
  )
}
