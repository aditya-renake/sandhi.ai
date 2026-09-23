import { useState, useEffect, useMemo } from "react"
import ScreeningStepper from "../components/ScreeningStepper"
import { getActiveUser, getCurrentScreeningSession, updateScreeningStep } from "../utils/supabaseClient" 
import { useNavigate } from "react-router-dom"
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Footprints, 
  HeartPulse, 
  Volume2,
  Smile,
  ShieldCheck,
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
  const [activeTab, setActiveTab] = useState("pain") // "pain" | "stiffness" | "function" | "details"

  // Answers State
  const [painAnswers, setPainAnswers] = useState({ p1: 2, p2: 3, p3: 1, p4: 1, p5: 2 })
  const [stiffnessAnswers, setStiffnessAnswers] = useState({ s1: 3, s2: 2 })
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
        district: "Kamrup",
        joint: "Right Knee"
      }
    } catch {
      return { name: "Bimla Karmakar", age: 58, gender: "Female", state: "Assam", district: "Kamrup", joint: "Right Knee" }
    }
  })

  const [heightCm, setHeightCm] = useState(158)
  const [weightKg, setWeightKg] = useState(64)
  const [occupationType, setOccupationType] = useState("manual")
  const [familyHistory, setFamilyHistory] = useState(false)
  const [priorInjury, setPriorInjury] = useState(false)

  // Auto-load session/user data
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
      if (p.height) setHeightCm(Number(p.height))
      if (p.weight) setWeightKg(Number(p.weight))
      if (p.occupation) setOccupationType(p.occupation.toLowerCase().includes("manual") || p.occupation.toLowerCase().includes("tea") ? "manual" : "sedentary")
      if (p.priorInjury) setPriorInjury(String(p.priorInjury).toLowerCase().includes("yes"))
      if (p.familyHistory) setFamilyHistory(String(p.familyHistory).toLowerCase().includes("yes"))
    }
  }, [])

  // Auto-calculate BMI
  const bmi = useMemo(() => {
    const hMeter = Math.max(0.5, heightCm / 100)
    return Number((weightKg / (hMeter * hMeter)).toFixed(1))
  }, [heightCm, weightKg])

  // Scoring Formula
  const scoring = useMemo(() => {
    const pValues = Object.values(painAnswers)
    const sValues = Object.values(stiffnessAnswers)
    const fValues = Object.values(functionAnswers)

    const painSum = pValues.reduce((a, b) => a + Number(b || 0), 0)
    const stiffSum = sValues.reduce((a, b) => a + Number(b || 0), 0)
    const funcSum = fValues.reduce((a, b) => a + Number(b || 0), 0)

    const painScore = (painSum / (5 * 4)) * 20.0
    const stiffnessScore = (stiffSum / (2 * 4)) * 8.0
    const functionScore = (funcSum / (17 * 4)) * 68.0
    const totalWomac = painScore + stiffnessScore + functionScore

    const normalizedScore = Math.min(100, Math.round((totalWomac / 96.0) * 100.0))

    return {
      painScore: Number(painScore.toFixed(1)),
      stiffnessScore: Number(stiffnessScore.toFixed(1)),
      functionScore: Number(functionScore.toFixed(1)),
      totalWomac: Number(totalWomac.toFixed(1)),
      normalizedScore
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
        bmi_elevated: bmi >= 25.0,
        occupation_type: occupationType,
        occupation_flag: occupationType === "manual",
        family_history: familyHistory,
        prior_injury: priorInjury,
        height_cm: heightCm,
        weight_kg: weightKg
      }
    }

    updateScreeningStep(1, assessmentPayload, scoring.normalizedScore)
    localStorage.setItem("sandhi_womac", JSON.stringify(assessmentPayload))
    navigate("/movement", { state: { womacScore: scoring.normalizedScore, assessmentData: assessmentPayload } })
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
            onClick={handleContinueToMovement}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Next: 30s Movement Check</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Form Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Navigation Tabs between Question Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("pain")}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "pain"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>1. Knee Pain (5)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stiffness")}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "stiffness"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>2. Morning Stiffness (2)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("function")}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "function"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>3. Daily Activities (17)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "details"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>4. Body & Work</span>
          </button>
        </div>

        {/* SECTION 1: PAIN QUESTIONS */}
        {activeTab === "pain" && (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-xs sm:text-sm font-bold text-teal-950">
                How much knee pain do you experience during these 5 daily activities?
              </p>
              <button
                type="button"
                onClick={() => handleSpeakQuestion("How much knee pain do you experience during these daily activities?")}
                className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg border border-teal-300 shadow-2xs cursor-pointer"
              >
                <Volume2 size={14} />
                <span>Listen</span>
              </button>
            </div>

            {PAIN_QUESTIONS.map((q, idx) => {
              const currentVal = painAnswers[q.id]
              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">Question {idx + 1} of 5</span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{q.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{q.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeakQuestion(q.title + ". " + q.desc)}
                      title="Read aloud"
                      className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-teal-800 hover:bg-teal-50 border border-slate-200 cursor-pointer shrink-0"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  {/* Big Accessible Options */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                    {SEVERITY_LEVELS.map(opt => {
                      const isSelected = currentVal === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectSeverity(q.id, opt.value, "pain")}
                          className={`py-3 px-3 rounded-xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? "bg-teal-700 border-teal-800 text-white font-bold shadow-xs scale-[1.02]"
                              : opt.bg
                          }`}
                        >
                          <span className="text-sm font-extrabold">{opt.label}</span>
                          <span className={`text-[11px] ${isSelected ? "text-teal-100" : "text-slate-500"}`}>
                            {opt.sublabel}
                          </span>
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
                <span>Continue to Morning Stiffness</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: STIFFNESS QUESTIONS */}
        {activeTab === "stiffness" && (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-xs sm:text-sm font-bold text-teal-950">
                Stiffness is a feeling of tightness or restriction when trying to bend or move your knee.
              </p>
              <button
                type="button"
                onClick={() => handleSpeakQuestion("Stiffness is a feeling of tightness or restriction when trying to bend or move your knee.")}
                className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg border border-teal-300 shadow-2xs cursor-pointer"
              >
                <Volume2 size={14} />
                <span>Listen</span>
              </button>
            </div>

            {STIFFNESS_QUESTIONS.map((q, idx) => {
              const currentVal = stiffnessAnswers[q.id]
              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">Question {idx + 1} of 2</span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{q.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{q.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeakQuestion(q.title + ". " + q.desc)}
                      title="Read aloud"
                      className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-teal-800 hover:bg-teal-50 border border-slate-200 cursor-pointer shrink-0"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                    {SEVERITY_LEVELS.map(opt => {
                      const isSelected = currentVal === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectSeverity(q.id, opt.value, "stiffness")}
                          className={`py-3 px-3 rounded-xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? "bg-teal-700 border-teal-800 text-white font-bold shadow-xs scale-[1.02]"
                              : opt.bg
                          }`}
                        >
                          <span className="text-sm font-extrabold">{opt.label}</span>
                          <span className={`text-[11px] ${isSelected ? "text-teal-100" : "text-slate-500"}`}>
                            {opt.sublabel}
                          </span>
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
                <ArrowLeft size={16} />
                <span>Back to Pain</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("function")}
                className="py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Continue to Daily Activities</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: FUNCTION QUESTIONS */}
        {activeTab === "function" && (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-xs sm:text-sm font-bold text-teal-950">
                How much difficulty do you have performing your regular household or outdoor activities?
              </p>
              <button
                type="button"
                onClick={() => handleSpeakQuestion("How much difficulty do you have performing your regular household or outdoor activities?")}
                className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg border border-teal-300 shadow-2xs cursor-pointer"
              >
                <Volume2 size={14} />
                <span>Listen</span>
              </button>
            </div>

            {FUNCTION_QUESTIONS.map((q, idx) => {
              const currentVal = functionAnswers[q.id]
              return (
                <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-teal-800">Activity {idx + 1} of 17</span>
                      <h4 className="text-base font-bold text-slate-900">{q.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-600">{q.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeakQuestion(q.title + ". " + q.desc)}
                      title="Read aloud"
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-teal-800 hover:bg-teal-50 border border-slate-200 cursor-pointer shrink-0"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {SEVERITY_LEVELS.map(opt => {
                      const isSelected = currentVal === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectSeverity(q.id, opt.value, "function")}
                          className={`py-2 px-2 rounded-xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                            isSelected
                              ? "bg-teal-700 border-teal-800 text-white font-bold shadow-xs"
                              : opt.bg
                          }`}
                        >
                          <span className="text-xs font-bold">{opt.label}</span>
                          <span className={`text-[10px] ${isSelected ? "text-teal-100" : "text-slate-500"}`}>
                            {opt.sublabel}
                          </span>
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
                <ArrowLeft size={16} />
                <span>Back to Stiffness</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className="py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Continue to Body & Work</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* SECTION 4: BODY & WORK DEMOGRAPHICS */}
        {activeTab === "details" && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Your Body & Daily Routine</h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  These details help calculate body joint pressure (BMI) and physical workload on your knees.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Height */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Height (in centimeters):</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-bold text-slate-900 text-base focus:border-teal-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">e.g. 158 cm (approx. 5 feet 2 inches)</span>
                </div>

                {/* Weight */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Weight (in kilograms):</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-bold text-slate-900 text-base focus:border-teal-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">e.g. 64 kg</span>
                </div>
              </div>

              {/* BMI Indicator */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Calculated Body Mass Index (BMI)</span>
                  <p className="text-lg font-extrabold text-slate-900">{bmi} kg/m²</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  bmi >= 25 ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                }`}>
                  {bmi >= 25 ? "Elevated Joint Pressure" : "Healthy Range"}
                </span>
              </div>

              {/* Daily Work / Occupation */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Daily Work & Physical Activity:</label>
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

              {/* Past Injury */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Have you ever had a past knee injury or surgery?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                    <input
                      type="radio"
                      name="injury"
                      checked={priorInjury}
                      onChange={() => setPriorInjury(true)}
                      className="w-4 h-4 text-teal-600"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                    <input
                      type="radio"
                      name="injury"
                      checked={!priorInjury}
                      onChange={() => setPriorInjury(false)}
                      className="w-4 h-4 text-teal-600"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4">
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
        )}

      </main>

    </div>
  )
}
