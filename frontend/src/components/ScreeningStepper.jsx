import { useNavigate } from "react-router-dom"
import { ClipboardList, Video, Activity, Award, ArrowLeft, CheckCircle2 } from "lucide-react"
import { getCurrentScreeningSession } from "../utils/supabaseClient"

export default function ScreeningStepper({ currentStep = 1 }) {
  const navigate = useNavigate()
  const session = getCurrentScreeningSession()
  const patient = session?.patient

  const steps = [
    {
      num: 1,
      title: "Knee Questions",
      subtitle: "Pain & Daily Habits",
      time: "2 mins",
      icon: ClipboardList,
      route: "/assessment",
      completed: !!session?.steps?.step1?.completed
    },
    {
      num: 2,
      title: "Movement Check",
      subtitle: "Simple 30s Stand Test",
      time: "30 secs",
      icon: Video,
      route: "/movement",
      completed: !!session?.steps?.step2?.completed
    },
    {
      num: 3,
      title: "Joint Sound",
      subtitle: "Knee Sound & Vibration",
      time: "1 min",
      icon: Activity,
      route: "/analysis",
      completed: !!session?.steps?.step3?.completed
    },
    {
      num: 4,
      title: "Your Results",
      subtitle: "Clear Summary & Advice",
      time: "Instant",
      icon: Award,
      route: "/results",
      completed: !!session?.steps?.step4?.completed
    }
  ]

  return (
    <div className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-xs">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Return to Hub & Patient badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={() => navigate("/screening")}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg px-3 py-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Knee Hub</span>
          </button>

          {patient && (
            <div className="text-xs sm:text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              <span className="font-bold text-slate-900">{patient.name || "Patient"}</span>
              <span className="text-slate-500 font-medium">({patient.gender || "Female"}, {patient.age || 55}y)</span>
            </div>
          )}
        </div>

        {/* Center: 4-Step Stepper Blocks */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full md:w-auto md:flex items-center">
          {steps.map((s, idx) => {
            const Icon = s.icon
            const isActive = currentStep === s.num
            const isCompleted = s.completed

            return (
              <div key={s.num} className="flex items-center">
                <button
                  type="button"
                  onClick={() => navigate(s.route)}
                  className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-left transition cursor-pointer ${
                    isActive
                      ? "bg-teal-50 border-teal-600 text-teal-950 font-bold shadow-xs ring-2 ring-teal-600/20"
                      : isCompleted
                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 hover:bg-emerald-100/60"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      isActive
                        ? "bg-teal-700 text-white"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <div className="hidden lg:block">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-extrabold leading-none">{s.title}</p>
                      <span className="text-[10px] text-slate-500 font-medium">{s.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">{s.subtitle}</p>
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`hidden md:block w-3 h-0.5 mx-1 ${isCompleted ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
