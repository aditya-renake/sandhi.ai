import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { 
  ClipboardList, 
  Video, 
  Activity, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  User, 
  Calendar,
  AlertCircle,
  PhoneCall,
  History,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Smile
} from "lucide-react"
import { 
  getCurrentScreeningSession, 
  resetCurrentSession
} from "../utils/supabaseClient"
import { getScreenings } from "../utils/screeningsStore"

export default function ScreeningHub() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [pastScreenings, setPastScreenings] = useState([])

  useEffect(() => {
    // 1. Get or create current session
    const current = getCurrentScreeningSession()
    setSession(current)

    // 2. Load previous patient screenings for history
    const history = getScreenings()
    setPastScreenings(history)
  }, [])

  const handleStartNew = () => {
    if (window.confirm("Start a new screening session? Current progress will be archived.")) {
      const fresh = resetCurrentSession()
      setSession(fresh)
      navigate("/assessment")
    }
  }

  const patient = session?.patient || {
    name: "Bimla Karmakar",
    age: 58,
    gender: "Female",
    state: "Assam",
    district: "Kamrup Rural",
    joint: "Right Knee"
  }

  const steps = session?.steps || {}

  // Calculate completion percentage
  const completedCount = [
    steps.step1?.completed,
    steps.step2?.completed,
    steps.step3?.completed,
    steps.step4?.completed
  ].filter(Boolean).length

  const progressPercent = Math.round((completedCount / 4) * 100)

  // Find next actionable step
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
                className="mt-4 w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{completedCount === 0 ? "Start Screening" : "Continue Test"}</span>
                <ArrowRight size={16} />
              </button>
            </div>

          </div>
        </section>

        {/* 4 Screening Steps Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-900">
              The 4 Steps in Your Checkup
            </h2>
            <button
              onClick={handleStartNew}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              title="Reset progress to start from beginning"
            >
              <RotateCcw size={13} />
              <span>Start from beginning</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Step 1 */}
            <div 
              onClick={() => navigate("/assessment")}
              className={`rounded-2xl border p-5 transition cursor-pointer flex flex-col justify-between ${
                steps.step1?.completed 
                  ? "bg-emerald-50/50 border-emerald-300"
                  : "bg-white border-slate-200 hover:border-teal-500 hover:shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    steps.step1?.completed ? "bg-emerald-600 text-white" : "bg-teal-100 text-teal-800"
                  }`}>
                    {steps.step1?.completed ? <CheckCircle2 size={20} /> : <ClipboardList size={20} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Step 1 &bull; 2 mins</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">Knee Questions</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Simple multiple-choice questions about your knee pain during walking, stairs, and resting.
                    </p>
                  </div>
                </div>
                {steps.step1?.completed && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">Done</span>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-800 font-bold">
                <span>{steps.step1?.completed ? "Review Answers →" : "Answer Questions →"}</span>
                <span className="text-slate-400 font-normal">Audio available 🔊</span>
              </div>
            </div>

            {/* Step 2 */}
            <div 
              onClick={() => navigate("/movement")}
              className={`rounded-2xl border p-5 transition cursor-pointer flex flex-col justify-between ${
                steps.step2?.completed 
                  ? "bg-emerald-50/50 border-emerald-300"
                  : "bg-white border-slate-200 hover:border-teal-500 hover:shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    steps.step2?.completed ? "bg-emerald-600 text-white" : "bg-teal-100 text-teal-800"
                  }`}>
                    {steps.step2?.completed ? <CheckCircle2 size={20} /> : <Video size={20} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Step 2 &bull; 30 secs</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">Chair Stand Test</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Sit and stand up from a sturdy chair at your own pace. Video demonstration and voice counting included.
                    </p>
                  </div>
                </div>
                {steps.step2?.completed && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">Done</span>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-800 font-bold">
                <span>{steps.step2?.completed ? "Redo Test →" : "Open Camera Test →"}</span>
                <span className="text-slate-400 font-normal">Can be skipped if in pain</span>
              </div>
            </div>

            {/* Step 3 */}
            <div 
              onClick={() => navigate("/analysis")}
              className={`rounded-2xl border p-5 transition cursor-pointer flex flex-col justify-between ${
                steps.step3?.completed 
                  ? "bg-emerald-50/50 border-emerald-300"
                  : "bg-white border-slate-200 hover:border-teal-500 hover:shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    steps.step3?.completed ? "bg-emerald-600 text-white" : "bg-teal-100 text-teal-800"
                  }`}>
                    {steps.step3?.completed ? <CheckCircle2 size={20} /> : <Activity size={20} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Step 3 &bull; 1 min</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">Knee Sound Check</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Listens for clicks, grinding or vibrations inside your knee joint using your mobile microphone or sensor band.
                    </p>
                  </div>
                </div>
                {steps.step3?.completed && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">Done</span>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-800 font-bold">
                <span>{steps.step3?.completed ? "Review Joint Sound →" : "Check Knee Sounds →"}</span>
                <span className="text-slate-400 font-normal">Microphone / Demo</span>
              </div>
            </div>

            {/* Step 4 */}
            <div 
              onClick={() => navigate("/results")}
              className={`rounded-2xl border p-5 transition cursor-pointer flex flex-col justify-between ${
                steps.step4?.completed 
                  ? "bg-emerald-50/50 border-emerald-300"
                  : "bg-white border-slate-200 hover:border-teal-500 hover:shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    steps.step4?.completed ? "bg-emerald-600 text-white" : "bg-teal-100 text-teal-800"
                  }`}>
                    {steps.step4?.completed ? <CheckCircle2 size={20} /> : <Award size={20} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Step 4 &bull; Summary</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">Your Results & Advice</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      A clear, understandable breakdown of your knee joint health, risk level, and 4 daily habits for relief.
                    </p>
                  </div>
                </div>
                {steps.step4?.completed && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">Ready</span>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-800 font-bold">
                <span>View Full Summary & Advice →</span>
                <span className="text-slate-400 font-normal">Printable report</span>
              </div>
            </div>

          </div>
        </section>

        {/* Helpful Elderly & Caregiver Guidance Card */}
        <section className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
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
                    <th className="py-2.5 px-3">Action</th>
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
                        <button
                          onClick={() => navigate("/results")}
                          className="text-teal-700 hover:text-teal-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Report</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Statutory Clinical Disclaimer Banner */}
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950">Statutory Clinical Notice (MDoNER / ICMR Tele-Medicine Guidelines):</p>
            <p className="mt-0.5 text-amber-900">
              Sandhi-AI is an artificial intelligence-assisted triage and early knee osteoarthritis risk screening tool. It does not replace diagnostic clinical radiographs or formal consultation by an orthopedic surgeon.
            </p>
          </div>
        </div>

      </main>

    </div>
  )
}
