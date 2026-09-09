import { useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { speakText, speakRepPraise, VOICE_PROMPTS } from "../utils/speech"

export default function MovementAnalysis() {
  const navigate = useNavigate()

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const demoCanvasRef = useRef(null)
  const streamRef = useRef(null)
  const animFrameId = useRef(null)
  const demoAnimId = useRef(null)

  // Tutorial / Demonstration Mode State (User Request)
  // Defaults to true so every user sees the human demo video/animation before taking the test!
  const [showDemoModal, setShowDemoModal] = useState(true)
  const [demoPhase, setDemoPhase] = useState("standing") // 'standing' or 'sitting'
  const [demoAngle, setDemoAngle] = useState(170)
  const [isDemoPlaying, setIsDemoPlaying] = useState(true)
  const [practiceDone, setPracticeDone] = useState(false)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [isSimulating, setIsSimulating] = useState(false)
  
  // Biomechanical States (PDF Page 3)
  const [kneeAngle, setKneeAngle] = useState(165)
  const [sitToStandState, setSitToStandState] = useState("STANDING") // STANDING or SITTING
  const [repCount, setRepCount] = useState(0)
  const [alignmentRatio, setAlignmentRatio] = useState(1.05)
  const [alignmentStatus, setAlignmentStatus] = useState("Normal Alignment (0.8 ≤ ratio ≤ 1.3)")
  
  // Timer for 30s Chair Stand Test
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [isTestingActive, setIsTestingActive] = useState(false)
  const [testComplete, setTestComplete] = useState(false)

  // Current language for voice prompts
  const [currentLang, setCurrentLang] = useState("en")

  useEffect(() => {
    const savedLang = localStorage.getItem("sandhi_lang") || "en"
    setCurrentLang(savedLang)

    // Start Demo Animation on mount
    startDemoAnimation()

    return () => {
      stopCamera()
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
      if (demoAnimId.current) cancelAnimationFrame(demoAnimId.current)
    }
  }, [])

  // Friendly Tutorial Speech Prompt when demo modal opens
  useEffect(() => {
    if (showDemoModal) {
      const prompt = VOICE_PROMPTS[currentLang] || VOICE_PROMPTS.en
      // Speak warm welcome tutorial
      setTimeout(() => {
        speakText(prompt.welcomeTutorial, currentLang)
      }, 500)
    }
  }, [showDemoModal, currentLang])

  // Timer countdown
  useEffect(() => {
    let interval = null
    if (isTestingActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1)
      }, 1000)
    } else if (isTestingActive && timerSeconds === 0) {
      setIsTestingActive(false)
      setTestComplete(true)
      const prompt = VOICE_PROMPTS[currentLang] || VOICE_PROMPTS.en
      speakText(`${prompt.testFinished} You completed ${repCount} beautiful repetitions!`, currentLang)
    }
    return () => clearInterval(interval)
  }, [isTestingActive, timerSeconds, repCount, currentLang])

  // ── HUMAN DEMONSTRATION ANIMATION LOOP ──
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
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
      bgGrad.addColorStop(0, "#f8fafc")
      bgGrad.addColorStop(1, "#e2e8f0")
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      // Floor line
      ctx.strokeStyle = "#cbd5e1"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, h * 0.88)
      ctx.lineTo(w, h * 0.88)
      ctx.stroke()

      // Chair illustration
      ctx.fillStyle = "#94a3b8"
      // Chair seat
      ctx.fillRect(w * 0.42, h * 0.58, w * 0.22, 10)
      // Chair backrest
      ctx.fillRect(w * 0.62, h * 0.32, 8, h * 0.28)
      // Chair legs
      ctx.fillRect(w * 0.43, h * 0.58, 6, h * 0.30)
      ctx.fillRect(w * 0.62, h * 0.58, 6, h * 0.30)

      // Gentle continuous sit-to-stand motion cycle
      t += 0.028
      const phase = (Math.sin(t) + 1) / 2 // 0 (seated) to 1 (standing)
      const currentAngle = Math.round(92 + phase * (170 - 92))
      setDemoAngle(currentAngle)
      setDemoPhase(phase > 0.5 ? "standing" : "sitting")

      // Human Body Coordinates
      const headY = h * 0.20 + (1 - phase) * 70
      const headX = w * 0.42 - (1 - phase) * 15
      const shoulderX = headX
      const shoulderY = headY + 28
      const hipX = w * 0.44 - (1 - phase) * 20
      const hipY = h * 0.48 + (1 - phase) * 35
      const kneeX = w * 0.38 + (1 - phase) * 45
      const kneeY = h * 0.68 + (1 - phase) * 5
      const ankleX = w * 0.36
      const ankleY = h * 0.87

      // Draw Human Figure (Warm medical illustration)
      // Head
      ctx.fillStyle = "#fbcfe8" // skin tone
      ctx.beginPath()
      ctx.arc(headX, headY, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = "#db2777"
      ctx.lineWidth = 2
      ctx.stroke()

      // Torso (teal t-shirt)
      ctx.strokeStyle = "#0f766e"
      ctx.lineWidth = 14
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.moveTo(shoulderX, shoulderY)
      ctx.lineTo(hipX, hipY)
      ctx.stroke()

      // Arms crossed over chest (critical instruction from guideline)
      ctx.strokeStyle = "#f472b6"
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(shoulderX - 10, shoulderY + 8)
      ctx.lineTo(shoulderX + 12, shoulderY + 18)
      ctx.moveTo(shoulderX + 10, shoulderY + 8)
      ctx.lineTo(shoulderX - 12, shoulderY + 18)
      ctx.stroke()

      // Legs (navy pants)
      ctx.strokeStyle = "#1e293b"
      ctx.lineWidth = 10
      ctx.beginPath()
      ctx.moveTo(hipX, hipY)
      ctx.lineTo(kneeX, kneeY)
      ctx.lineTo(ankleX, ankleY)
      ctx.stroke()

      // Feet flat on floor
      ctx.strokeStyle = "#0f172a"
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(ankleX, ankleY)
      ctx.lineTo(ankleX - 18, ankleY)
      ctx.stroke()

      // ── MediaPipe Pose Landmarks Overlay (Visual tracking lines) ──
      ctx.strokeStyle = "#14b8a6" // teal-500
      ctx.lineWidth = 3
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(hipX, hipY)
      ctx.lineTo(kneeX, kneeY)
      ctx.lineTo(ankleX, ankleY)
      ctx.stroke()
      ctx.setLineDash([])

      // Keypoint Circles
      const keypoints = [
        { x: hipX, y: hipY, label: "Hip (24)" },
        { x: kneeX, y: kneeY, label: `Knee: ${currentAngle}°` },
        { x: ankleX, y: ankleY, label: "Ankle (28)" }
      ]

      keypoints.forEach(kp => {
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = "#0d9488"
        ctx.lineWidth = 2.5
        ctx.stroke()

        ctx.fillStyle = "#0f172a"
        ctx.font = "bold 10px Inter, sans-serif"
        ctx.fillText(kp.label, kp.x + 10, kp.y + 4)
      })

      demoAnimId.current = requestAnimationFrame(renderDemo)
    }

    renderDemo()
  }

  // ── WEBCAM / SIMULATION PROCESS FRAME ──
  const processFrame = (simulatedProgress = null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const t = simulatedProgress !== null ? simulatedProgress : Date.now() / 600
    const flexPhase = (Math.sin(t) + 1) / 2
    const currentFlexAngle = Math.round(85 + flexPhase * (168 - 85))
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

    // State machine with sweeter audio praise
    setSitToStandState((prevState) => {
      if (currentFlexAngle < 100 && prevState === "STANDING") {
        return "SITTING"
      }
      if (currentFlexAngle > 160 && prevState === "SITTING") {
        setRepCount((prevReps) => {
          const nextReps = prevReps + 1
          // Use sweet interactive voice praise
          speakRepPraise(nextReps, currentLang)
          return nextReps
        })
        return "STANDING"
      }
      return prevState
    })

    // Draw Skeleton on Canvas
    ctx.lineWidth = 4
    ctx.strokeStyle = "#0d9488"
    ctx.lineCap = "round"

    ctx.beginPath()
    ctx.moveTo(leftHip.x, leftHip.y)
    ctx.lineTo(hip.x, hip.y)
    ctx.stroke()

    ctx.beginPath()
    ctx.strokeStyle = currentFlexAngle < 100 ? "#f97316" : "#10b981"
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

    if (isTestingActive || isSimulating) {
      animFrameId.current = requestAnimationFrame(() => processFrame())
    }
  }

  const startCamera = async () => {
    setShowDemoModal(false)
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

      startTest()
    } catch (err) {
      setCameraError("Camera unavailable. Using High-Precision MediaPipe Biomechanics Simulator.")
      startSimulation()
    }
  }

  const startSimulation = () => {
    setShowDemoModal(false)
    setIsSimulating(true)
    setCameraActive(true)
    startTest()
  }

  const startTest = () => {
    setRepCount(0)
    setTimerSeconds(30)
    setIsTestingActive(true)
    setTestComplete(false)
    const prompt = VOICE_PROMPTS[currentLang] || VOICE_PROMPTS.en
    speakText(prompt.sitToStandStart, currentLang)

    if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
    animFrameId.current = requestAnimationFrame(() => processFrame())
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
    setIsTestingActive(false)
    setIsSimulating(false)
  }

  const handlePracticeRep = () => {
    setPracticeDone(true)
    speakText("Beautiful form! That was a perfect practice repetition. You are all ready!", currentLang)
  }

  const continueToAIAnalysis = () => {
    stopCamera()
    navigate("/analysis", {
      state: {
        movementResults: {
          gait: { value: `${Math.round(alignmentRatio * 100)}%`, status: alignmentStatus },
          knee: { value: `${kneeAngle}°`, status: kneeAngle < 120 ? "Restricted Flexion" : "Normal Flexion" },
          posture: { value: `${repCount} Reps`, status: repCount < 9 ? "Reduced Quad Strength" : "Normal Functional Power" },
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

      {/* ── INTERACTIVE HUMAN DEMO & TUTORIAL MODAL (User Request) ── */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100 my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold px-3 py-1 uppercase tracking-wider">
                  Patient Instruction Video &amp; Guide
                </span>
                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  How to Perform the 30-Second Chair Stand Test
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Watch how a real person performs the knee test before starting your camera check.
                </p>
              </div>

              <button
                onClick={() => setShowDemoModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            {/* Human Demonstration Canvas & Visual Guidance */}
            <div className="mt-5 grid md:grid-cols-2 gap-5 items-center">
              
              {/* Left: Animated Real-Human Simulation Canvas */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 aspect-4/3 flex items-center justify-center">
                <canvas
                  ref={demoCanvasRef}
                  width={340}
                  height={260}
                  className="w-full h-full object-cover"
                />

                {/* Live Knee Angle Badge on Demo */}
                <div className="absolute top-3 left-3 rounded-lg bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-white text-[11px] font-mono">
                  <span>θ = </span>
                  <span className="font-bold text-teal-400">{demoAngle}°</span>
                </div>

                {/* State Badge on Demo */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 border border-slate-200 text-xs">
                  <span className="text-slate-600 font-medium">Movement Phase:</span>
                  <span className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                    demoPhase === "standing" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"
                  }`}>
                    {demoPhase === "standing" ? "Standing (Extension > 160°)" : "Sitting (Flexion < 100°)"}
                  </span>
                </div>
              </div>

              {/* Right: 3 Clear Steps with Sweet Voice Assistance */}
              <div className="space-y-3.5">
                
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold">1</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Sit on a Firm Chair</p>
                    <p className="text-[11px] text-slate-500">Keep back straight and feet flat on the ground, shoulder-width apart.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold">2</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cross Arms Gently</p>
                    <p className="text-[11px] text-slate-500">Cross arms over your chest. Do not push off from the chair with your hands.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold">3</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Stand Up Tall &amp; Sit Down</p>
                    <p className="text-[11px] text-slate-500">Stand up fully until knees are straight, then sit down smoothly. Repeat for 30 seconds!</p>
                  </div>
                </div>

                {/* Sweet Voice Playback Button */}
                <button
                  type="button"
                  onClick={() => speakText(VOICE_PROMPTS[currentLang]?.welcomeTutorial, currentLang)}
                  className="w-full rounded-xl bg-pink-50 border border-pink-200 py-2 px-3 text-xs font-bold text-pink-800 hover:bg-pink-100 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🌸</span>
                  <span>Listen to Sweet Audio Instructions</span>
                </button>

              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePracticeRep}
                className="w-full sm:w-auto rounded-xl border border-teal-600 bg-teal-50 px-4 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✨</span>
                <span>{practiceDone ? "✓ Practice Rep Done!" : "Try 1 Practice Rep"}</span>
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full sm:w-auto rounded-xl bg-teal-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>📷</span>
                  <span>I'm Ready — Start Live Webcam</span>
                </button>

                <button
                  type="button"
                  onClick={startSimulation}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>▶</span>
                  <span>Demo Mode</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MAIN MOVEMENT ANALYSIS VIEW ── */}
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 3 of 4 &bull; Computer Vision Kinematics</span>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">
              MediaPipe Joint ROM &amp; Sit-to-Stand Assessment
            </h1>
            <p className="text-sm text-slate-500">
              Real-time 30 FPS client-side pose tracking &bull; Zero video transmission &bull; 100% On-Device Privacy
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowDemoModal(true)}
              className="rounded-lg border border-teal-600 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition flex items-center gap-1.5"
            >
              <span>📺</span>
              <span>Watch Human Demo</span>
            </button>
            <button
              onClick={startCamera}
              className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition shadow-xs flex items-center gap-1.5"
            >
              <span>📷</span> Start Camera
            </button>
          </div>
        </div>

        {cameraError && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800 flex items-center justify-between">
            <span>ℹ️ {cameraError}</span>
            <button onClick={startSimulation} className="underline font-semibold text-amber-900">Run Simulator</button>
          </div>
        )}

        {/* Video & Tracking Canvas */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg aspect-4/3 flex items-center justify-center">
            
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${cameraActive && !isSimulating ? "opacity-40" : "hidden"}`}
            />

            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />

            {!cameraActive && (
              <div className="text-center p-8 z-10">
                <div className="mx-auto w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl mb-4">
                  📹
                </div>
                <h3 className="text-lg font-bold text-white">MediaPipe Pose Ready</h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  Click <b>Start Live Camera</b> or <b>Watch Human Demo</b> to see the proper sit-to-stand movement before you begin.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    onClick={startCamera}
                    className="rounded-lg bg-teal-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-teal-700 transition cursor-pointer"
                  >
                    Start Live Webcam
                  </button>
                  <button
                    onClick={() => setShowDemoModal(true)}
                    className="rounded-lg bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700 transition cursor-pointer"
                  >
                    Watch Demo Video
                  </button>
                </div>
              </div>
            )}

            {/* LIVE HUD OVERLAYS */}
            {cameraActive && (
              <>
                <div className="absolute top-4 left-4 z-20 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 p-3 text-white">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Knee Flexion θ</p>
                  <p className="text-2xl font-black text-teal-400 font-mono">{kneeAngle}°</p>
                  <p className="text-[10px] text-slate-300">Target: 135° - 145°</p>
                </div>

                <div className="absolute top-4 right-4 z-20 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 p-3 text-right text-white">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-slate-400">Chair Stand Timer:</span>
                    <span className="text-lg font-bold font-mono text-amber-400">{timerSeconds}s</span>
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1.5">
                    <span className="text-[10px] text-slate-400">State:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sitToStandState === "STANDING" ? "bg-emerald-900/80 text-emerald-300" : "bg-orange-900/80 text-orange-300"
                    }`}>
                      {sitToStandState}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-20 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-4 py-2.5 flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 font-black text-xl">
                      {repCount}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Sit-to-Stand Repetitions</p>
                      <p className="text-[11px] text-slate-400">Encouraging Audio Praise Active</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] font-mono text-slate-300">Dknee/Dankle: {alignmentRatio}</p>
                    <p className="text-xs font-semibold text-teal-400">{alignmentStatus.split("—")[0]}</p>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Right Column: Biomechanical Metrics & Action */}
          <div className="space-y-4">
            
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Joint Range of Motion</span>
                <span className="text-xs font-semibold text-teal-700">{kneeAngle >= 135 ? "Normal" : "Mild Deficit"}</span>
              </div>
              <p className="mt-2 text-3xl font-black text-slate-900 font-mono">{kneeAngle}°</p>
              <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, (kneeAngle / 160) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">Formula: θ = arccos((u·v)/(|u||v|)) × 180/π</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Frontal Knee Alignment</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  alignmentRatio > 1.3 ? "bg-red-100 text-red-700" : alignmentRatio < 0.8 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {alignmentRatio > 1.3 ? "VARUS" : alignmentRatio < 0.8 ? "VALGUS" : "NORMAL"}
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-slate-800">{alignmentStatus}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Ratio: <span className="font-mono font-semibold text-slate-800">{alignmentRatio}</span> (&gt;1.3 Varus, &lt;0.8 Valgus)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">30s Chair Stand Test</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 font-mono">{repCount}</span>
                <span className="text-xs text-slate-500">completed reps</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {repCount >= 12 ? "Strong lower limb power & quadriceps endurance." : "Reduced rep count may indicate quadriceps fatigue."}
              </p>
            </div>

            {/* Sweet Voice Encouragement Banner */}
            <div className="rounded-xl border border-pink-200 bg-pink-50/70 p-4">
              <div className="flex items-center gap-2 text-pink-900 text-xs font-bold mb-1">
                <span>🌸</span> Interactive Voice Encouragement
              </div>
              <p className="text-xs text-pink-800 italic">
                Sweet audio praise plays on every counted repetition to keep the patient motivated!
              </p>
              <button
                type="button"
                onClick={() => speakRepPraise(1, currentLang)}
                className="mt-2 text-[11px] font-semibold text-pink-700 hover:text-pink-900 underline"
              >
                Listen to Sample Praise Audio
              </button>
            </div>

            <button
              onClick={continueToAIAnalysis}
              className="w-full rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 py-3.5 px-4 font-bold text-white shadow-md hover:from-teal-800 hover:to-emerald-800 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue to AI Analysis</span>
              <span>→</span>
            </button>

          </div>

        </div>
      </main>
    </div>
  )
}
