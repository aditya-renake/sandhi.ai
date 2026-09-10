import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { 
  ArrowLeft, 
  ArrowRight, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Footprints, 
  Flame, 
  HeartPulse, 
  ClipboardCheck 
} from "lucide-react"

function Assessment() {
  const navigate = useNavigate()

  const [pain, setPain] = useState("")
  const [stiffness, setStiffness] = useState("")
  const [mobility, setMobility] = useState("")
  const [activity, setActivity] = useState("")
  const [validationError, setValidationError] = useState("")

  const getPainCategory = (val) => {
    const num = Number(val)
    if (val === "" || isNaN(num)) return null
    if (num === 0) return { label: "No Pain", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/60" }
    if (num <= 3) return { label: "Mild Pain", color: "text-teal-300 bg-teal-950/40 border-teal-800/60" }
    if (num <= 6) return { label: "Moderate Pain", color: "text-amber-400 bg-amber-950/40 border-amber-800/60" }
    if (num <= 9) return { label: "Severe Pain", color: "text-orange-400 bg-orange-950/40 border-orange-800/60" }
    return { label: "Extreme Pain", color: "text-rose-400 bg-rose-950/40 border-rose-800/60" }
  }

  const handleContinue = () => {
    if (!pain || !stiffness || !mobility || !activity) {
      setValidationError("Please complete all screening questions before proceeding.")
      return
    }

    setValidationError("")

    // Dynamic Clinical WOMAC Calculation (0 - 100)
    const painNum = Number(pain) || 0
    const painComponent = (painNum / 10) * 40
    const stiffnessComponent = stiffness === "severe" ? 25 : stiffness === "moderate" ? 15 : stiffness === "mild" ? 6 : 0
    const mobilityComponent = mobility === "immobile" ? 25 : mobility === "assisted" ? 18 : mobility === "difficulty" ? 8 : 0
    const activityComponent = activity === "bedridden" ? 10 : activity === "sedentary" ? 7 : activity === "moderate" ? 4 : 0

    const womacScore = Math.min(100, Math.round(painComponent + stiffnessComponent + mobilityComponent + activityComponent))

    const assessmentData = {
      pain,
      stiffness,
      mobility,
      activity,
      womacScore,
      painCategory: getPainCategory(pain)?.label || "Mild Pain"
    }

    localStorage.setItem("oaAssessment", JSON.stringify(assessmentData))
    localStorage.setItem("sandhi_womac", JSON.stringify(assessmentData))

    navigate("/movement", { state: { womacScore, assessmentData } })
  }

  const painCategory = getPainCategory(pain)

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 pb-16">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/registration")}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            aria-label="Back to Registration"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-900/40 text-teal-400 font-bold text-sm shadow-inner ring-1 ring-teal-500/20">
              OA
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight leading-tight">
                OA Care
              </h1>
              <p className="text-[10px] text-teal-400 font-medium uppercase tracking-wider">
                Clinical Symptom Assessment
              </p>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/70 border border-slate-700 text-xs text-slate-300">
          <ClipboardCheck size={14} className="text-teal-400" />
          <span>WOMAC &amp; Clinical Checklist</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl p-6 md:p-8 mt-4">

        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Activity size={14} className="text-teal-400" />
            Step 2 of 3 &bull; Risk Markers
          </div>
          <h2 className="text-3xl font-bold text-slate-100 tracking-tight">
            Symptom Assessment
          </h2>
          <p className="mt-2 text-slate-400 text-sm md:text-base max-w-2xl">
            Answer the following standardized clinical questions regarding patient pain intensity, joint stiffness, and functional limitations.
          </p>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="mb-6 rounded-xl bg-rose-950/40 border border-rose-800/60 p-4 text-sm text-rose-300 flex items-center gap-3 animate-in fade-in">
            <AlertCircle size={18} className="shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="space-y-6">

          {/* 1. PAIN ASSESSMENT CARD */}
          <section className="rounded-2xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden">
            <div className="border-b border-slate-700/80 bg-slate-800/50 px-6 py-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-lg text-teal-400">
                  <HeartPulse size={20} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-slate-100">
                    Joint Pain Severity
                  </h3>
                  <p className="text-xs text-slate-400">
                    How would you rate the patient's joint pain over the past 48 hours?
                  </p>
                </div>
              </div>

              {painCategory && (
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${painCategory.color} flex items-center gap-1.5`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span>Score: {pain} / 10 &bull; {painCategory.label}</span>
                </div>
              )}
            </div>

            <div className="p-6">
              {/* Pain Scale Bar & Buttons */}
              <div className="grid grid-cols-11 gap-1.5 sm:gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                  const isSelected = pain === String(level)
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        setPain(String(level))
                        setValidationError("")
                      }}
                      className={`h-12 sm:h-14 rounded-xl flex flex-col items-center justify-center font-semibold text-sm sm:text-base transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-teal-600 text-white border-teal-400 ring-2 ring-teal-500/30 shadow-lg shadow-teal-900/30 scale-105"
                          : "bg-slate-900/70 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-600 hover:text-slate-100"
                      }`}
                    >
                      <span>{level}</span>
                    </button>
                  )
                })}
              </div>

              {/* Scale descriptive labels */}
              <div className="mt-3 flex justify-between text-[11px] text-slate-400 font-medium px-1">
                <span className="text-emerald-400">0: No pain</span>
                <span>1-3: Mild</span>
                <span>4-6: Moderate</span>
                <span>7-9: Severe</span>
                <span className="text-rose-400">10: Extreme</span>
              </div>
            </div>
          </section>

          {/* 2. MORNING JOINT STIFFNESS */}
          <section className="rounded-2xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden">
            <div className="border-b border-slate-700/80 bg-slate-800/50 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-teal-400">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-slate-100">
                  Morning Joint Stiffness
                </h3>
                <p className="text-xs text-slate-400">
                  Is there morning joint stiffness lasting under or over 30 minutes after waking?
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 max-w-md">
                {[
                  { value: "yes", label: "Yes", desc: "Present upon waking" },
                  { value: "no", label: "No", desc: "No morning stiffness" },
                ].map((option) => {
                  const isSelected = stiffness === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setStiffness(option.value)
                        setValidationError("")
                      }}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/40 text-slate-100 shadow-md"
                          : "bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600"
                      }`}
                    >
                      <div>
                        <p className={`font-semibold text-base ${isSelected ? "text-teal-400" : "text-slate-100"}`}>
                          {option.label}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {option.desc}
                        </p>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 size={20} className="text-teal-400 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-600 shrink-0"></div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {/* 3. MOBILITY / STAIR DIFFICULTY */}
          <section className="rounded-2xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden">
            <div className="border-b border-slate-700/80 bg-slate-800/50 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-teal-400">
                <Footprints size={20} />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-slate-100">
                  Mobility Limitations
                </h3>
                <p className="text-xs text-slate-400">
                  Does the patient experience difficulty walking or climbing stairs?
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 max-w-md">
                {[
                  { value: "yes", label: "Yes", desc: "Difficulty reported" },
                  { value: "no", label: "No", desc: "Normal ambulation" },
                ].map((option) => {
                  const isSelected = mobility === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setMobility(option.value)
                        setValidationError("")
                      }}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/40 text-slate-100 shadow-md"
                          : "bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600"
                      }`}
                    >
                      <div>
                        <p className={`font-semibold text-base ${isSelected ? "text-teal-400" : "text-slate-100"}`}>
                          {option.label}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {option.desc}
                        </p>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 size={20} className="text-teal-400 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-600 shrink-0"></div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {/* 4. PHYSICAL ACTIVITY LEVEL */}
          <section className="rounded-2xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden">
            <div className="border-b border-slate-700/80 bg-slate-800/50 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-teal-400">
                <Flame size={20} />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-slate-100">
                  Physical Activity Level
                </h3>
                <p className="text-xs text-slate-400">
                  Select the patient's typical weekly routine and physical exertion level.
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { value: "low", label: "Low", desc: "Sedentary or minimal physical movement throughout the day" },
                  { value: "moderate", label: "Moderate", desc: "Regular walking, daily household chores, or light work" },
                  { value: "high", label: "High", desc: "Vigorous exercise, heavy manual labor, or agricultural work" },
                ].map((item) => {
                  const isSelected = activity === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setActivity(item.value)
                        setValidationError("")
                      }}
                      className={`p-5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/40 text-slate-100 shadow-md"
                          : "bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-semibold text-base ${isSelected ? "text-teal-400" : "text-slate-100"}`}>
                            {item.label}
                          </span>
                          {isSelected ? (
                            <CheckCircle2 size={18} className="text-teal-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-600"></div>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

        </div>

        {/* Navigation Actions */}
        <div className="mt-10 flex flex-col-reverse sm:flex-row justify-end gap-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate("/registration")}
            className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 px-6 py-3.5 font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors cursor-pointer"
          >
            Back to Registration
          </button>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-3.5 font-semibold text-white hover:bg-teal-500 transition-colors shadow-lg shadow-teal-900/20 cursor-pointer"
          >
            <span>Continue to Movement Analysis</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </main>

    </div>
  )
}

export default Assessment