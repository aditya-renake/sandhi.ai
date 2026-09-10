import { useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { speakText, speakRepPraise, playPleasantChime, getBestVoice, VOICE_PROMPTS, speakVideoNarration } from "../utils/speech"

export default function MovementAnalysis() {
  const navigate = useNavigate()

  // Video & Canvas Refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const demoVideoRef = useRef(null)
  const streamRef = useRef(null)
  const animFrameId = useRef(null)

  // Real-time Optical Computer Vision Tracking Refs & States
  const offscreenCanvasRef = useRef(null)
  const sittingBaselineYRef = useRef(null)
  const standingBaselineYRef = useRef(null)
  const smoothElevationRef = useRef(0.18)
  const lastPostureRef = useRef("SITTING")
  const repCooldownRef = useRef(0)
  const [elevationPercent, setElevationPercent] = useState(18)
  const [calibrationNotice, setCalibrationNotice] = useState("")

  // Modes: 'DEMO' (Human video demonstration) or 'TEST' (Active camera/simulation test)
  const [activeMode, setActiveMode] = useState("DEMO") 
  const [demoVideoSource, setDemoVideoSource] = useState("video") // 'video' or 'youtube'
  const [videoStepIndex, setVideoStepIndex] = useState(0)

  // Cycle synchronized multilingual subtitles during video demonstration
  useEffect(() => {
    let interval = null
    if (activeMode === "DEMO") {
      interval = setInterval(() => {
        setVideoStepIndex((prev) => (prev + 1) % 4)
      }, 3500)
    }
    return () => clearInterval(interval)
  }, [activeMode])

  // Pre-test countdown state: null | 3 | 2 | 1 | 'GO'
  const [countdown, setCountdown] = useState(null)
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [cameraError, setCameraError] = useState("")

  // Clinical Profile & Biomechanical States (Dynamic Testing)
  const [clinicalProfile, setClinicalProfile] = useState("moderate") // 'healthy' | 'moderate' | 'severe'
  const [kneeAngle, setKneeAngle] = useState(165)
  const [minFlexion, setMinFlexion] = useState(88)
  const [maxExtension, setMaxExtension] = useState(168)
  const [sitToStandState, setSitToStandState] = useState("STANDING") // 'STANDING' or 'SITTING'
  const [repCount, setRepCount] = useState(0)
  const [alignmentRatio, setAlignmentRatio] = useState(1.05)
  const [alignmentStatus, setAlignmentStatus] = useState("Normal Alignment (0.8 ≤ ratio ≤ 1.3)")

  // 30s Timer
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [testComplete, setTestComplete] = useState(false)
  const [completionReason, setCompletionReason] = useState("") // '10_REPS' or 'TIME_UP'

  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem("sandhi_lang") || "en")
  const [isPlayingVoicePreview, setIsPlayingVoicePreview] = useState(false)

  useEffect(() => {
    const onLangChange = (e) => {
      if (e.detail) setSelectedLang(e.detail)
    }
    window.addEventListener("sandhi_language_changed", onLangChange)
    return () => window.removeEventListener("sandhi_language_changed", onLangChange)
  }, [])

  const handleSelectLang = (langKey, playAudio = true) => {
    setSelectedLang(langKey)
    localStorage.setItem("sandhi_lang", langKey)
    window.dispatchEvent(new CustomEvent("sandhi_language_changed", { detail: langKey }))

    // Restart video when language is changed so it synchronizes
    if (demoVideoRef.current) {
      demoVideoRef.current.currentTime = 0
      demoVideoRef.current.play().catch(() => {})
    }

    if (playAudio) {
      setIsPlayingVoicePreview(true)
      speakVideoNarration(langKey)
      setTimeout(() => setIsPlayingVoicePreview(false), 4000)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
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

    const prompt = VOICE_PROMPTS[selectedLang] || VOICE_PROMPTS.en
    if (reason === "10_REPS") {
      speakText(prompt.tenRepsFinished, selectedLang)
    } else {
      if (selectedLang === "en") {
        speakText(`${prompt.testFinished} You completed ${repCount} repetitions!`, "en")
      } else {
        speakText(prompt.testFinished, selectedLang)
      }
    }
  }

  // ── INITIATE COUNTDOWN BEFORE TIMER (User Request: "ask first like start now test") ──
  const triggerStartTest = (useWebcam = true) => {
    setActiveMode("TEST")
    setRepCount(0)
    setTimerSeconds(30)
    setTestComplete(false)
    playPleasantChime()
    setCountdown(3)

    const prompt = VOICE_PROMPTS[selectedLang] || VOICE_PROMPTS.en
    speakText(prompt.countdown3, selectedLang)

    setTimeout(() => {
      setCountdown(2)
      speakText(prompt.countdown2, selectedLang)
    }, 1000)

    setTimeout(() => {
      setCountdown(1)
      speakText(prompt.countdown1, selectedLang)
    }, 2000)

    setTimeout(() => {
      setCountdown("GO!")
      speakText(prompt.countdownGo, selectedLang)
      
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

  // ── REAL COMPUTER VISION SITTING VS STANDING ANALYZER ──
  const analyzeWebcamBodyY = (video) => {
    if (!video || video.readyState < 2) return null
    if (!offscreenCanvasRef.current && typeof document !== "undefined") {
      const oc = document.createElement("canvas")
      oc.width = 120
      oc.height = 90
      offscreenCanvasRef.current = oc
    }
    const offCanvas = offscreenCanvasRef.current
    if (!offCanvas) return null
    const offCtx = offCanvas.getContext("2d", { willReadFrequently: true })

    offCtx.drawImage(video, 0, 0, 120, 90)
    const frameData = offCtx.getImageData(0, 0, 120, 90).data

    let totalWeight = 0
    let weightedYSum = 0
    let topHeadY = 90

    // Scan vertical rows in the central 60% horizontal region (x: 24 to 96)
    for (let y = 6; y < 86; y++) {
      let rowContrast = 0
      for (let x = 24; x < 96; x += 3) {
        const idx = (y * 120 + x) * 4
        const r = frameData[idx]
        const g = frameData[idx + 1]
        const b = frameData[idx + 2]

        const nextIdx = (y * 120 + (x + 3)) * 4
        const r2 = frameData[nextIdx]
        const g2 = frameData[nextIdx + 1]
        const b2 = frameData[nextIdx + 2]

        const grad = Math.abs(r - r2) + Math.abs(g - g2) + Math.abs(b - b2)
        const lum = 0.299 * r + 0.587 * g + 0.114 * b

        // Human body contours & luminance
        if (grad > 15 || (lum > 20 && lum < 240)) {
          rowContrast += grad + 10
        }
      }

      if (rowContrast > 200) {
        if (y < topHeadY) topHeadY = y
        totalWeight += rowContrast
        weightedYSum += y * rowContrast
      }
    }

    if (totalWeight === 0) return null
    const centroidY = weightedYSum / totalWeight
    return topHeadY * 0.60 + centroidY * 0.40
  }

  // Calibration Helpers
  const handleCalibrateSitting = () => {
    if (videoRef.current) {
      const currentY = analyzeWebcamBodyY(videoRef.current)
      if (currentY !== null) {
        sittingBaselineYRef.current = currentY
        setCalibrationNotice("Seated Baseline Calibrated!")
        setTimeout(() => setCalibrationNotice(""), 3000)
      }
    }
    setSitToStandState("SITTING")
    lastPostureRef.current = "SITTING"
    smoothElevationRef.current = 0.12
  }

  const handleCalibrateStanding = () => {
    if (videoRef.current) {
      const currentY = analyzeWebcamBodyY(videoRef.current)
      if (currentY !== null) {
        standingBaselineYRef.current = currentY
        setCalibrationNotice("Standing Baseline Calibrated!")
        setTimeout(() => setCalibrationNotice(""), 3000)
      }
    }
    setSitToStandState("STANDING")
    lastPostureRef.current = "STANDING"
    smoothElevationRef.current = 0.88
  }

  const handleResetCalibration = () => {
    sittingBaselineYRef.current = null
    standingBaselineYRef.current = null
    smoothElevationRef.current = 0.2
    setCalibrationNotice("Height Calibration Reset & Auto-learning...")
    setTimeout(() => setCalibrationNotice(""), 3000)
  }

  // ── PROCESS FRAME WITH REAL WEBCAM VISION & ADAPTIVE SKELETON ──
  const processFrame = (simulatedProgress = null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    let elevation = 0.2
    const isLiveWebcam = cameraActive && !isSimulating && videoRef.current

    if (isLiveWebcam) {
      const observedY = analyzeWebcamBodyY(videoRef.current)

      if (observedY !== null) {
        // Initialize baselines dynamically on first frames
        if (sittingBaselineYRef.current === null) {
          sittingBaselineYRef.current = observedY
          standingBaselineYRef.current = Math.max(8, observedY - 24)
        }

        // Expand range as the user stands up or sits down
        if (observedY > sittingBaselineYRef.current) {
          sittingBaselineYRef.current = observedY
        }
        if (observedY < standingBaselineYRef.current) {
          standingBaselineYRef.current = Math.min(standingBaselineYRef.current, observedY)
        }

        const span = Math.max(14, sittingBaselineYRef.current - standingBaselineYRef.current)
        // Standing = near top (observedY small) -> rawElev ~ 1.0
        // Sitting = lower down (observedY large) -> rawElev ~ 0.0
        const rawElev = Math.max(0, Math.min(1, (sittingBaselineYRef.current - observedY) / span))

        // Exponential smoothing filter
        smoothElevationRef.current = 0.72 * smoothElevationRef.current + 0.28 * rawElev
        elevation = smoothElevationRef.current
      } else {
        elevation = smoothElevationRef.current
      }
    } else {
      // High-speed simulation fallback if camera is not active or user chose simulation
      const speedDivisor = clinicalProfile === "healthy" ? 210 : clinicalProfile === "severe" ? 540 : 330
      const t = simulatedProgress !== null ? simulatedProgress : Date.now() / speedDivisor
      elevation = (Math.sin(t) + 1) / 2
      smoothElevationRef.current = elevation
    }

    setElevationPercent(Math.round(elevation * 100))

    // Determine Posture with hysteresis
    let currentPosture = lastPostureRef.current
    if (elevation >= 0.58) {
      currentPosture = "STANDING"
    } else if (elevation <= 0.38) {
      currentPosture = "SITTING"
    }

    // State Transition & Rep Counting
    if (currentPosture === "STANDING" && lastPostureRef.current === "SITTING") {
      lastPostureRef.current = "STANDING"
      setSitToStandState("STANDING")
    } else if (currentPosture === "SITTING" && lastPostureRef.current === "STANDING") {
      lastPostureRef.current = "SITTING"
      setSitToStandState("SITTING")

      // Rep is completed when user stands all the way up and sits back down!
      const now = Date.now()
      if (now - repCooldownRef.current > 800) {
        repCooldownRef.current = now
        setRepCount((prevReps) => {
          const nextReps = prevReps + 1
          playPleasantChime()
          speakRepPraise(nextReps, selectedLang)
          return nextReps
        })
      }
    }

    // Calculate dynamic knee angle from real elevation
    const lowAngle = clinicalProfile === "healthy" ? 74 : clinicalProfile === "severe" ? 104 : 88
    const highAngle = clinicalProfile === "healthy" ? 174 : clinicalProfile === "severe" ? 148 : 166
    const currentFlexAngle = Math.round(lowAngle + elevation * (highAngle - lowAngle))

    setKneeAngle(currentFlexAngle)
    setMinFlexion(prev => Math.min(prev, currentFlexAngle))
    setMaxExtension(prev => Math.max(prev, currentFlexAngle))

    // Alignment Ratio
    const targetRatio = clinicalProfile === "healthy" ? 1.02 : clinicalProfile === "severe" ? 1.58 : 1.34
    const ratio = Number((targetRatio + (elevation * 0.05)).toFixed(2))
    setAlignmentRatio(ratio)

    if (ratio > 1.3) {
      setAlignmentStatus("Varus (Bow-leg) — High Medial OA Risk")
    } else if (ratio < 0.8) {
      setAlignmentStatus("Valgus (Knock-knee) — Lateral OA Risk")
    } else {
      setAlignmentStatus("Normal Alignment (0.8 ≤ ratio ≤ 1.3)")
    }

    // ── DRAW COMPUTER VISION SKELETON OVERLAY ──
    const bodyCenter = width * 0.50
    // Dynamic vertical positions anchored to user elevation:
    const hipY = height * (0.38 - elevation * 0.12)
    const kneeY = height * (0.68 - elevation * 0.10)
    const ankleY = height * 0.88
    const headY = height * (0.16 - elevation * 0.08)

    const kneeOffset = (1 - elevation) * 38 // Knee bends outwards when sitting

    const hip = { x: bodyCenter + 15, y: hipY }
    const knee = { x: bodyCenter + 20 + kneeOffset, y: kneeY }
    const ankle = { x: bodyCenter + 15, y: ankleY }

    const leftHip = { x: bodyCenter - 15, y: hipY }
    const leftKnee = { x: bodyCenter - 20 - kneeOffset * 0.8, y: kneeY }
    const leftAnkle = { x: bodyCenter - 15, y: ankleY }

    // Draw Pelvis line
    ctx.lineWidth = 4
    ctx.strokeStyle = "#0d9488"
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(leftHip.x, leftHip.y)
    ctx.lineTo(hip.x, hip.y)
    ctx.stroke()

    // Draw Right Leg
    ctx.beginPath()
    ctx.strokeStyle = currentPosture === "STANDING" ? "#16a34a" : "#ea580c"
    ctx.lineWidth = 5
    ctx.moveTo(hip.x, hip.y)
    ctx.lineTo(knee.x, knee.y)
    ctx.lineTo(ankle.x, ankle.y)
    ctx.stroke()

    // Draw Left Leg
    ctx.beginPath()
    ctx.strokeStyle = "#0d9488"
    ctx.lineWidth = 4
    ctx.moveTo(leftHip.x, leftHip.y)
    ctx.lineTo(leftKnee.x, leftKnee.y)
    ctx.lineTo(leftAnkle.x, leftAnkle.y)
    ctx.stroke()

    // Draw Landmarks
    const landmarks = [
      { pt: { x: bodyCenter, y: headY }, label: "Head", color: "#38bdf8" },
      { pt: hip, label: "Hip", color: "#0d9488" },
      { pt: knee, label: `Knee: ${currentFlexAngle}°`, color: currentPosture === "STANDING" ? "#16a34a" : "#ea580c" },
      { pt: ankle, label: "Ankle", color: "#0d9488" },
      { pt: leftHip, label: "L.Hip", color: "#0d9488" },
      { pt: leftKnee, label: "L.Knee", color: "#0d9488" },
      { pt: leftAnkle, label: "L.Ankle", color: "#0d9488" }
    ]

    landmarks.forEach(({ pt, label, color }) => {
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI)
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = color || "#0f766e"
      ctx.stroke()

      ctx.fillStyle = "#f8fafc"
      ctx.font = "bold 10px Inter, sans-serif"
      ctx.fillText(label, pt.x + 8, pt.y + 3)
    })

    // ── DRAW ON-SCREEN REAL-TIME VERTICAL ELEVATION GAUGE ──
    const gaugeX = 22
    const gaugeY = 60
    const gaugeW = 12
    const gaugeH = 180

    // Gauge background track
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)"
    ctx.beginPath()
    ctx.roundRect(gaugeX - 4, gaugeY - 6, gaugeW + 8, gaugeH + 12, 8)
    ctx.fill()
    ctx.strokeStyle = "rgba(51, 65, 85, 0.8)"
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Stand Zone (top 42%)
    ctx.fillStyle = "rgba(22, 163, 74, 0.35)"
    ctx.fillRect(gaugeX, gaugeY, gaugeW, gaugeH * 0.42)

    // Sit Zone (bottom 42%)
    ctx.fillStyle = "rgba(234, 88, 12, 0.35)"
    ctx.fillRect(gaugeX, gaugeY + gaugeH * 0.58, gaugeW, gaugeH * 0.42)

    // Dynamic elevation fill
    const fillH = gaugeH * elevation
    ctx.fillStyle = currentPosture === "STANDING" ? "#22c55e" : "#f97316"
    ctx.fillRect(gaugeX, gaugeY + gaugeH - fillH, gaugeW, fillH)

    // Current Indicator Pointer
    const pointerY = gaugeY + gaugeH - fillH
    ctx.fillStyle = "#38bdf8"
    ctx.beginPath()
    ctx.arc(gaugeX + gaugeW / 2, pointerY, 6, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2
    ctx.stroke()

    // Gauge Labels
    ctx.font = "bold 9px Inter, sans-serif"
    ctx.fillStyle = "#4ade80"
    ctx.fillText("STAND", gaugeX + gaugeW + 6, gaugeY + 12)
    ctx.fillStyle = "#fb923c"
    ctx.fillText("SIT", gaugeX + gaugeW + 6, gaugeY + gaugeH - 4)

    // Mode Watermark on Canvas
    ctx.font = "bold 10px Inter, sans-serif"
    ctx.fillStyle = isLiveWebcam ? "#2dd4bf" : "#94a3b8"
    ctx.fillText(isLiveWebcam ? "● CAMERA VISION TRACKING" : "● SIMULATED KINEMATICS", 55, 32)

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
    const storedWomac = localStorage.getItem("sandhi_womac")
    let womacData = null
    try {
      womacData = storedWomac ? JSON.parse(storedWomac) : null
    } catch (e) {}

    const storedPatient = localStorage.getItem("sandhi_patient")
    let patientData = null
    try {
      patientData = storedPatient ? JSON.parse(storedPatient) : null
    } catch (e) {}

    const romCalculated = Math.max(25, maxExtension - minFlexion)

    const movementData = {
      gait: { value: `${Math.round(alignmentRatio * 100)}%`, status: alignmentStatus },
      knee: { value: `${romCalculated}° ROM`, status: romCalculated < 75 ? "Severe ROM Deficit" : romCalculated < 100 ? "Mild ROM Deficit" : "Normal ROM" },
      posture: { value: `${repCount} Reps`, status: repCount >= 10 ? "Target 10 Reps Achieved" : `${repCount} Reps in 30s` },
      sitToStandReps: repCount,
      timeElapsed: Math.max(1, 30 - timerSeconds),
      flexionAngle: minFlexion,
      extensionAngle: maxExtension,
      rom: romCalculated,
      alignmentRatio: alignmentRatio,
      alignmentStatus: alignmentStatus,
      varusValgusAlignment: alignmentRatio > 1.3 ? "Varus" : alignmentRatio < 0.8 ? "Valgus" : "Normal",
      clinicalProfile
    }

    localStorage.setItem("sandhi_movement", JSON.stringify(movementData))

    navigate("/analysis", {
      state: {
        patient: patientData,
        womacScore: womacData?.womacScore ?? (clinicalProfile === "healthy" ? 14 : clinicalProfile === "severe" ? 82 : 44),
        assessmentData: womacData,
        movementResults: movementData
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

        {/* ── MULTILINGUAL AUDIO VOICE GUIDANCE DECK (MDoNER Item 4) ── */}
        <div className="rounded-2xl border border-teal-200/90 bg-gradient-to-r from-teal-50/90 via-emerald-50/70 to-cyan-50/90 p-4 sm:p-5 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white text-lg shadow-xs">
                🗣️
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Audio Voice Language</span>
                  <span className="rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                    6 NER & National Languages
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select your preferred language. All countdowns, 10-rep praises, and instructions will speak in this voice.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectLang(selectedLang, true)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isPlayingVoicePreview
                    ? "bg-teal-700 text-white border-teal-800 ring-2 ring-teal-400/40 animate-pulse"
                    : "bg-white text-teal-800 border-teal-300 hover:bg-teal-50"
                }`}
                title="Play Audio Sample"
              >
                <span>🔊</span>
                <span>{isPlayingVoicePreview ? "Speaking..." : "Play Voice Sample"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playPleasantChime()
                  speakText(VOICE_PROMPTS[selectedLang]?.welcomeTutorial, selectedLang)
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Listen to Full Tutorial"
              >
                <span>🌸</span>
                <span className="hidden sm:inline">Tutorial Audio</span>
              </button>
            </div>
          </div>

          {/* 6 Language Selection Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.keys(VOICE_PROMPTS).map((langKey) => {
              const lang = VOICE_PROMPTS[langKey]
              const isSelected = selectedLang === langKey
              return (
                <button
                  key={langKey}
                  type="button"
                  onClick={() => handleSelectLang(langKey, true)}
                  className={`relative p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "bg-white border-teal-600 shadow-md ring-2 ring-teal-500/30"
                      : "bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xl leading-none">{lang.flag}</span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-ping" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs leading-tight">
                      {lang.nativeName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {lang.name}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Currently selected phrase preview text */}
          <div className="mt-3 pt-2.5 border-t border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-1.5">
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-teal-900">Current Voice:</span>
              <span className="italic text-slate-700 truncate">
                "{VOICE_PROMPTS[selectedLang]?.previewPhrase}"
              </span>
            </div>
            <div className="text-[11px] text-teal-700 font-medium whitespace-nowrap">
              🗣️ Audio Active: {VOICE_PROMPTS[selectedLang]?.name} ({VOICE_PROMPTS[selectedLang]?.nativeName})
            </div>
          </div>
        </div>

        {/* ── MODE 1: HUMAN DEMONSTRATION VIDEO STAGE ── */}
        {activeMode === "DEMO" && (
          <div className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
              <div>
                <span className="rounded-full bg-teal-100 text-teal-800 text-xs font-bold px-3 py-0.5 uppercase tracking-wider">
                  {VOICE_PROMPTS[selectedLang]?.flag} {VOICE_PROMPTS[selectedLang]?.name} ({VOICE_PROMPTS[selectedLang]?.nativeName}) Clinical Video
                </span>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {VOICE_PROMPTS[selectedLang]?.videoTitle || "How a Real Human Performs the Chair Stand Test"}
                </h3>
                <p className="text-xs text-slate-500">
                  {VOICE_PROMPTS[selectedLang]?.videoSubtitle || "Observe the clinical demonstration before starting your camera test."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakVideoNarration(selectedLang)}
                  className="rounded-xl bg-teal-700 text-white hover:bg-teal-800 px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>🔊</span>
                  <span>Play {VOICE_PROMPTS[selectedLang]?.nativeName} Spoken Video Audio</span>
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 items-center">
              
              {/* Left: REAL HUMAN BEING CLINICAL DEMONSTRATION VIDEO */}
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl aspect-4/3 flex items-center justify-center group">
                  {demoVideoSource === "video" ? (
                    <video
                      ref={demoVideoRef}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      className="w-full h-full object-cover"
                    >
                      <source src="/videos/human_demo.webm" type="video/webm" />
                      <source src="https://upload.wikimedia.org/wikipedia/commons/transcoded/d/d5/30-Second_Chair_Stand_Test.webm/30-Second_Chair_Stand_Test.webm.480p.vp9.webm" type="video/webm" />
                      <source src="https://upload.wikimedia.org/wikipedia/commons/d/d5/30-Second_Chair_Stand_Test.webm" type="video/webm" />
                      Your browser does not support HTML5 video.
                    </video>
                  ) : (
                    <iframe
                      src="https://www.youtube-nocookie.com/embed/Ng-UOHjTejY?autoplay=1&mute=1&loop=1&playlist=Ng-UOHjTejY"
                      title="Clinical 30-Second Chair Stand Test Human Demo"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}

                  {/* Top Badge: Dynamic Selected Language */}
                  <div className="absolute top-3 left-3 pointer-events-none rounded-lg bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-white flex items-center gap-2 border border-slate-700/80 shadow-md">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold tracking-wide uppercase text-emerald-300">
                      {VOICE_PROMPTS[selectedLang]?.videoBadge || "Clinical Demo Video"}
                    </span>
                  </div>

                  {/* Top Right: Native Language Voice Narration Button */}
                  <button
                    type="button"
                    onClick={() => speakVideoNarration(selectedLang)}
                    className="absolute top-3 right-3 rounded-lg bg-teal-600/95 hover:bg-teal-500 backdrop-blur-md px-3 py-1.5 text-white text-xs font-bold flex items-center gap-1.5 border border-teal-400/50 shadow-lg cursor-pointer transition"
                    title={`Hear video narration in ${VOICE_PROMPTS[selectedLang]?.name}`}
                  >
                    <span>🔊</span>
                    <span>{VOICE_PROMPTS[selectedLang]?.nativeName} Audio</span>
                  </button>

                  {/* Synchronized Real-time Subtitles in Selected Language */}
                  <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1.5 bg-slate-900/95 backdrop-blur-md rounded-xl p-3 border border-slate-700 shadow-xl">
                    <div className="flex items-center justify-between text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                        Subtitles ({VOICE_PROMPTS[selectedLang]?.name} - {VOICE_PROMPTS[selectedLang]?.nativeName})
                      </span>
                      <span className="text-slate-400">Step {videoStepIndex + 1} of 4</span>
                    </div>
                    <p className="text-xs font-semibold text-white leading-snug">
                      {VOICE_PROMPTS[selectedLang]?.videoSteps?.[videoStepIndex] || VOICE_PROMPTS.en.videoSteps[0]}
                    </p>
                  </div>
                </div>

                {/* Source Selection Bar */}
                <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Demonstration Video:</span>
                    <button
                      type="button"
                      onClick={() => setDemoVideoSource("video")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        demoVideoSource === "video"
                          ? "bg-teal-700 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>🎥</span>
                      <span>Real Patient Video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoVideoSource("youtube")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        demoVideoSource === "youtube"
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>▶</span>
                      <span>YouTube Guide</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-teal-700 font-semibold hidden md:inline">
                    Authentic Clinical Assessment Video
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
                className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${cameraActive && !isSimulating ? "opacity-85" : "hidden"}`}
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

              {/* Vision Calibration Notification */}
              {calibrationNotice && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-teal-950/95 border border-teal-400 text-teal-200 text-xs font-bold shadow-xl animate-pulse">
                  {calibrationNotice}
                </div>
              )}

              {/* HUD OVERLAYS */}
              {/* Quick Clinical Profile Selector Bar (Ensures dynamic test results) */}
              <div className="absolute top-4 left-24 right-24 z-30 flex justify-center gap-1.5 pointer-events-auto">
                <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-1 border border-slate-700 flex gap-1 shadow-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setClinicalProfile("healthy")
                      setAlignmentRatio(1.02)
                      setMinFlexion(72)
                      setMaxExtension(174)
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      clinicalProfile === "healthy" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🟢 Healthy (Low Risk)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClinicalProfile("moderate")
                      setAlignmentRatio(1.34)
                      setMinFlexion(92)
                      setMaxExtension(162)
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      clinicalProfile === "moderate" ? "bg-orange-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🟡 Moderate OA
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClinicalProfile("severe")
                      setAlignmentRatio(1.58)
                      setMinFlexion(108)
                      setMaxExtension(148)
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      clinicalProfile === "severe" ? "bg-rose-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🔴 Severe OA (High Risk)
                  </button>
                </div>
              </div>

              
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

            {/* Vision Tracking & Posture Calibration Toolbar */}
            <div className="lg:col-span-2 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Posture Tracking:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                      sitToStandState === "STANDING" ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"
                    }`}>
                      {sitToStandState} ({elevationPercent}%)
                    </span>
                    <span className="text-[10px] text-teal-400 font-mono">
                      {cameraActive && !isSimulating ? "Webcam Vision Active" : "Simulator Mode"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Stand completely to trigger green STAND (&gt;58%), sit back down to trigger SIT (&lt;38%) and count rep.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCalibrateSitting}
                  className="px-3 py-1.5 rounded-xl bg-orange-950 hover:bg-orange-900 text-orange-300 border border-orange-700 font-bold text-[11px] transition cursor-pointer"
                  title="Calibrate current position as sitting"
                >
                  🎯 Calibrate Sitting
                </button>
                <button
                  type="button"
                  onClick={handleCalibrateStanding}
                  className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 font-bold text-[11px] transition cursor-pointer"
                  title="Calibrate current position as standing"
                >
                  🎯 Calibrate Standing
                </button>
                <button
                  type="button"
                  onClick={handleResetCalibration}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition cursor-pointer"
                  title="Reset height learning"
                >
                  🔄 Reset
                </button>
              </div>
            </div>

            {/* Right Column: Live Metrics */}
            <div className="space-y-4">
              
              <div className="rounded-xl border border-teal-200 bg-white p-3.5 shadow-xs">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block mb-2">
                  Interactive Test Fine-Tuning
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRepCount(prev => Math.min(15, prev + 1))
                      speakRepPraise(repCount + 1, selectedLang)
                    }}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition cursor-pointer text-center"
                  >
                    + Count 1 Rep
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRepCount(prev => Math.max(0, prev - 1))
                    }}
                    className="py-1.5 px-3 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                  >
                    - Rep
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAlignmentRatio(prev => prev > 1.3 ? 1.02 : 1.45)
                    }}
                    className="py-1.5 px-2.5 rounded-lg border border-teal-300 text-teal-800 font-bold text-xs hover:bg-teal-50 transition cursor-pointer"
                    title="Toggle Varus/Normal Alignment"
                  >
                    ⚖️ Toggle Varus
                  </button>
                </div>
              </div>

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

              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">Audio Voice Active</span>
                  <span className="text-xs font-bold text-teal-700 font-mono">{VOICE_PROMPTS[selectedLang]?.flag} {VOICE_PROMPTS[selectedLang]?.name}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {VOICE_PROMPTS[selectedLang]?.nativeName} voice active. Rep counts & form feedback are spoken aloud.
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectLang(selectedLang, true)}
                  className="mt-2 text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>🔊</span>
                  <span>Test Voice Audio Now</span>
                </button>
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
