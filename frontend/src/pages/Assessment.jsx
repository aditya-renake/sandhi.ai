import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ScreeningStepper from "../components/ScreeningStepper"
import { 
  updateScreeningStep, 
  getCurrentScreeningSession,
  getActiveUser 
} from "../utils/supabaseClient"
import { 
  ClipboardCheck, 
  ArrowRight, 
  ArrowLeft, 
  Volume2, 
  AlertCircle, 
  Activity, 
  Briefcase, 
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  Shield,
  Heart,
  User,
  Scale
} from "lucide-react"
import { speakText } from "../utils/speech"

// WOMAC Questions with human conversational descriptions
const PAIN_QUESTIONS = [
  { id: "p1", title: "Walking on flat ground", desc: "Do your knees hurt when walking across a room or along a path?" },
  { id: "p2", title: "Going up or down stairs", desc: "Do your knees ache when climbing stairs or walking down a slope?" },
  { id: "p3", title: "At night in bed", desc: "Does knee pain disturb your sleep or ache while resting in bed?" },
  { id: "p4", title: "Sitting or resting in a chair", desc: "Do you feel knee pain when sitting down for a while?" },
  { id: "p5", title: "Standing up on your feet", desc: "Does your knee hurt when standing still and bearing your weight?" }
]

const STIFFNESS_QUESTIONS = [
  { id: "s1", title: "Morning stiffness when you wake up", desc: "Are your knees tight or hard to bend right after getting out of bed?" },
  { id: "s2", title: "Stiffness after sitting or resting", desc: "Do your knees feel stiff after sitting down for some time during the day?" }
]

const FUNCTION_QUESTIONS = [
  { id: "f1", title: "Walking down stairs", desc: "Difficulty walking down stairs or steps" },
  { id: "f2", title: "Walking up stairs", desc: "Difficulty climbing stairs or steps" },
  { id: "f3", title: "Getting up from a chair", desc: "Difficulty standing up after sitting in a chair" },
  { id: "f4", title: "Standing still", desc: "Difficulty remaining standing for more than 10 minutes" },
  { id: "f5", title: "Bending to the floor", desc: "Difficulty bending down to pick up an item from the floor" },
  { id: "f6", title: "Walking outside", desc: "Difficulty walking on roads or going to the market" },
  { id: "f7", title: "Getting in or out of a car / auto", desc: "Difficulty getting into or out of vehicles" },
  { id: "f8", title: "Carrying groceries / shopping", desc: "Difficulty carrying bags or groceries" },
  { id: "f9", title: "Putting on socks or slippers", desc: "Difficulty reaching down to wear shoes or slippers" },
  { id: "f10", title: "Getting out of bed", desc: "Difficulty rising from bed in the morning" },
  { id: "f11", title: "Taking off shoes or footwear", desc: "Difficulty removing footwear without help" },
  { id: "f12", title: "Turning in bed", desc: "Difficulty changing your sleeping position in bed" },
  { id: "f13", title: "Entering or leaving washroom", desc: "Difficulty stepping into bathroom or squatting" },
  { id: "f14", title: "Sitting for long periods", desc: "Difficulty sitting still for more than 30 minutes" },
  { id: "f15", title: "Using the toilet", desc: "Difficulty using western or Indian toilet" },
  { id: "f16", title: "Heavy domestic or farm work", desc: "Difficulty carrying buckets, farming, gardening or sweeping" },
  { id: "f17", title: "Light household work", desc: "Difficulty cooking, dusting, or light chores" }
]

const SEVERITY_LEVELS = [
  { value: 0, label: "None", sublabel: "No pain", bg: "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100" },
  { value: 1, label: "Mild", sublabel: "Slight ache", bg: "bg-teal-50 border-teal-300 text-teal-900 hover:bg-teal-100" },
  { value: 2, label: "Moderate", sublabel: "Noticeable", bg: "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100" },
  { value: 3, label: "Severe", sublabel: "A lot of pain", bg: "bg-orange-50 border-orange-300 text-orange-900 hover:bg-orange-100" },
  { value: 4, label: "Extreme", sublabel: "Cannot do", bg: "bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100" }
]

