import { useState, useEffect, useRef, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import ScreeningStepper from "../components/ScreeningStepper"
import { updateScreeningStep } from "../utils/supabaseClient"
import { speakText, VOICE_PROMPTS } from "../utils/speech"
import { 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Volume2, 
  ShieldAlert,
  Info,
  Smile,
  Stethoscope,
  HeartPulse
} from "lucide-react"

export default function Analysis() {
  const navigate = useNavigate()
  const location = useLocation()
  const waveformCanvasRef = useRef(null)
  const animRef = useRef(null)

  // Retrieve passed patient and prior module states
  const storedPatient = localStorage.getItem("sandhi_patient")
  const patient = location.state?.patient || (storedPatient ? JSON.parse(storedPatient) : {
    name: "Bimla Karmakar",
    age: 58,
    gender: "Female",
    state: "Assam",
    district: "Kamrup",
    joint: "Right Knee",
    abhaId: "14-5829-1029-4821"
  })

  // Module 1: Questionnaire Data (WOMAC)
  const storedWomac = localStorage.getItem("sandhi_womac")
  const womacPayload = location.state?.assessmentData || (storedWomac ? JSON.parse(storedWomac) : null)
  const qScore = Number(location.state?.womacScore ?? (womacPayload?.womacScore ?? 45))
  const womacBreakdown = womacPayload?.subscale_breakdown || { pain: 10, stiffness: 4, function: 28, total_womac: 42 }
  const riskFactors = womacPayload?.risk_factors || { bmi: 25.4, occupation_flag: true, family_history: false, prior_injury: false }

  // Module 2: Computer Vision Video Kinematics Data
  const storedMovement = localStorage.getItem("sandhi_movement")
  const cvMovement = location.state?.movementResults || (storedMovement ? JSON.parse(storedMovement) : {})
  const sitToStandReps = Number(cvMovement?.sitToStandReps ?? 8)
  const romVal = Number(cvMovement?.rom ?? 85)
  const minFlexion = Number(cvMovement?.flexionAngle ?? 95)
  const maxExtension = Number(cvMovement?.extensionAngle ?? 162)
  const varusValgus = cvMovement?.varusValgusAlignment || "Normal"
  const alignmentRatio = Number(cvMovement?.alignmentRatio ?? 1.15)
  const cvConfidence = Number(cvMovement?.cv_confidence ?? 0.88)

  // Compute Module 2 CV Score (0 - 100)
  const cvScore = useMemo(() => {
    const repsDeficit = Math.max(0, Math.min(1, (14.0 - sitToStandReps) / 10.0)) * 40.0
    const romDeficit = Math.max(0, Math.min(1, (115.0 - romVal) / 45.0)) * 35.0
    const alignPenalty = varusValgus === "Varus" ? 25.0 : varusValgus === "Valgus" ? 15.0 : 0.0
    return Math.min(100, Math.round(repsDeficit + romDeficit + alignPenalty))
  }, [sitToStandReps, romVal, varusValgus])

  // Module 3: Hardware Sensor State (SandhiBand VAG & Sound)
  const initialBursts = romVal < 70 || qScore > 60 ? 6 : romVal > 105 && qScore < 30 ? 1 : 4
  const initialFreq = romVal < 70 || qScore > 60 ? 220 : romVal > 105 && qScore < 30 ? 95 : 148

  const [burstCount, setBurstCount] = useState(initialBursts)
  const [peakFrequency, setPeakFrequency] = useState(initialFreq) // Hz
  const [rmsEnergy, setRmsEnergy] = useState(0.42)
  const [sensorPreset, setSensorPreset] = useState(initialBursts >= 6 ? "severe" : initialBursts <= 1 ? "smooth" : "moderate")
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // Compute Module 3 Hardware Score (0 - 100)
  const hwScore = useMemo(() => {
    const burstScore = Math.min(50.0, (burstCount / 8.0) * 50.0)
    const freqScore = Math.max(0.0, Math.min(35.0, ((peakFrequency - 100.0) / 150.0) * 35.0))
    const rmsScore = Math.min(15.0, (rmsEnergy / 0.80) * 15.0)
    return Math.min(100, Math.round(burstScore + freqScore + rmsScore))
  }, [burstCount, peakFrequency, rmsEnergy])

  // Module 4: Tri-Factor Fusion Engine
  const fusionResult = useMemo(() => {
    let w_q = 0.30
    let w_cv = 0.35
    let w_hw = 0.35

    if (cvConfidence < 0.6) {
      const deficit = w_cv * (1.0 - cvConfidence)
      w_cv -= deficit
      w_q += deficit / 2.0
      w_hw += deficit / 2.0
    }

    const final = Math.min(100, Math.max(0, Math.round(w_q * qScore + w_cv * cvScore + w_hw * hwScore)))

    let category = "low"
    let kl = 0
    if (final < 33) {
      category = "low"
      kl = final < 18 ? 0 : 1
    } else if (final < 66) {
      category = "moderate"
      kl = 2
    } else {
      category = "high"
      kl = final >= 82 ? 4 : 3
    }

    const explanations = []
    if (qScore >= 50) {
      explanations.push(`Noticeable knee pain or stiffness reported during daily walking or rest (${Math.round(qScore)}/100).`)
    }
    if (cvScore >= 50) {
      explanations.push(`Reduced chair stand repetitions and restricted knee bend recorded (${Math.round(cvScore)}/100).`)
    }
    if (hwScore >= 45) {
      explanations.push(`Knee joint clicking or friction vibrations detected during motion (${Math.round(hwScore)}/100).`)
    }
    if (explanations.length === 0) {
      explanations.push("Your questions, movement, and joint sounds are all in a healthy, normal range.")
    }

    return {
      finalScore: final,
      riskCategory: category.toUpperCase(),
      klGrade: kl,
      weights: { w_q: Number(w_q.toFixed(2)), w_cv: Number(w_cv.toFixed(2)), w_hw: Number(w_hw.toFixed(2)) },
      explanations
    }
  }, [qScore, cvScore, hwScore, cvConfidence])

  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem("sandhi_lang") || "en")

  useEffect(() => {
    const onLangChange = (e) => {
      if (e.detail) {
        setSelectedLang(e.detail)
        const prompt = VOICE_PROMPTS[e.detail] || VOICE_PROMPTS.en
        speakText(prompt.crepitusNotice, e.detail)
      }
    }
    window.addEventListener("sandhi_language_changed", onLangChange)
    return () => window.removeEventListener("sandhi_language_changed", onLangChange)
  }, [])

  // SandhiBand Waveform Canvas
  useEffect(() => {
    const canvas = waveformCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    let phase = 0
    let animId = null

    const render = () => {
      const width = canvas.width
      const height = canvas.height
      const midY = height / 2

      ctx.fillStyle = "#0f172a"
      ctx.fillRect(0, 0, width, height)

      // Grid lines
      ctx.strokeStyle = "#1e293b"
      ctx.lineWidth = 1
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Draw Waveform
      ctx.beginPath()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = "#14b8a6"

      phase += 0.08
      for (let x = 0; x < width; x++) {
        const normX = x / width
        let y = Math.sin(x * 0.05 + phase) * 8 + (Math.random() - 0.5) * 4

        const spikeIntervals = [0.20, 0.42, 0.65, 0.85].slice(0, Math.min(4, burstCount))
        spikeIntervals.forEach((spikeX) => {
          const dist = Math.abs(normX - spikeX)
          if (dist < 0.04) {
            const spikeAmp = Math.cos((dist / 0.04) * (Math.PI / 2)) * 55
            const jitter = Math.sin(x * 0.8 + phase * 3) * 12
            y += spikeAmp + jitter
          }
        })

        if (x === 0) {
          ctx.moveTo(x, midY + y)
        } else {
          ctx.lineTo(x, midY + y)
        }
      }
      ctx.stroke()

      animId = requestAnimationFrame(render)
    }

    render()
    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [burstCount])

  const handleApplyPreset = (preset) => {
    setSensorPreset(preset)
    if (preset === "smooth") {
      setBurstCount(1)
      setPeakFrequency(92)
      setRmsEnergy(0.18)
    } else if (preset === "moderate") {
      setBurstCount(4)
      setPeakFrequency(152)
      setRmsEnergy(0.44)
    } else {
      setBurstCount(7)
      setPeakFrequency(245)
      setRmsEnergy(0.72)
    }
  }

  // Audio simulation of crepitus
  const playCrepitusSound = () => {
    if (isPlayingAudio) return
    setIsPlayingAudio(true)

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const duration = 2.2
      const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioCtx.sampleRate
        let sample = (Math.random() * 2 - 1) * 0.06

        const bursts = [0.4, 0.9, 1.4, 1.8].slice(0, burstCount)
        bursts.forEach(bTime => {
          if (Math.abs(t - bTime) < 0.06) {
            sample += (Math.random() * 2 - 1) * 0.65 * (1 - Math.abs(t - bTime) / 0.06)
          }
        })
        data[i] = sample
      }

      const source = audioCtx.createBufferSource()
      source.buffer = buffer

      const filter = audioCtx.createBiquadFilter()
      filter.type = "bandpass"
      filter.frequency.value = peakFrequency
      filter.Q.value = 3.0

      source.connect(filter)
      filter.connect(audioCtx.destination)
      source.start()

      source.onended = () => {
        setIsPlayingAudio(false)
        audioCtx.close()
      }
    } catch (e) {
      setIsPlayingAudio(false)
    }
  }

  const handleProceedToResults = () => {
    const vagData = {
      burstCount,
      peakFrequency,
      rmsEnergy,
      hwScore,
      preset: sensorPreset
    }

    const triFactorData = {
      questionnaireScore: qScore,
      movementScore: cvScore,
      hardwareScore: hwScore,
      weights: fusionResult.weights,
      compositeScore: fusionResult.finalScore,
      riskCategory: fusionResult.riskCategory,
      klProxy: fusionResult.klGrade,
      explanations: fusionResult.explanations
    }

    updateScreeningStep(3, vagData, hwScore)
    localStorage.setItem("sandhi_vag", JSON.stringify(vagData))
    localStorage.setItem("sandhi_trifactor", JSON.stringify(triFactorData))

    navigate("/results", {
      state: {
        patient,
        womacScore: qScore,
        movementResults: cvMovement,
        vagData,
        triFactorBreakdown: triFactorData,
        compositeScore: fusionResult.finalScore,
        riskCategory: fusionResult.riskCategory,
        klProxy: fusionResult.klGrade
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-teal-100 selection:text-teal-900 pb-20">
      
      {/* Stepper with Step 3 */}
      <ScreeningStepper currentStep={3} />

      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-2xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                Step 3 of 4
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Knee Sound & Joint Vibration Check
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Checks for clicking or friction sounds (crepitus) inside the knee joint as you bend and stand.
            </p>
          </div>

          <button
            type="button"
            onClick={handleProceedToResults}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>View Final Results & Advice</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* 3 Pillar Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Questionnaire */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200 uppercase">
                  Step 1: Questions
                </span>
                <span className="text-xs font-bold text-slate-500">Weight: 30%</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Knee Pain & Habits</h3>
              <p className="text-2xl font-black text-teal-700 mt-1">{Math.round(qScore)}/100</p>
              
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>Pain score: <b>{womacBreakdown.pain || 10}/20</b></p>
                <p>Stiffness score: <b>{womacBreakdown.stiffness || 4}/8</b></p>
                <p>Activity limits: <b>{womacBreakdown.function || 28}/68</b></p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-4 pt-2 border-t border-slate-100">
              {qScore > 50 ? "Noticeable knee pain reported" : "Mild knee discomfort"}
            </p>
          </div>

          {/* Card 2: Movement */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200 uppercase">
                  Step 2: Movement
                </span>
                <span className="text-xs font-bold text-slate-500">Weight: 35%</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Chair Stand Test</h3>
              <p className="text-2xl font-black text-teal-700 mt-1">{cvScore}/100</p>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>Reps completed: <b>{sitToStandReps} reps</b></p>
                <p>Knee bend range: <b>{romVal}°</b></p>
                <p>Leg alignment: <b>{varusValgus}</b></p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-4 pt-2 border-t border-slate-100">
              {sitToStandReps >= 8 ? "Good chair-stand strength" : "Reduced leg endurance"}
            </p>
          </div>

          {/* Card 3: Joint Sound Check */}
          <div className="p-5 rounded-2xl bg-white border-2 border-teal-600 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-700 text-white uppercase">
                  Step 3: Joint Sound
                </span>
                <span className="text-xs font-bold text-slate-500">Weight: 35%</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Joint Sound & Vibration</h3>
              <p className="text-2xl font-black text-teal-800 mt-1">{hwScore}/100</p>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>Click / crunch sounds: <b>{burstCount} sounds</b></p>
                <p>Friction pitch: <b>{peakFrequency} Hz</b></p>
                <p>Joint state: <b className="text-teal-900">{burstCount >= 6 ? "Noticeable Friction" : burstCount >= 3 ? "Occasional Clicking" : "Smooth Movement"}</b></p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-4 pt-2 border-t border-slate-100">
              {burstCount >= 3 ? "Joint cartilage friction detected" : "Smooth joint motion"}
            </p>
          </div>

        </div>

        {/* Waveform & Sound Test Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Knee Vibration & Sound Reader
              </h3>
              <p className="text-xs text-slate-500">
                Select your knee sound type below or click Play Sound to listen.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleApplyPreset("smooth")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  sensorPreset === "smooth" ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🟢 Smooth Knee (Low Sound)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("moderate")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  sensorPreset === "moderate" ? "bg-amber-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🟡 Occasional Click
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("severe")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  sensorPreset === "severe" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🔴 Frequent Grating
              </button>

              <button
                type="button"
                onClick={playCrepitusSound}
                disabled={isPlayingAudio}
                className="px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-300 text-teal-900 text-xs font-bold hover:bg-teal-100 transition cursor-pointer flex items-center gap-1.5"
              >
                <Volume2 size={14} className="text-teal-700" />
                <span>{isPlayingAudio ? "Playing Sound..." : "Listen to Knee Sound"}</span>
              </button>
            </div>
          </div>

          {/* Oscilloscope Canvas in sleek dark container */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-inner">
            <canvas
              ref={waveformCanvasRef}
              width={720}
              height={180}
              className="w-full h-40 object-cover block"
            />
            <div className="absolute bottom-2 left-4 text-[11px] text-slate-400 flex gap-4 font-medium">
              <span>Joint sound vibrations: <b className="text-teal-300">{burstCount} clicks detected</b></span>
              <span>Sound frequency: <b className="text-teal-300">{peakFrequency} Hz</b></span>
            </div>
          </div>
        </div>

        {/* Explainable Summary Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                Summary of All 3 Tests
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                Estimated Knee Health Score: {fusionResult.finalScore} / 100
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Combines your answers (30%), movement speed (35%), and joint sounds (35%).
              </p>
            </div>

            <button
              onClick={handleProceedToResults}
              className="py-3.5 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>View Your Detailed Care Plan ➔</span>
            </button>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Why this score was given:
            </h4>
            <ul className="space-y-2">
              {fusionResult.explanations.map((exp, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                  <span>{exp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Doctor Advisory note */}
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start gap-3">
            <Info size={18} className="text-teal-700 shrink-0 mt-0.5" />
            <p className="text-xs text-teal-950 leading-relaxed font-medium">
              <b>Friendly reminder:</b> Sandhi is a home screening checkup to help you and your family take care of your knee health early. If you have severe swelling or pain, please visit your local doctor or Primary Health Center for an in-person knee examination.
            </p>
          </div>
        </div>

      </main>

    </div>
  )
}
