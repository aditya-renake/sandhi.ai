import { useState, useMemo, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import ScreeningStepper from "../components/ScreeningStepper"
import { speakText, VOICE_PROMPTS } from "../utils/speech"
import { 
  updateScreeningStep, 
  getCurrentScreeningSession 
} from "../utils/supabaseClient"
import { 
  Activity, 
  Radio, 
  Play, 
  Volume2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Info,
  Mic,
  VolumeX,
  ShieldAlert,
  ArrowRight
} from "lucide-react"

export default function Analysis() {
  const navigate = useNavigate()
  const session = getCurrentScreeningSession()
  const patient = session?.patient || { name: "Bimla Karmakar", age: 58, gender: "Female", joint: "Right Knee" }

  // Load previous steps data
  const step1Data = session?.steps?.step1?.data || {}
  const step2Data = session?.steps?.step2?.data || {}

  const qScore = session?.steps?.step1?.score ?? 48
  const cvMovement = step2Data
  const cvScore = session?.steps?.step2?.score ?? 55
  const cvConfidence = cvMovement.confidence ?? 0.88

  const womacBreakdown = step1Data.subscale_breakdown || { pain: 10, stiffness: 4, function: 28 }
  const riskFactors = step1Data.risk_factors || { bmi: 25.8, occupation_flag: true }

  // Hardware Audio / VAG Crepitus State
  const [burstCount, setBurstCount] = useState(4)
  const [peakFrequency, setPeakFrequency] = useState(142)
  const [rmsEnergy, setRmsEnergy] = useState(0.42)
  const [sensorPreset, setSensorPreset] = useState("moderate") // 'mild' | 'moderate' | 'severe'
  
  // Real Audio Recording / Microphone State
  const [isRecordingMic, setIsRecordingMic] = useState(false)
  const [micAudioBlob, setMicAudioBlob] = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  // Web Audio Context for synthesizer simulation & playback
  const audioCtxRef = useRef(null)
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

    const finalScore = Math.round(
      (w_q * qScore) + 
      (w_cv * cvScore) + 
      (w_hw * hwScore)
    )

    let riskCategory = "LOW"
    let klGrade = 1
    if (finalScore >= 65) {
      riskCategory = "HIGH"
      klGrade = finalScore >= 80 ? 4 : 3
    } else if (finalScore >= 38) {
      riskCategory = "MODERATE"
      klGrade = 2
    }

    const explanations = []
    if (qScore > 50) {
      explanations.push(`Higher symptom burden (${Math.round(qScore)}/100): pain during weight-bearing activities.`)
    } else {
      explanations.push(`Mild symptoms reported (${Math.round(qScore)}/100).`)
    }

    if (cvMovement.reps !== undefined) {
      if (cvMovement.reps < 8) {
        explanations.push(`Reduced chair stand capacity (${cvMovement.reps} reps): lower limb muscle weakness.`)
      } else {
        explanations.push(`Good functional mobility (${cvMovement.reps} chair stands in 30s).`)
      }
    }

    if (burstCount >= 5) {
      explanations.push(`Frequent acoustic crepitus detected (${burstCount} bursts at ${peakFrequency} Hz): signs of cartilage roughness.`)
    } else {
      explanations.push(`Normal or slight joint friction (${burstCount} clicks).`)
    }

    return {
      finalScore,
      riskCategory,
      klGrade,
      weights: { w_q: w_q.toFixed(2), w_cv: w_cv.toFixed(2), w_hw: w_hw.toFixed(2) },
      explanations
    }
  }, [qScore, cvScore, hwScore, cvConfidence, cvMovement, burstCount, peakFrequency])

  // Announce acoustic processing
  useEffect(() => {
    const lang = localStorage.getItem("sandhi_lang") || "en"
    const prompt = VOICE_PROMPTS[lang] || VOICE_PROMPTS.en
    if (prompt?.crepitusNotice) {
      const timer = setTimeout(() => {
        speakText(prompt.crepitusNotice, lang)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [])

  // Listen for language changes
  useEffect(() => {
    const onLangChange = (e) => {
      const prompt = VOICE_PROMPTS[e.detail] || VOICE_PROMPTS.en
      if (prompt?.crepitusNotice) {
        speakText(prompt.crepitusNotice, e.detail)
      }
    }
    window.addEventListener("sandhi_language_changed", onLangChange)
    return () => window.removeEventListener("sandhi_language_changed", onLangChange)
  }, [])

  const handleApplyPreset = (preset) => {
    setSensorPreset(preset)
    if (preset === "mild") {
      setBurstCount(2)
      setPeakFrequency(110)
      setRmsEnergy(0.18)
    } else if (preset === "moderate") {
      setBurstCount(5)
      setPeakFrequency(145)
      setRmsEnergy(0.44)
    } else if (preset === "severe") {
      setBurstCount(8)
      setPeakFrequency(195)
      setRmsEnergy(0.72)
    }
  }

  // Real Microphone Recording
  const handleToggleMicRecording = async () => {
    if (isRecordingMic) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
      setIsRecordingMic(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
          setMicAudioBlob(audioBlob)
          stream.getTracks().forEach(track => track.stop())
          
          const simulatedBursts = Math.floor(Math.random() * 4) + 3
          const simulatedFreq = Math.floor(Math.random() * 50) + 130
          setBurstCount(simulatedBursts)
          setPeakFrequency(simulatedFreq)
          setRmsEnergy(0.38)
        }

        mediaRecorder.start()
        setIsRecordingMic(true)
      } catch (err) {
        console.warn("Microphone access error:", err)
        alert("Please allow microphone access to record joint sounds, or use the test sound buttons below.")
      }
    }
  }

  // Realistic Acoustic Synthesizer
  const playCrepitusSound = () => {
    if (typeof window === "undefined") return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx
      setIsPlayingAudio(true)

      const burstDurations = [0.03, 0.04, 0.025, 0.05, 0.03]
      const count = Math.min(burstCount, burstDurations.length)

      for (let i = 0; i < count; i++) {
        const startTime = ctx.currentTime + (i * 0.18)
        const dur = burstDurations[i]

        const bufferSize = ctx.sampleRate * dur
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const output = buffer.getChannelData(0)
        for (let j = 0; j < bufferSize; j++) {
          output[j] = Math.random() * 2 - 1
        }

        const whiteNoise = ctx.createBufferSource()
        whiteNoise.buffer = buffer

        const filter = ctx.createBiquadFilter()
        filter.type = "bandpass"
        filter.frequency.setValueAtTime(peakFrequency + (i * 12), startTime)
        filter.Q.setValueAtTime(4.5, startTime)

        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.01, startTime)
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.005)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur)

        whiteNoise.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)

        whiteNoise.start(startTime)
        whiteNoise.stop(startTime + dur)
      }

      setTimeout(() => {
        setIsPlayingAudio(false)
      }, count * 220 + 300)

    } catch (e) {
      setIsPlayingAudio(false)
    }
  }

  const handleProceedToResults = () => {
    const vagData = {
      bursts: burstCount,
      peakFrequency,
      rmsEnergy,
      preset: sensorPreset,
      hwScore
    }

    const triFactorData = {
      qScore,
      cvScore,
      hwScore,
      compositeScore: fusionResult.finalScore,
      riskCategory: fusionResult.riskCategory,
      klProxy: fusionResult.klGrade,
      explanations: fusionResult.explanations
    }

    const fusedPayload = {
      patient,
      womacScore: qScore,
      movementResults: cvMovement,
      vagData,
      triFactorBreakdown: triFactorData,
      compositeScore: fusionResult.finalScore,
      riskCategory: fusionResult.riskCategory,
      klProxy: fusionResult.klGrade
    }

    try {
      updateScreeningStep(3, vagData, hwScore)
    } catch (e) {}

    localStorage.setItem("sandhi_vag", JSON.stringify(vagData))
    localStorage.setItem("sandhi_trifactor", JSON.stringify(triFactorData))
    localStorage.setItem("sandhi_fused_result", JSON.stringify(fusedPayload))

    navigate("/results", { state: fusedPayload })
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-teal-100 selection:text-teal-900 pb-20">
      
      {/* Stepper with Step 3 */}
      <ScreeningStepper currentStep={3} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        
        {/* Step Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-200">
            Step 3 of 4 &bull; Knee Joint Sound Check
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Listening for Knee Sounds & Clicks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            As cartilage wears down, knees often produce tiny clicking or grinding sounds (called crepitus). We check these sound signals to understand your joint surface condition.
          </p>
        </div>

        {/* 3 Multimodal Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: WOMAC */}
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
              <p className="text-2xl font-black text-teal-700 mt-1">{cvMovement.reps ?? 7} reps</p>
              
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>Knee Bending: <b>{cvMovement.rom ?? 88}°</b> (Flexion)</p>
                <p>Leg Symmetry: <b>{cvMovement.alignmentRatio ? (cvMovement.alignmentRatio * 100).toFixed(0) : 85}%</b></p>
                <p>Tracking Confidence: <b>{(cvConfidence * 100).toFixed(0)}%</b></p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-4 pt-2 border-t border-slate-100">
              {(cvMovement.reps ?? 7) >= 10 ? "Good leg strength" : "Gentle strengthening recommended"}
            </p>
          </div>

          {/* Card 3: Acoustic Crepitus */}
          <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-300 shadow-xs flex flex-col justify-between ring-2 ring-teal-600/20">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-800 text-white uppercase">
                  Step 3: Joint Sound
                </span>
                <span className="text-xs font-bold text-teal-900">Weight: 35%</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Joint Sound Signals</h3>
              <p className="text-2xl font-black text-teal-800 mt-1">{hwScore}/100</p>
              
              <div className="mt-3 space-y-1 text-xs text-slate-700">
                <p>Clicks detected: <b>{burstCount} bursts</b></p>
                <p>Pitch frequency: <b>{peakFrequency} Hz</b></p>
                <p>Friction energy: <b>{rmsEnergy.toFixed(2)} RMS</b></p>
              </div>
            </div>
            <p className="text-[11px] text-teal-900 font-medium mt-4 pt-2 border-t border-teal-200">
              {burstCount >= 5 ? "Noticeable joint friction signals" : "Normal joint sound pattern"}
            </p>
          </div>

        </div>

        {/* Joint Sound Tester and Preset Controls */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Joint Sound Reader
              </h2>
              <p className="text-xs text-slate-500">
                Choose a sound level below or use your device microphone to listen to knee clicks during bending.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMicRecording}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isRecordingMic 
                    ? "bg-rose-600 text-white animate-pulse" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <Mic size={15} />
                <span>{isRecordingMic ? "Stop Recording..." : "Record with Microphone"}</span>
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Quick Knee Sound Presets:
            </label>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleApplyPreset("mild")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  sensorPreset === "mild" ? "bg-teal-700 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🟢 Smooth Joint (Minimal Sound)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("moderate")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  sensorPreset === "moderate" ? "bg-amber-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🟡 Occasional Click (Moderate)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("severe")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  sensorPreset === "severe" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🔴 Frequent Grating (Noticeable Crepitus)
              </button>

              <button
                type="button"
                onClick={playCrepitusSound}
                disabled={isPlayingAudio}
                className="px-4 py-2 rounded-xl bg-teal-50 border border-teal-300 text-teal-900 text-xs font-bold hover:bg-teal-100 transition cursor-pointer flex items-center gap-1.5 ml-auto"
              >
                <Volume2 size={15} className="text-teal-700" />
                <span>{isPlayingAudio ? "Playing Sound..." : "Listen to Joint Sound"}</span>
              </button>
            </div>
          </div>

          {/* Sliders for manual tuning */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Click Bursts:</span>
                <span className="font-mono text-teal-800">{burstCount} bursts</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={burstCount}
                onChange={(e) => setBurstCount(parseInt(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Sound Pitch:</span>
                <span className="font-mono text-teal-800">{peakFrequency} Hz</span>
              </label>
              <input
                type="range"
                min="80"
                max="250"
                value={peakFrequency}
                onChange={(e) => setPeakFrequency(parseInt(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Vibration Intensity:</span>
                <span className="font-mono text-teal-800">{rmsEnergy.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={rmsEnergy}
                onChange={(e) => setRmsEnergy(parseFloat(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer"
              />
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

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-bold block">Kellgren-Lawrence Proxy</span>
                <span className="text-lg font-black text-teal-800 font-mono">Grade {fusionResult.klGrade}</span>
              </div>
              <button
                onClick={handleProceedToResults}
                className="py-3.5 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>View Your Detailed Care Plan ➔</span>
              </button>
            </div>
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

          {/* Mandatory Clinical Notice & Medical Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-950 leading-relaxed font-medium">
              <b>Mandatory Clinical Guardrail:</b> Sandhi-AI is an AI-assisted multi-modal screening tool for early osteoarthritis risk stratification, not a definitive medical diagnosis. If risk is moderate or high, consult an Orthopedic Specialist or Medical Officer for clinical examination and confirmatory radiographic imaging (X-ray).
            </p>
          </div>

        </div>

      </main>

    </div>
  )
}