export default function Assessment() {
  const navigate = useNavigate()
  
  // Tab Navigation: 'pain' | 'stiffness' | 'function' | 'habits'
  const [activeTab, setActiveTab] = useState("pain")

  // Questionnaire Responses
  const [painAnswers, setPainAnswers] = useState(() => {
    const init = {}
    PAIN_QUESTIONS.forEach(q => { init[q.id] = 2 })
    return init
  })

  const [stiffnessAnswers, setStiffnessAnswers] = useState(() => {
    const init = {}
    STIFFNESS_QUESTIONS.forEach(q => { init[q.id] = 2 })
    return init
  })

  const [functionAnswers, setFunctionAnswers] = useState(() => {
    const init = {}
    FUNCTION_QUESTIONS.forEach(q => { init[q.id] = 2 })
    return init
  })

  // Patient Demographics & Profile
  const [patientData, setPatientData] = useState(() => {
    try {
      const stored = localStorage.getItem("sandhi_patient")
      return stored ? JSON.parse(stored) : {
        name: "Bimla Karmakar",
        age: 58,
        gender: "Female",
        state: "Assam",
        district: "Kamrup Rural",
        joint: "Right Knee"
      }
    } catch {
      return {
        name: "Bimla Karmakar",
        age: 58,
        gender: "Female",
        state: "Assam",
        district: "Kamrup Rural",
        joint: "Right Knee"
      }
    }
  })

  const [heightCm, setHeightCm] = useState(158)
  const [weightKg, setWeightKg] = useState(64)
  const [occupationType, setOccupationType] = useState("manual") // 'manual' | 'sedentary'
  const [priorInjury, setPriorInjury] = useState(false)
  const [familyHistory, setFamilyHistory] = useState(false)

  // Auto-load returning patient covariates from profile/session
  useEffect(() => {
    const user = getActiveUser()
    const session = getCurrentScreeningSession()
    const p = session?.patient || user
    if (p) {
      setPatientData(prev => ({
        ...prev,
        name: p.name || prev.name,
        age: p.age || prev.age,
        gender: p.gender || prev.gender,
        state: p.state || prev.state,
        district: p.district || prev.district,
        joint: p.joint || prev.joint
      }))
      if (p.height) setHeightCm(p.height)
      if (p.weight) setWeightKg(p.weight)
      if (p.occupation) setOccupationType(p.occupation.toLowerCase().includes("manual") || p.occupation.toLowerCase().includes("tea") ? "manual" : "sedentary")
      if (p.priorInjury !== undefined) setPriorInjury(typeof p.priorInjury === "boolean" ? p.priorInjury : String(p.priorInjury).toLowerCase().includes("yes"))
      if (p.familyHistory !== undefined) setFamilyHistory(typeof p.familyHistory === "boolean" ? p.familyHistory : String(p.familyHistory).toLowerCase().includes("yes"))
    }
  }, [])

  // Live BMI calculation
  const bmi = useMemo(() => {
    const heightM = heightCm / 100
    if (heightM <= 0) return 24.5
    return parseFloat((weightKg / (heightM * heightM)).toFixed(1))
  }, [heightCm, weightKg])

  // Scoring Logic
  const scoring = useMemo(() => {
    const painScore = Object.values(painAnswers).reduce((a, b) => a + b, 0)
    const stiffnessScore = Object.values(stiffnessAnswers).reduce((a, b) => a + b, 0)
    const functionScore = Object.values(functionAnswers).reduce((a, b) => a + b, 0)

    const totalWomac = painScore + stiffnessScore + functionScore
    const normalizedScore = Math.min(100, Math.round((totalWomac / 96.0) * 100.0))

    let category = "MILD"
    if (normalizedScore >= 60) category = "SEVERE"
    else if (normalizedScore >= 35) category = "MODERATE"

    return {
      painScore,
      stiffnessScore,
      functionScore,
      totalWomac,
      normalizedScore,
      category
    }
  }, [painAnswers, stiffnessAnswers, functionAnswers])

  const handleSelectSeverity = (qId, val, section) => {
    if (section === "pain") {
      setPainAnswers(prev => ({ ...prev, [qId]: val }))
    } else if (section === "stiffness") {
      setStiffnessAnswers(prev => ({ ...prev, [qId]: val }))
    } else {
      setFunctionAnswers(prev => ({ ...prev, [qId]: val }))
    }
  }

  const handleSpeakQuestion = (text) => {
    const lang = localStorage.getItem("sandhi_lang") || "en"
    speakText(text, lang)
  }

  const handleContinueToMovement = () => {
    const assessmentPayload = {
      patient: patientData,
      womacScore: scoring.normalizedScore,
      subscale_breakdown: {
        pain: scoring.painScore,
        stiffness: scoring.stiffnessScore,
        function: scoring.functionScore,
        total_womac: scoring.totalWomac
      },
      raw_womac: {
        pain: Object.values(painAnswers),
        stiffness: Object.values(stiffnessAnswers),
        function: Object.values(functionAnswers)
      },
      risk_factors: {
        bmi,
        occupation_flag: occupationType === "manual",
        prior_injury_flag: priorInjury,
        family_history_flag: familyHistory
      }
    }

    try {
      updateScreeningStep(1, assessmentPayload, scoring.normalizedScore)
    } catch (e) {}

    localStorage.setItem("sandhi_step1", JSON.stringify(assessmentPayload))
    localStorage.setItem("sandhi_patient", JSON.stringify(patientData))

    navigate("/movement", { state: assessmentPayload })
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-teal-100 selection:text-teal-900 pb-20">
      
      {/* 4-Step Stepper */}
      <ScreeningStepper currentStep={1} />

      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-2xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                Step 1 of 4
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Knee Pain & Daily Habits Questions
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select the option that best describes how your knee felt over the past few days.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSpeakQuestion("Please answer these simple questions about your knee pain, morning stiffness, and daily activities.")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold transition cursor-pointer"
          >
            <Volume2 size={16} className="text-teal-700" />
            <span>Listen to Instructions</span>
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Section Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-200/70 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("pain")}
            className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex flex-col items-center gap-1 ${
              activeTab === "pain" 
                ? "bg-white text-teal-900 shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <span>1. Knee Pain</span>
            <span className="text-[11px] font-normal opacity-80">(5 questions)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stiffness")}
            className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex flex-col items-center gap-1 ${
              activeTab === "stiffness" 
                ? "bg-white text-teal-900 shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <span>2. Stiffness</span>
            <span className="text-[11px] font-normal opacity-80">(2 questions)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("function")}
            className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex flex-col items-center gap-1 ${
              activeTab === "function" 
                ? "bg-white text-teal-900 shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <span>3. Daily Life</span>
            <span className="text-[11px] font-normal opacity-80">(17 activities)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("habits")}
            className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex flex-col items-center gap-1 ${
              activeTab === "habits" 
                ? "bg-white text-teal-900 shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <span>4. Habits & Profile</span>
            <span className="text-[11px] font-normal opacity-80">(Height, Work)</span>
          </button>
        </div>

        {/* TAB 1: PAIN QUESTIONS */}
        {activeTab === "pain" && (
          <div className="space-y-4">
            <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🦵</span>
                <div>
                  <h2 className="text-sm font-bold text-teal-950">Section 1: Knee Pain</h2>
                  <p className="text-xs text-teal-900">How much pain do you experience during these everyday situations?</p>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-200">
                5 Questions
              </span>
            </div>

            {PAIN_QUESTIONS.map((q, idx) => {
              const currentVal = painAnswers[q.id]
              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          Q{idx + 1}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">{q.title}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500">{q.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSpeakQuestion(q.desc)}
                      title="Listen to question"
                      className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-500 hover:text-teal-700 border border-slate-200 transition cursor-pointer shrink-0"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  {/* Large Touch-Friendly Severity Options */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                    {SEVERITY_LEVELS.map(lvl => {
                      const isSelected = currentVal === lvl.value
                      return (
                        <button
                          key={lvl.value}
                          type="button"
                          onClick={() => handleSelectSeverity(q.id, lvl.value, "pain")}
                          className={`py-3 px-2 rounded-xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isSelected 
                              ? "border-teal-700 bg-teal-50 text-teal-950 font-bold shadow-xs ring-2 ring-teal-600/20" 
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-sm font-extrabold">{lvl.label}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{lvl.sublabel}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("stiffness")}
                className="py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Continue to Stiffness →</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: STIFFNESS QUESTIONS */}
        {activeTab === "stiffness" && (
          <div className="space-y-4">
            <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌅</span>
                <div>
                  <h2 className="text-sm font-bold text-teal-950">Section 2: Knee Stiffness</h2>
                  <p className="text-xs text-teal-900">Do your knees feel tight or difficult to bend after resting?</p>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-200">
                2 Questions
              </span>
            </div>

            {STIFFNESS_QUESTIONS.map((q, idx) => {
              const currentVal = stiffnessAnswers[q.id]
              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          Q{idx + 1}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">{q.title}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500">{q.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSpeakQuestion(q.desc)}
                      title="Listen to question"
                      className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-500 hover:text-teal-700 border border-slate-200 transition cursor-pointer shrink-0"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                    {SEVERITY_LEVELS.map(lvl => {
                      const isSelected = currentVal === lvl.value
                      return (
                        <button
                          key={lvl.value}
                          type="button"
                          onClick={() => handleSelectSeverity(q.id, lvl.value, "stiffness")}
                          className={`py-3 px-2 rounded-xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isSelected 
                              ? "border-teal-700 bg-teal-50 text-teal-950 font-bold shadow-xs ring-2 ring-teal-600/20" 
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-sm font-extrabold">{lvl.label}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{lvl.sublabel}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("pain")}
                className="py-3 px-5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>← Back to Pain</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("function")}
                className="py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Continue to Daily Life →</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DAILY LIFE / PHYSICAL FUNCTION */}
        {activeTab === "function" && (
          <div className="space-y-4">
            <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏡</span>
                <div>
                  <h2 className="text-sm font-bold text-teal-950">Section 3: Daily Activities</h2>
                  <p className="text-xs text-teal-900">How much difficulty do you have performing these everyday chores and activities?</p>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-200">
                17 Activities
              </span>
            </div>

            {FUNCTION_QUESTIONS.map((q, idx) => {
              const currentVal = functionAnswers[q.id]
              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          {idx + 1}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{q.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500">{q.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSpeakQuestion(q.desc)}
                      title="Listen to question"
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-500 hover:text-teal-700 border border-slate-200 transition cursor-pointer shrink-0"
                    >
                      <Volume2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {SEVERITY_LEVELS.map(lvl => {
                      const isSelected = currentVal === lvl.value
                      return (
                        <button
                          key={lvl.value}
                          type="button"
                          onClick={() => handleSelectSeverity(q.id, lvl.value, "function")}
                          className={`py-2.5 px-2 rounded-xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isSelected 
                              ? "border-teal-700 bg-teal-50 text-teal-950 font-bold shadow-xs ring-2 ring-teal-600/20" 
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-extrabold">{lvl.label}</span>
                          <span className="text-[10px] sm:text-[11px] text-slate-500">{lvl.sublabel}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("stiffness")}
                className="py-3 px-5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>← Back to Stiffness</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("habits")}
                className="py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Continue to Habits →</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: HABITS, PROFILE & BMI */}
        {activeTab === "habits" && (
          <div className="space-y-6">
            <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌱</span>
                <div>
                  <h2 className="text-sm font-bold text-teal-950">Section 4: Body Profile & Daily Routine</h2>
                  <p className="text-xs text-teal-900">Your weight and daily activities help us give you accurate knee protection advice.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-200">
                Body & Routine
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              
              {/* Height and Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Height (cm)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseInt(e.target.value) || 155)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:outline-teal-600"
                    placeholder="e.g. 158"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Around {(heightCm / 30.48).toFixed(1)} feet</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseInt(e.target.value) || 60)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:outline-teal-600"
                    placeholder="e.g. 64"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Body Mass Index: <b>{bmi} kg/m²</b></span>
                </div>
              </div>

              {/* Occupation Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">What is your typical daily physical routine?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOccupationType("manual")}
                    className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                      occupationType === "manual" 
                        ? "border-teal-700 bg-teal-50 text-teal-950 font-bold" 
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-bold">Manual / Active Routine</p>
                    <p className="text-xs text-slate-500 mt-0.5">Tea gardening, farming, housework, standing, lifting</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOccupationType("sedentary")}
                    className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                      occupationType === "sedentary" 
                        ? "border-teal-700 bg-teal-50 text-teal-950 font-bold" 
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-bold">Mostly Sitting / Desk</p>
                    <p className="text-xs text-slate-500 mt-0.5">Office work, sewing, resting at home</p>
                  </button>
                </div>
              </div>

              {/* Family History & Past Injury Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={familyHistory}
                    onChange={(e) => setFamilyHistory(e.target.checked)}
                    className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900">Family History of Arthritis</span>
                    <p className="text-[11px] text-slate-500">Parents or siblings with severe knee pain or surgery</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={priorInjury}
                    onChange={(e) => setPriorInjury(e.target.checked)}
                    className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900">Prior Knee Joint Injury</span>
                    <p className="text-[11px] text-slate-500">Past ligament sprain, meniscus damage, or fracture</p>
                  </div>
                </label>
              </div>

            </div>

            {/* Final Scoring Summary Banner */}
            <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div>
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                  Knee Symptoms Summary Score
                </span>
                <p className="text-2xl font-black text-slate-900 mt-0.5">
                  WOMAC Score: {scoring.normalizedScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Pain: <b className="text-teal-800">{scoring.painScore}/20</b> &bull; Stiffness: <b className="text-amber-800">{scoring.stiffnessScore}/8</b> &bull; Function: <b className="text-cyan-800">{scoring.functionScore}/68</b>
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("function")}
                  className="py-3 px-5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Activities</span>
                </button>

                <button
                  type="button"
                  onClick={handleContinueToMovement}
                  className="py-3.5 px-8 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm sm:text-base flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Save & Continue to Step 2: Movement Test</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  )
}
