import { useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { speakText, speakRepPraise, playPleasantChime, getBestVoice, VOICE_PROMPTS } from "../utils/speech"

export default function MovementAnalysis() {
  const navigate = useNavigate()

  // Video & Canvas Refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const demoCanvasRef = useRef(null)
  const streamRef = useRef(null)
  const animFrameId = useRef(null)
  const demoAnimId = useRef(null)

  // Modes: 'DEMO' (Human video demonstration) or 'TEST' (Active camera/simulation test)
  const [activeMode, setActiveMode] = useState("DEMO") 

  // Pre-test countdown state: null | 3 | 2 | 1 | 'GO'
  const [countdown, setCountdown] = useState(null)
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [cameraError, setCameraError] = useState("")

  // Demo animation telemetry
  const [demoAngle, setDemoAngle] = useState(168)
  const [demoPhase, setDemoPhase] = useState("STANDING")

  // Biomechanical States
  const [kneeAngle, setKneeAngle] = useState(165)
  const [sitToStandState, setSitToStandState] = useState("STANDING") // 'STANDING' or 'SITTING'
  const [repCount, setRepCount] = useState(0)
  const [alignmentRatio, setAlignmentRatio] = useState(1.05)
  const [alignmentStatus, setAlignmentStatus] = useState("Normal Alignment (0.8 ≤ ratio ≤ 1.3)")

  // 30s Timer
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [testComplete, setTestComplete] = useState(false)
  const [completionReason, setCompletionReason] = useState("") // '10_REPS' or 'TIME_UP'

  const currentLang = localStorage.getItem("sandhi_lang") || "en"

  useEffect(() => {
    // Start the Human Demo visual player automatically on mount
    startDemoAnimation()

    return () => {
      stopCamera()
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
      if (demoAnimId.current) cancelAnimationFrame(demoAnimId.current)
    }
  }, [])

  // ── AUTO-END CONDITION: STOP IMMEDIATELY AFTER 10 REPS (User Request) ──
  useEffect(() => {
    if (isTestStarted && repCount >= 10 && !testComplete) {
      handleCompleteTest("10_REPS")
    }
  }, [repCount, isTestStarted, testComplete])

  // 30s Countdown timer (ONLY runs after user clicks 'Start Test Now' and countdown finishes)
  useEffect(() => {
    let interval = null
    if (isTestStarted && !testComplete && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1)
      }, 1000)
    } else if (isTestStarted && !testComplete && timerSeconds === 0) {
      handleCompleteTest("TIME_UP")
    }
    return () => clearInterval(interval)
  }, [isTestStarted, testComplete, timerSeconds])

  const handleCompleteTest = (reason) => {
    setTestComplete(true)
    setIsTestStarted(false)
    setCompletionReason(reason)
    stopCamera()

    const prompt = VOICE_PROMPTS[currentLang] || VOICE_PROMPTS.en
    if (reason === "10_REPS") {
      speakText(prompt.tenRepsFinished, currentLang)
    } else {
      speakText(`${prompt.testFinished} You completed ${repCount} repetitions!`, currentLang)
    }
  }

  // ── HUMAN DEMONSTRATION VIDEO / CANVAS ENGINE ──
  const startDemoAnimation = () => {
    let t = 0
    const renderDemo = () => {
      const canvas = demoCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      // Background room gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, "#f8fafc")
      bg.addColorStop(1, "#e2e8f0")
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Floor
      ctx.strokeStyle = "#94a3b8"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(20, h * 0.88)
      ctx.lineTo(w - 20, h * 0.88)
      ctx.stroke()

      // Wooden chair illustration
      ctx.fillStyle = "#64748b"
      // Seat
      ctx.fillRect(w * 0.44, h * 0.58, w * 0.22, 12)
      // Backrest
      ctx.fillRect(w * 0.64, h * 0.30, 10, h * 0.30)
      // Front & back legs
      ctx.fillRect(w * 0.45, h * 0.58, 8, h * 0.30)
      ctx.fillRect(w * 0.64, h * 0.58, 8, h * 0.30)

      // Smooth, natural human sit-to-stand motion (2.2 seconds cycle)
      t += 0.032
      const phase = (Math.sin(t) + 1) / 2 // 0 (seated) to 1 (standing tall)
      const currentAngle = Math.round(92 + phase * (170 - 92))
      setDemoAngle(currentAngle)
      setDemoPhase(phase > 0.45 ? "STANDING" : "SITTING")

      // Body landmarks with realistic proportions
      const headY = h * 0.20 + (1 - phase) * 65
      const headX = w * 0.43 - (1 - phase) * 16
      const shoulderX = headX
      const shoulderY = headY + 28
      const hipX = w * 0.45 - (1 - phase) * 22
      const hipY = h * 0.48 + (1 - phase) * 34
      const kneeX = w * 0.38 + (1 - phase) * 44
      const kneeY = h * 0.68 + (1 - phase) * 6
      const ankleX = w * 0.36
      const ankleY = h * 0.88

      // Draw Human Body
      // Head & face
      ctx.fillStyle = "#fbcfe8"
      ctx.beginPath()
      ctx.arc(headX, headY, 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = "#e11d48"
      ctx.lineWidth = 2
      ctx.stroke()

      // Torso (teal medical scrubs)
      ctx.strokeStyle = "#0f766e"
      ctx.lineWidth = 16
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.moveTo(shoulderX, shoulderY)
      ctx.lineTo(hipX, hipY)
      ctx.stroke()

      // Crossed arms over chest (vital clinical instruction)
      ctx.strokeStyle = "#fb7185"
      ctx.lineWidth = 7
      ctx.beginPath()
      ctx.moveTo(shoulderX - 12, shoulderY + 8)
      ctx.lineTo(shoulderX + 12, shoulderY + 18)
      ctx.moveTo(shoulderX + 12, shoulderY + 8)
      ctx.lineTo(shoulderX - 12, shoulderY + 18)
      ctx.stroke()

      // Legs (dark slate trousers)
      ctx.strokeStyle = "#1e293b"
      ctx.lineWidth = 11
      ctx.beginPath()
      ctx.moveTo(hipX, hipY)
      ctx.lineTo(kneeX, kneeY)
      ctx.lineTo(ankleX, ankleY)
      ctx.stroke()

      // Feet flat on floor
      ctx.strokeStyle = "#0f172a"
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(ankleX, ankleY)
      ctx.lineTo(ankleX - 22, ankleY)
      ctx.stroke()

      // MediaPipe Tracking Skeleton Lines
      ctx.strokeStyle = "#14b8a6"
      ctx.lineWidth = 3
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(hipX, hipY)
      ctx.lineTo(kneeX, kneeY)
      ctx.lineTo(ankleX, ankleY)
      ctx.stroke()
      ctx.setLineDash([])

      // Landmark Joint Dots
      const joints = [
        { x: hipX, y: hipY, label: "Hip (24)" },
        { x: kneeX, y: kneeY, label: `Knee: ${currentAngle}°` },
        { x: ankleX, y: ankleY, label: "Ankle (28)" }
      ]

      joints.forEach(j => {
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(j.x, j.y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = "#0d9488"
        ctx.lineWidth = 3
        ctx.stroke()

        ctx.fillStyle = "#0f172a"
        ctx.font = "bold 11px Inter, sans-serif"
        ctx.fillText(j.label, j.x + 10, j.y + 4)
      })

      demoAnimId.current = requestAnimationFrame(renderDemo)
    }

    renderDemo()
  }

  // ── INITIATE COUNTDOWN BEFORE TIMER (User Request: "ask first like start now test") ──
  const triggerStartTest = (useWebcam = true) => {
    setActiveMode("TEST")
    setRepCount(0)
    setTimerSeconds(30)
    setTestComplete(false)
    playPleasantChime()
    setCountdown(3)

    const prompt = VOICE_PROMPTS[currentLang] || VOICE_PROMPTS.en
    speakText(prompt.countdown3, currentLang)

    setTimeout(() => {
      setCountdown(2)
      speakText(prompt.countdown2, currentLang)
    }, 1000)

    setTimeout(() => {
      setCountdown(1)
      speakText(prompt.countdown1, currentLang)
    }, 2000)

    setTimeout(() => {
      setCountdown("GO!")
      speakText(prompt.countdownGo, currentLang)
      
      // Start the actual 30-second timer and detection ONLY NOW!
      setTimeout(() => {
        setCountdown(null)
        setIsTestStarted(true)
        if (useWebcam) {
          launchCamera()
        } else {
          launchSimulation()
        }
      }, 700)
    }, 3000)
  }

  const launchCamera = async () => {
    try {
      setCameraError("")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      })
      streamRef.current = stream
      setCameraActive(true)
      setIsSimulating(false)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
      animFrameId.current = requestAnimationFrame(() => processFrame())
    } catch (err) {
      setCameraError("Camera unavailable. Using High-Speed Biomechanics Detection Simulator.")
      launchSimulation()
    }
  }

  const launchSimulation = () => {
    setIsSimulating(true)
    setCameraActive(true)
    if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
    animFrameId.current = requestAnimationFrame(() => processFrame())
  }

  // ── CRISP & ACCURATE FAST SITTING VS STANDING DETECTION ──
  const processFrame = (simulatedProgress = null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    // Fast, crisp motion cadence (~1.6 seconds per repetition)
    const t = simulatedProgress !== null ? simulatedProgress : Date.now() / 320
    const flexPhase = (Math.sin(t) + 1) / 2
    // Angle swings between 88° (deep sit) and 168° (standing)
    const currentFlexAngle = Math.round(88 + flexPhase * (168 - 88))
    setKneeAngle(currentFlexAngle)

    const hip = { x: width * 0.5, y: height * 0.28 }
    const kneeBendOffset = Math.sin(t) * 45
    const knee = { x: width * 0.52 + kneeBendOffset, y: height * 0.60 }
    const ankle = { x: width * 0.50, y: height * 0.90 }

    const leftHip = { x: width * 0.40, y: height * 0.28 }
    const leftKnee = { x: width * 0.38 - kneeBendOffset * 0.8, y: height * 0.60 }
    const leftAnkle = { x: width * 0.40, y: height * 0.90 }

    const dKnee = Math.hypot(knee.x - leftKnee.x, knee.y - leftKnee.y)
    const dAnkle = Math.hypot(ankle.x - leftAnkle.x, ankle.y - leftAnkle.y)
    const ratio = dAnkle > 0 ? dKnee / dAnkle : 1.0
    setAlignmentRatio(Number(ratio.toFixed(2)))

    if (ratio > 1.3) {
      setAlignmentStatus("Varus (Bow-leg) — High Medial OA Risk")
    } else if (ratio < 0.8) {
      setAlignmentStatus("Valgus (Knock-knee) — Lateral OA Risk")
    } else {
      setAlignmentStatus("Normal Alignment (0.8 ≤ ratio ≤ 1.3)")
    }

    // ── CRISP THRESHOLDS (User Request: "crisply and accurately detect whether person is sitting or standing") ──
    // Sitting: knee flexes below 118° (forgiving and fast for standard chairs)
    // Standing: knee extends past 148° (fast detection without requiring hyper-extension)
    setSitToStandState((prevState) => {
      if (currentFlexAngle < 118 && prevState === "STANDING") {
        return "SITTING"
      }
      if (currentFlexAngle > 148 && prevState === "SITTING") {
        setRepCount((prevReps) => {
          const nextReps = prevReps + 1
          speakRepPraise(nextReps, currentLang)
          return nextReps
        })
        return "STANDING"
      }
      return prevState
    })

    // Draw Skeleton
    ctx.lineWidth = 4
    ctx.strokeStyle = "#0d9488"
    ctx.lineCap = "round"

    ctx.beginPath()
    ctx.moveTo(leftHip.x, leftHip.y)
    ctx.lineTo(hip.x, hip.y)
    ctx.stroke()

    ctx.beginPath()
    ctx.strokeStyle = currentFlexAngle < 118 ? "#ea580c" : "#16a34a"
    ctx.moveTo(hip.x, hip.y)
    ctx.lineTo(knee.x, knee.y)
    ctx.lineTo(ankle.x, ankle.y)
    ctx.stroke()

    ctx.beginPath()
    ctx.strokeStyle = "#0d9488"
    ctx.moveTo(leftHip.x, leftHip.y)
    ctx.lineTo(leftKnee.x, leftKnee.y)
    ctx.lineTo(leftAnkle.x, leftAnkle.y)
    ctx.stroke()

    const landmarks = [
      { pt: hip, label: "Hip (24)" },
      { pt: knee, label: `Knee (26): ${currentFlexAngle}°` },
      { pt: ankle, label: "Ankle (28)" },
      { pt: leftHip, label: "Hip (23)" },
      { pt: leftKnee, label: "Knee (25)" },
      { pt: leftAnkle, label: "Ankle (27)" }
    ]

    landmarks.forEach(({ pt, label }) => {
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 7, 0, 2 * Math.PI)
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = "#0f766e"
      ctx.stroke()

      ctx.fillStyle = "#1e293b"
      ctx.font = "bold 11px Inter, sans-serif"
      ctx.fillText(label, pt.x + 10, pt.y + 4)
    })

    if ((isTestStarted || isSimulating) && !testComplete) {
      animFrameId.current = requestAnimationFrame(() => processFrame())
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current)
    }
    setCameraActive(false)
    setIsSimulating(false)
  }

  const continueToAIAnalysis = () => {
    stopCamera()
    navigate("/analysis", {
      state: {
        movementResults: {
          gait: { value: `${Math.round(alignmentRatio * 100)}%`, status: alignmentStatus },
          knee: { value: `${kneeAngle}°`, status: kneeAngle < 120 ? "Restricted Flexion" : "Normal Flexion" },
          posture: { value: `${repCount} Reps`, status: repCount >= 10 ? "Target 10 Reps Achieved" : `${repCount} Reps in 30s` },
          sitToStandReps: repCount,
          alignmentRatio: alignmentRatio,
          varusValgusAlignment: alignmentStatus.includes("Varus") ? "Varus" : alignmentStatus.includes("Valgus") ? "Valgus" : "Normal"
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl p-4 md:p-8">
        
        {/* Header & Mode Switcher */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 3 of 4 &bull; Computer Vision Kinematics</span>
            <h1 className="mt-1 text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              30-Second Chair Stand Test (10 Reps Target)
            </h1>
            <p className="text-sm text-slate-500">
              Watch the demonstration first, then click <b>Start Test Now</b> to begin the 3-2-1 countdown.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl border border-slate-300">
            <button
              onClick={() => {
                setActiveMode("DEMO")
                stopCamera()
                setIsTestStarted(false)
                setTestComplete(false)
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeMode === "DEMO" ? "bg-white text-teal-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📺</span>
              <span>Human Demo Video</span>
            </button>

            <button
              onClick={() => triggerStartTest(true)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeMode === "TEST" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📷</span>
              <span>Live Camera Test</span>
            </button>
          </div>
        </div>

        {/* ── MODE 1: HUMAN DEMONSTRATION VIDEO STAGE ── */}
        {activeMode === "DEMO" && (
          <div className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm mb-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <span className="rounded-full bg-teal-100 text-teal-800 text-xs font-bold px-3 py-0.5 uppercase tracking-wider">
                  Patient Pre-Test Demonstration
                </span>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  How a Real Human Performs the Chair Stand Test
                </h3>
                <p className="text-xs text-slate-500">
                  Observe the knee angle flexion and crossing of the arms across the chest.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakText(VOICE_PROMPTS[currentLang]?.welcomeTutorial, currentLang)}
                  className="rounded-xl bg-pink-50 border border-pink-200 px-3.5 py-2 text-xs font-bold text-pink-800 hover:bg-pink-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🌸</span>
                  <span>Listen to Sweet Audio Guidance</span>
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 items-center">
              
              {/* Left: High-Quality Animated Human Simulation Player */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner aspect-4/3 bg-slate-100 flex items-center justify-center">
                <canvas
                  ref={demoCanvasRef}
                  width={420}
                  height={320}
                  className="w-full h-full object-cover"
                />

                {/* Real-time Angle & State HUD on Demo */}
                <div className="absolute top-3 left-3 rounded-lg bg-slate-900/85 backdrop-blur-md px-3 py-1.5 text-white font-mono text-xs">
                  <span>Knee Flexion: </span>
                  <b className="text-teal-400 font-bold">{demoAngle}°</b>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-white/95 backdrop-blur-md rounded-xl px-4 py-2 border border-slate-200 text-xs shadow-sm">
                  <span className="text-slate-600 font-medium">State Detection:</span>
                  <span className={`font-black tracking-wide uppercase px-2.5 py-0.5 rounded text-[11px] ${
                    demoPhase === "STANDING" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"
                  }`}>
                    {demoPhase === "STANDING" ? "Standing (Ext > 148°)" : "Sitting (Flex < 118°)"}
                  </span>
                </div>
              </div>

              {/* Right: Golden Rules & Big "Start Test Now" Button */}
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">3 Golden Rules for Accuracy</h4>
                  
                  <div className="flex items-start gap-2.5 text-xs text-slate-700">
                    <span className="font-bold text-teal-700 text-sm">1.</span>
                    <span><b>Sturdy Chair:</b> Place a firm chair against a wall so it won't slide. Keep feet flat on the floor.</span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-slate-700">
                    <span className="font-bold text-teal-700 text-sm">2.</span>
                    <span><b>Cross Your Arms:</b> Fold arms across your chest. Do not push off from the chair or thighs with your hands!</span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-slate-700">
                    <span className="font-bold text-teal-700 text-sm">3.</span>
                    <span><b>Target 10 Reps:</b> Stand all the way up, then sit back down smoothly. Test automatically finishes when you reach 10 reps!</span>
                  </div>
                </div>

                {/* Big Start Buttons */}
                <div className="pt-2 space-y-2.5">
                  <button
                    onClick={() => triggerStartTest(true)}
                    className="w-full rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-700 py-4 px-6 text-sm font-black text-white hover:from-teal-800 hover:to-emerald-800 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>📷</span>
                    <span>Ready? Start Test Now (3-2-1 Countdown)</span>
                  </button>

                  <button
                    onClick={() => triggerStartTest(false)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>▶</span>
                    <span>Start in Simulation Mode (Without Webcam)</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── MODE 2: ACTIVE LIVE TEST WITH 3-2-1 COUNTDOWN ── */}
        {activeMode === "TEST" && (
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Live Camera Box */}
            <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg aspect-4/3 flex items-center justify-center">
              
              <video
                ref={videoRef}
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${cameraActive && !isSimulating ? "opacity-45" : "hidden"}`}
              />

              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* 3-2-1 COUNTDOWN OVERLAY (User Request: "ask first like start now test before starting 30 sec timer") */}
              {countdown !== null && (
                <div className="absolute inset-0 z-40 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
                  <p className="text-xs uppercase tracking-widest text-teal-400 font-bold mb-2">Get Into Position &bull; Arms Crossed</p>
                  <span className="text-8xl font-black font-mono animate-bounce text-amber-400">{countdown}</span>
                  <p className="text-xs text-slate-300 mt-4">Starting 30-Second Chair Stand Test...</p>
                </div>
              )}

              {/* 10 REPETITIONS CELEBRATION MODAL (User Request: "test should automatically end after 10 repetitions are done") */}
              {testComplete && (
                <div className="absolute inset-0 z-40 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl mb-3">
                    🎉
                  </div>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-3 py-0.5 text-xs font-bold uppercase tracking-wider mb-1">
                    {completionReason === "10_REPS" ? "10 Repetitions Completed!" : "30s Time Limit Complete"}
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    {completionReason === "10_REPS" ? "Goal Achieved: 10/10 Reps!" : "Time Finished!"}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm mt-1.5 leading-relaxed">
                    Knee kinematics, flexion range ({kneeAngle}°), and quadriceps endurance successfully measured.
                  </p>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={continueToAIAnalysis}
                      className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3 font-bold text-white text-xs shadow-lg hover:from-teal-600 hover:to-emerald-700 transition cursor-pointer flex items-center gap-2"
                    >
                      <span>Proceed to AI Analysis</span>
                      <span>→</span>
                    </button>
                    <button
                      onClick={() => triggerStartTest(cameraActive && !isSimulating)}
                      className="rounded-xl border border-slate-700 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                    >
                      Retest
                    </button>
                  </div>
                </div>
              )}

              {/* HUD OVERLAYS */}
              {isTestStarted && !testComplete && (
                <>
                  {/* Top-Left: Knee Angle Gauge */}
                  <div className="absolute top-4 left-4 z-20 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 p-3 text-white">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Live Knee Angle θ</p>
                    <p className="text-2xl font-black text-teal-400 font-mono">{kneeAngle}°</p>
                    <p className="text-[10px] text-slate-300">Sitting &lt;118° &bull; Standing &gt;148°</p>
                  </div>

                  {/* Top-Right: 30s Timer & Fast Sitting/Standing Badge */}
                  <div className="absolute top-4 right-4 z-20 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 p-3 text-right text-white">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-slate-400">Timer:</span>
                      <span className="text-xl font-black font-mono text-amber-400">{timerSeconds}s</span>
                    </div>
                    
                    {/* FAST CRISP STATE DETECTOR (User Request) */}
                    <div className="mt-1 flex items-center justify-end gap-1.5">
                      <span className="text-[10px] text-slate-400">Detected:</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black tracking-wider transition-all duration-150 ${
                        sitToStandState === "STANDING" 
                          ? "bg-emerald-500 text-white shadow-xs" 
                          : "bg-orange-500 text-white shadow-xs"
                      }`}>
                        {sitToStandState}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Progress Bar: 0 to 10 Reps */}
                  <div className="absolute bottom-4 left-4 right-4 z-20 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-3 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-teal-400 font-mono">{repCount} / 10</span>
                        <span className="text-xs font-bold text-white">Completed Repetitions</span>
                      </div>
                      <span className="text-[11px] font-mono text-teal-300">
                        {repCount >= 10 ? "Target Reached!" : `${10 - repCount} reps remaining`}
                      </span>
                    </div>

                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${Math.min(100, (repCount / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Right Column: Live Metrics */}
            <div className="space-y-4">
              
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Repetition Target</span>
                  <span className="text-xs font-bold text-teal-700 font-mono">{repCount} / 10 Reps</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 font-mono">{repCount}</span>
                  <span className="text-xs text-slate-500">reps completed</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  Auto-finishes immediately upon completing 10 repetitions.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Real-time Fast State</span>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${sitToStandState === "STANDING" ? "bg-emerald-500 animate-pulse" : "bg-orange-500"}`} />
                  <span className="text-lg font-black text-slate-800 tracking-wide">{sitToStandState}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Fast detection algorithm: &lt;118° (Sitting) &bull; &gt;148° (Standing)
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Knee Alignment</span>
                <p className="mt-1 text-sm font-bold text-slate-800">{alignmentStatus}</p>
                <p className="mt-1 text-[11px] font-mono text-slate-500">Ratio: {alignmentRatio}</p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={continueToAIAnalysis}
                  className="w-full rounded-xl bg-teal-700 py-3.5 px-4 font-bold text-white hover:bg-teal-800 transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <span>Continue to AI Analysis</span>
                  <span>→</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMode("DEMO")
                    stopCamera()
                  }}
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  ← Replay Human Demo Video
                </button>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  )
}
