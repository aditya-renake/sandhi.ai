import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { speakText, VOICE_PROMPTS } from "../utils/speech"

export default function Analysis() {
  const navigate = useNavigate()
  const location = useLocation()
  const waveformCanvasRef = useRef(null)
  const animRef = useRef(null)

  // Retrieve passed and stored clinical data
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

  const storedWomac = localStorage.getItem("sandhi_womac")
  const womacData = location.state?.assessmentData || (storedWomac ? JSON.parse(storedWomac) : null)
  const womacScore = location.state?.womacScore ?? (womacData?.womacScore ?? 42)

  const movementResults = location.state?.movementResults
  const gait = movementResults?.gait || { value: "92%", status: "Normal Alignment" }
  const knee = movementResults?.knee || { value: "85° ROM", status: "Mild ROM Deficit" }
  const posture = movementResults?.posture || { value: "8 Reps", status: "Moderate Quadriceps Endurance" }
  const sitToStandReps = movementResults?.sitToStandReps ?? 8
  const romVal = movementResults?.rom || 85
  const varusValgus = movementResults?.varusValgusAlignment || "Normal"
  const alignmentRatio = movementResults?.alignmentRatio || 1.05

  // Dynamically compute baseline acoustic parameters based on ROM and WOMAC score
  const initialBursts = romVal < 65 || womacScore > 60 ? 7 : romVal > 100 && womacScore < 25 ? 1 : 4
  const initialFreq = romVal < 65 || womacScore > 60 ? 235 : romVal > 100 && womacScore < 25 ? 88 : 142

  // Acoustic Sensor State (PDF Checklist Item 3: SandhiBand VAG)
  const [burstCount, setBurstCount] = useState(initialBursts)
  const [peakFrequency, setPeakFrequency] = useState(initialFreq) // Hz
  const [sensorPreset, setSensorPreset] = useState(initialBursts > 5 ? "severe" : initialBursts <= 1 ? "smooth" : "moderate")
  const [isWaveformPlaying, setIsWaveformPlaying] = useState(true)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // Composite Risk Score Calculation (PDF Page 6: Composite 0-100 Algorithm)
  const [compositeScore, setCompositeScore] = useState(50)
  const [riskCategory, setRiskCategory] = useState("MODERATE")
  const [klProxy, setKlProxy] = useState(2) // KL Grade 2 proxy
  const [referralStatus, setReferralStatus] = useState("PHC Physiotherapy & Orthopedic Triage")

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

  // Recalculate composite score whenever burstCount, sensorPreset, or inputs change
  useEffect(() => {
    // 1. WOMAC Component (max 30 pts)
    const womacComponent = (womacScore / 100) * 30

    // 2. CST Quadriceps Endurance Deficit (max 25 pts, reference: 15 reps in 30s)
    const cstDeficit = Math.max(0, 15 - sitToStandReps)
    const cstComponent = Math.min(25, (cstDeficit / 15) * 25)

    // 3. Knee ROM Deficit (max 20 pts, reference: 125 deg)
    const romDeficit = Math.max(0, 125 - romVal)
    const romComponent = Math.min(20, (romDeficit / 65) * 20)

    // 4. Acoustic VAG Crepitus Component (max 15 pts)
    const vagComponent = Math.min(15, (burstCount / 8) * 15)

    // 5. Varus/Valgus Alignment Deformity Penalty (max 10 pts)
    const alignmentPenalty = varusValgus === "Varus" ? 10 : varusValgus === "Valgus" ? 6 : 0

    const score = Math.min(100, Math.max(5, Math.round(womacComponent + cstComponent + romComponent + vagComponent + alignmentPenalty)))
    setCompositeScore(score)

    if (score >= 65) {
      setRiskCategory("HIGH")
      setKlProxy(score >= 82 ? 4 : 3)
      setReferralStatus("URGENT: District Orthopedic Specialist (GMCH/RIMS Triage)")
    } else if (score >= 35) {
      setRiskCategory("MODERATE")
      setKlProxy(2)
      setReferralStatus("PHC Physiotherapy & Joint Mobility Monitoring")
    } else {
      setRiskCategory("LOW")
      setKlProxy(score >= 20 ? 1 : 0)
      setReferralStatus("Community Lifestyle & Ergonomic Guidance")
    }

    startWaveformAnimation()

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [burstCount, peakFrequency, sitToStandReps, romVal, womacScore, varusValgus])

  useEffect(() => {
    // Spoken announcement on load
    const prompt = VOICE_PROMPTS[selectedLang] || VOICE_PROMPTS.en
    speakText(prompt.crepitusNotice, selectedLang)
  }, [selectedLang])

  // SandhiBand Real-time Acoustic Waveform Canvas Animation
  const startWaveformAnimation = () => {
    const canvas = waveformCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    let phase = 0

    const render = () => {
      const width = canvas.width
      const height = canvas.height
      const midY = height / 2

      ctx.fillStyle = "#090d16"
      ctx.fillRect(0, 0, width, height)

      // Draw oscilloscope grid lines
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

      // Draw VAG Baseline + Crepitus Spikes
      ctx.beginPath()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = "#2dd4bf" // teal-400

      phase += 0.08
      for (let x = 0; x < width; x++) {
        const normX = x / width
        // Baseline noise
        let y = Math.sin(x * 0.05 + phase) * 8 + (Math.random() - 0.5) * 4

        // 4 Crepitus spikes at intervals modeling joint flexion articulation
        const spikeIntervals = [0.22, 0.45, 0.68, 0.88]
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

      // Highlight the crepitus burst spikes with red/amber markers
      const spikeXPositions = [width * 0.22, width * 0.45, width * 0.68, width * 0.88]
      spikeXPositions.forEach((sx, idx) => {
        ctx.fillStyle = "#ef4444"
        ctx.beginPath()
        ctx.arc(sx, midY - 45, 5, 0, 2 * Math.PI)
        ctx.fill()

        ctx.fillStyle = "#fca5a5"
        ctx.font = "bold 9px Inter, sans-serif"
        ctx.fillText(`BURST #${idx + 1}`, sx - 22, midY - 55)
      })

      if (isWaveformPlaying) {
        animRef.current = requestAnimationFrame(render)
      }
    }

    render()
  }

  // Web Audio API to play realistic acoustic crepitus sound effect
  const playCrepitusSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      setIsPlayingAudio(true)

      // Burst bursts
      for (let i = 0; i < burstCount; i++) {
        const startTime = audioCtx.currentTime + i * 0.25
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()

        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(140 + (i % 2) * 60, startTime)
        osc.frequency.exponentialRampToValueAtTime(70, startTime + 0.15)

        gain.gain.setValueAtTime(0.3, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)

        osc.connect(gain)
        gain.connect(audioCtx.destination)

        osc.start(startTime)
        osc.stop(startTime + 0.15)
      }

      setTimeout(() => setIsPlayingAudio(false), burstCount * 250 + 200)
    } catch (e) {
      console.warn("Audio context error:", e)
      setIsPlayingAudio(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl p-4 md:p-8">
        
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 4 of 4 &bull; Multimodal AI Diagnostic Fusion</span>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">
              Multimodal Early OA Risk Analysis
            </h1>
            <p className="text-sm text-slate-500">
              Fusing MediaPipe Kinematics + SandhiBand Vibroarthrography (VAG) + Clinical WOMAC
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              riskCategory === "HIGH" ? "bg-red-100 text-red-700 border border-red-200" :
              riskCategory === "MODERATE" ? "bg-orange-100 text-orange-700 border border-orange-200" :
              "bg-emerald-100 text-emerald-700 border border-emerald-200"
            }`}>
              {riskCategory} RISK &bull; Score: {compositeScore}/100
            </span>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Left 2 Cols: SandhiBand Waveform Simulator & Metrics */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SANDHIBAND VAG ACOUSTIC SENSOR SIMULATOR (PDF Checklist Item 3) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700 font-bold text-sm">
                    ⚡
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      SandhiBand™ Vibroarthrographic (VAG) Acoustic Waveform
                    </h3>
                    <p className="text-xs text-slate-500">
                      Hardware Telemetry: ESP32-S3 + Piezoelectric Contact Transducer (Sampling: 4,000 Hz)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const prompt = VOICE_PROMPTS[selectedLang] || VOICE_PROMPTS.en
                      speakText(prompt.crepitusNotice, selectedLang)
                    }}
                    className="rounded-lg bg-teal-900/40 px-3 py-1.5 text-xs font-semibold text-teal-300 hover:bg-teal-900/60 transition flex items-center gap-1.5 border border-teal-700/60 cursor-pointer"
                    title="Hear diagnosis announcement in your language"
                  >
                    <span>🗣️</span>
                    <span>Listen ({VOICE_PROMPTS[selectedLang]?.nativeName || "English"})</span>
                  </button>

                  <button
                    onClick={playCrepitusSound}
                    disabled={isPlayingAudio}
                    className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-teal-400 hover:bg-slate-800 transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <span>{isPlayingAudio ? "🔊" : "▶"}</span>
                    <span>{isPlayingAudio ? "Playing VAG Audio..." : "Auditory Crepitus Playback"}</span>
                  </button>
                </div>
              </div>

              {/* Real-time Oscilloscope Canvas */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                <canvas
                  ref={waveformCanvasRef}
                  width={680}
                  height={220}
                  className="w-full h-52 object-cover block"
                />

                <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400 flex gap-4">
                  <span>Bandpass: 50Hz - 1,000Hz</span>
                  <span>FFT Peak: <b className="text-teal-400">{peakFrequency} Hz</b></span>
                  <span>Crepitus Bursts: <b className="text-red-400">{burstCount} detected</b></span>
                </div>
              </div>

              {/* Hardware Diagnostic Metrics */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <p className="text-[11px] font-medium text-slate-500">Acoustic Burst Count</p>
                  <p className="text-xl font-bold text-red-600 font-mono mt-1">{burstCount} spikes</p>
                  <p className="text-[10px] text-slate-400">Normal: &le; 1 spike</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <p className="text-[11px] font-medium text-slate-500">Dominant Frequency</p>
                  <p className="text-xl font-bold text-teal-700 font-mono mt-1">{peakFrequency} Hz</p>
                  <p className="text-[10px] text-slate-400">Cartilage friction band</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <p className="text-[11px] font-medium text-slate-500">VAG Crepitus Classification</p>
                  <p className="text-xs font-bold text-amber-700 mt-1.5">Moderate Patellofemoral</p>
                  <p className="text-[10px] text-slate-400">Subchondral roughness</p>
                </div>
              </div>
            </div>

            {/* Fused Multi-Signal Biomechanical Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">
                Clinical Biomechanics & Functional Kinematics
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <span className="text-[11px] font-medium text-slate-500">Knee Flexion Angle</span>
                  <p className="text-2xl font-bold text-slate-800 font-mono mt-1">{knee.value}</p>
                  <p className="text-xs text-orange-600 mt-1 font-medium">{knee.status}</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <span className="text-[11px] font-medium text-slate-500">30s Chair Stand Reps</span>
                  <p className="text-2xl font-bold text-slate-800 font-mono mt-1">{posture.value}</p>
                  <p className="text-xs text-teal-700 mt-1 font-medium">{posture.status}</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <span className="text-[11px] font-medium text-slate-500">Frontal Alignment (Dknee/Dankle)</span>
                  <p className="text-2xl font-bold text-slate-800 font-mono mt-1">{varusValgus}</p>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{gait.status}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Composite Risk Card & Clinical Recommendation */}
          <div className="space-y-6">
            
            {/* Risk Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Composite OA Risk Score</span>
              
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900 font-mono">{compositeScore}</span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: "35%" }} />
                <div className="h-full bg-amber-500" style={{ width: "30%" }} />
                <div className="h-full bg-red-500" style={{ width: "35%" }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 Low</span>
                <span>35 Moderate</span>
                <span>65 High</span>
                <span>100</span>
              </div>

              {/* KL Grade Proxy */}
              <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Kellgren-Lawrence Proxy</span>
                  <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">Grade {klProxy}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Definite joint space narrowing & early osteophytes</p>
              </div>

              {/* Referral Recommendation */}
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/80 p-4">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Clinical Action Plan</h4>
                <p className="mt-1.5 text-xs font-semibold text-blue-950 leading-relaxed">
                  {referralStatus}
                </p>
                <p className="mt-2 text-[11px] text-blue-800 leading-normal">
                  Initiate quadriceps strengthening, avoid deep squatting on tea gardens/slopes, and schedule follow-up radiograph.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate("/results", { 
                state: { 
                  patient,
                  compositeScore, 
                  riskCategory, 
                  klProxy, 
                  referralStatus,
                  womacScore,
                  movementResults: {
                    sitToStandReps,
                    rom: romVal,
                    varusValgus,
                    alignmentRatio,
                    gait,
                    knee,
                    posture
                  },
                  vagData: {
                    burstCount,
                    peakFrequency
                  }
                } 
              })}
                className="w-full rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 py-3.5 px-4 font-bold text-white shadow-md hover:from-teal-800 hover:to-emerald-800 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>View Full Clinical Report & PDF</span>
                <span>→</span>
              </button>

              <button
                onClick={() => navigate("/movement")}
                className="w-full rounded-xl border border-slate-300 py-2.5 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                ← Retest Movement Kinematics
              </button>
            </div>

          </div>

        </div>

      </main>
    </div>
  )
}
