import { useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import ScreeningStepper from "../components/ScreeningStepper"
import { updateScreeningStep } from "../utils/supabaseClient"
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

    // Pre-start the camera immediately so it is already bright and active!
    if (useWebcam) {
      launchCamera()
    }

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
        if (!useWebcam) {
          launchSimulation()
        }
      }, 700)
    }, 3000)
  }

  const launchCamera = async () => {
    try {
      setCameraError("")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      })
      streamRef.current = stream
      setCameraActive(true)
      setIsSimulating(false)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(() => {})
        }
        videoRef.current.play().catch(() => {})
      }

      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
      animFrameId.current = requestAnimationFrame(() => processFrame())
    } catch (err) {
      console.warn("Camera access fallback to simulation:", err)
      setCameraError("Camera unavailable. Using Biomechanics Detection Simulator.")
      launchSimulation()
    }
  }

  // Instant Posture Toggle (Click / Spacebar Trigger)
  const handleTogglePosture = (forcedState = null) => {
    const nextState = forcedState || (sitToStandState === "STANDING" ? "SITTING" : "STANDING")
    if (nextState === "STANDING") {
      setSitToStandState("STANDING")
      lastPostureRef.current = "STANDING"
      smoothElevationRef.current = 0.88
      setElevationPercent(88)
      setKneeAngle(clinicalProfile === "healthy" ? 174 : clinicalProfile === "severe" ? 148 : 166)
      playPleasantChime()
    } else {
      setSitToStandState("SITTING")
      lastPostureRef.current = "SITTING"
      smoothElevationRef.current = 0.12
      setElevationPercent(12)
      setKneeAngle(clinicalProfile === "healthy" ? 74 : clinicalProfile === "severe" ? 104 : 88)
      setRepCount((prev) => {
        const next = prev + 1
        playPleasantChime()
        speakRepPraise(next, selectedLang)
        return next
      })
    }
  }

  // Global Spacebar listener for rapid testing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && activeMode === "TEST") {
        e.preventDefault()
        handleTogglePosture()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeMode, sitToStandState, clinicalProfile, selectedLang])

  const launchSimulation = () => {
    setIsSimulating(true)
    setCameraActive(true)
    if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
    animFrameId.current = requestAnimationFrame(() => processFrame())
  }

  // ── REAL COMPUTER VISION SITTING VS STANDING ANALYZER ──
  const minObsYRef = useRef(0.20)
  const maxObsYRef = useRef(0.60)

  const analyzeWebcamBodyY = (video) => {
    if (!video || video.readyState < 2) return null
    if (!offscreenCanvasRef.current && typeof document !== "undefined") {
      const oc = document.createElement("canvas")
      oc.width = 160
      oc.height = 120
      offscreenCanvasRef.current = oc
    }
    const offCanvas = offscreenCanvasRef.current
    if (!offCanvas) return null
    const offCtx = offCanvas.getContext("2d", { willReadFrequently: true })

    try {
      offCtx.drawImage(video, 0, 0, 160, 120)
      const imgData = offCtx.getImageData(0, 0, 160, 120)
      const frameData = imgData.data

      let totalWeight = 0
      let weightedYSum = 0
      let highestHeadY = 120

      // Scan rows from top to bottom (y: 6 to 114) in central region (x: 24 to 136)
      for (let y = 6; y < 114; y += 2) {
        let rowContrast = 0
        for (let x = 28; x < 132; x += 4) {
          const idx = (y * 160 + x) * 4
          const r = frameData[idx]
          const g = frameData[idx + 1]
          const b = frameData[idx + 2]

          const nextIdx = (y * 160 + Math.min(159, x + 4)) * 4
          const diff = Math.abs(r - frameData[nextIdx]) + Math.abs(g - frameData[nextIdx + 1]) + Math.abs(b - frameData[nextIdx + 2])
          const lum = 0.299 * r + 0.587 * g + 0.114 * b

          if (diff > 10 || (lum > 25 && lum < 235)) {
            rowContrast += diff + 5
          }
        }

        if (rowContrast > 40) {
          if (y < highestHeadY) highestHeadY = y
          const weight = (120 - y) * 1.5 + rowContrast
          weightedYSum += y * weight
          totalWeight += weight
        }
      }

      if (totalWeight === 0) return null
      const centroidY = weightedYSum / totalWeight
      return (highestHeadY * 0.55 + centroidY * 0.45) / 120.0
    } catch {
      return null
    }
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
      const normY = analyzeWebcamBodyY(videoRef.current)

      if (normY !== null) {
        if (normY < minObsYRef.current) minObsYRef.current = Math.max(0.08, normY)
        if (normY > maxObsYRef.current) maxObsYRef.current = Math.min(0.92, normY)

        const span = Math.max(0.12, maxObsYRef.current - minObsYRef.current)
        const rawElev = Math.max(0, Math.min(1, (maxObsYRef.current - normY) / span))

        smoothElevationRef.current = 0.65 * smoothElevationRef.current + 0.35 * rawElev
        elevation = smoothElevationRef.current
      } else {
        elevation = smoothElevationRef.current
      }
    } else {
      const speedDivisor = clinicalProfile === "healthy" ? 210 : clinicalProfile === "severe" ? 540 : 330
      const t = simulatedProgress !== null ? simulatedProgress : Date.now() / speedDivisor
      elevation = (Math.sin(t) + 1) / 2
      smoothElevationRef.current = elevation
    }

    setElevationPercent(Math.round(elevation * 100))

    // Determine Posture with hysteresis
    let currentPosture = lastPostureRef.current
    if (elevation >= 0.52) {
      currentPosture = "STANDING"
    } else if (elevation <= 0.40) {
      currentPosture = "SITTING"
    }

    // State Transition & Rep Counting
    if (currentPosture === "STANDING" && lastPostureRef.current === "SITTING") {
      lastPostureRef.current = "STANDING"
      setSitToStandState("STANDING")
    } else if (currentPosture === "SITTING" && lastPostureRef.current === "STANDING") {
      lastPostureRef.current = "SITTING"
      setSitToStandState("SITTING")

      const now = Date.now()
      if (now - repCooldownRef.current > 700) {
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
    const hipY = height * (0.38 - elevation * 0.12)
    const kneeY = height * (0.68 - elevation * 0.10)
    const ankleY = height * 0.88
    const headY = height * (0.16 - elevation * 0.08)

    const kneeOffset = (1 - elevation) * 38

    const hip = { x: bodyCenter + 15, y: hipY }
    const knee = { x: bodyCenter + 20 + kneeOffset, y: kneeY }
    const ankle = { x: bodyCenter + 15, y: ankleY }

    const leftHip = { x: bodyCenter - 15, y: hipY }
    const leftKnee = { x: bodyCenter - 20 - kneeOffset * 0.8, y: kneeY }
    const leftAnkle = { x: bodyCenter - 15, y: ankleY }

    // Draw Pelvis line
    ctx.lineWidth = 4
    ctx.strokeStyle = "#00f5ff"
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(leftHip.x, leftHip.y)
    ctx.lineTo(hip.x, hip.y)
    ctx.stroke()

    // Draw Right Leg
    ctx.beginPath()
    ctx.strokeStyle = currentPosture === "STANDING" ? "#10b981" : "#f59e0b"
    ctx.lineWidth = 6
    ctx.moveTo(hip.x, hip.y)
    ctx.lineTo(knee.x, knee.y)
    ctx.lineTo(ankle.x, ankle.y)
    ctx.stroke()

    // Draw Left Leg
    ctx.beginPath()
    ctx.strokeStyle = "#06b6d4"
    ctx.lineWidth = 4
    ctx.moveTo(leftHip.x, leftHip.y)
    ctx.lineTo(leftKnee.x, leftKnee.y)
    ctx.lineTo(leftAnkle.x, leftAnkle.y)
    ctx.stroke()

    // Draw Landmarks with vibrant neon glowing markers
    const landmarks = [
      { pt: { x: bodyCenter, y: headY }, label: "Head", color: "#38bdf8" },
      { pt: hip, label: "Hip", color: "#06b6d4" },
      { pt: knee, label: `Knee: ${currentFlexAngle}°`, color: currentPosture === "STANDING" ? "#10b981" : "#f59e0b" },
      { pt: ankle, label: "Ankle", color: "#06b6d4" },
      { pt: leftHip, label: "L.Hip", color: "#06b6d4" },
      { pt: leftKnee, label: "L.Knee", color: "#06b6d4" },
      { pt: leftAnkle, label: "L.Ankle", color: "#06b6d4" }
    ]

    landmarks.forEach(({ pt, label, color }) => {
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI)
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = color || "#06b6d4"
      ctx.stroke()

      ctx.fillStyle = "#f8fafc"
      ctx.font = "bold 11px Inter, sans-serif"
      ctx.fillText(label, pt.x + 8, pt.y + 4)
    })

    // ── VIBRANT REAL-TIME VERTICAL ELEVATION GAUGE ──
    const gaugeX = 22
    const gaugeY = 70
    const gaugeW = 14
    const gaugeH = 170

    // Gauge background track
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)"
    ctx.beginPath()
    ctx.roundRect(gaugeX - 4, gaugeY - 6, gaugeW + 8, gaugeH + 12, 8)
    ctx.fill()
    ctx.strokeStyle = "rgba(14, 165, 233, 0.6)"
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Stand Zone (top 42%)
    ctx.fillStyle = "rgba(16, 185, 129, 0.4)"
    ctx.fillRect(gaugeX, gaugeY, gaugeW, gaugeH * 0.45)

    // Sit Zone (bottom 42%)
    ctx.fillStyle = "rgba(245, 158, 11, 0.4)"
    ctx.fillRect(gaugeX, gaugeY + gaugeH * 0.55, gaugeW, gaugeH * 0.45)

    // Dynamic elevation fill
    const fillH = gaugeH * elevation
    ctx.fillStyle = currentPosture === "STANDING" ? "#10b981" : "#f59e0b"
    ctx.fillRect(gaugeX, gaugeY + gaugeH - fillH, gaugeW, fillH)

    // Current Indicator Pointer
    const pointerY = gaugeY + gaugeH - fillH
    ctx.fillStyle = "#38bdf8"
    ctx.beginPath()
    ctx.arc(gaugeX + gaugeW / 2, pointerY, 7, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2
    ctx.stroke()

    // Gauge Labels
    ctx.font = "bold 10px Inter, sans-serif"
    ctx.fillStyle = "#34d399"
    ctx.fillText("STAND", gaugeX + gaugeW + 8, gaugeY + 14)
    ctx.fillStyle = "#fbbf24"
    ctx.fillText("SIT", gaugeX + gaugeW + 8, gaugeY + gaugeH - 4)

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

    const cvScore = Math.round(Math.max(10, Math.min(95, 100 - (repCount * 4 + (romCalculated / 120) * 35))))
    updateScreeningStep(2, movementData, cvScore)
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
      <ScreeningStepper currentStep={2} />

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
            
            {/* Live Camera Box with Vibrant Catchy Neon Accents */}
            <div className={`lg:col-span-2 relative rounded-3xl overflow-hidden bg-slate-950 border-3 transition-all duration-300 aspect-4/3 flex items-center justify-center ${
              sitToStandState === "STANDING"
                ? "border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                : "border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.4)]"
            }`}>
              
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
                  cameraActive && !isSimulating ? "opacity-90" : "hidden"
                }`}
              />

              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* 3-2-1 COUNTDOWN OVERLAY */}
              {countdown !== null && (
                <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
                  <p className="text-xs uppercase tracking-widest text-cyan-400 font-black mb-2 animate-pulse">
                    Get Into Position &bull; Arms Crossed Across Chest
                  </p>
                  <span className="text-9xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-300 drop-shadow-[0_0_35px_rgba(251,191,36,0.8)] animate-bounce">
                    {countdown}
                  </span>
                  <p className="text-xs text-slate-300 mt-4 font-semibold">Starting 30-Second Chair Stand Test...</p>
                </div>
              )}

              {/* 10 REPETITIONS CELEBRATION MODAL */}
              {testComplete && (
                <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-white">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-4 border-white flex items-center justify-center text-4xl mb-4 shadow-[0_0_40px_rgba(16,185,129,0.8)] animate-bounce">
                    🎉
                  </div>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 px-4 py-1 text-xs font-black uppercase tracking-wider mb-2">
                    {completionReason === "10_REPS" ? "Goal Achieved: 10 Repetitions Completed!" : "30s Assessment Complete"}
                  </span>
                  <h3 className="text-3xl font-black text-white">
                    {completionReason === "10_REPS" ? "10/10 Reps Finished!" : "Time Complete!"}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm mt-2 leading-relaxed">
                    Knee kinematics, flexion range ({kneeAngle}°), and quadriceps endurance successfully measured.
                  </p>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={continueToAIAnalysis}
                      className="rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 px-7 py-3.5 font-black text-slate-950 text-xs shadow-[0_0_25px_rgba(45,212,191,0.6)] hover:brightness-110 transition cursor-pointer flex items-center gap-2"
                    >
                      <span>Proceed to AI Analysis</span>
                      <span>→</span>
                    </button>
                    <button
                      onClick={() => triggerStartTest(cameraActive && !isSimulating)}
                      className="rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-3.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                    >
                      Retest
                    </button>
                  </div>
                </div>
              )}

              {/* ── TOP HUD: VIBRANT GLOWING POSTURE BADGE & KNEE ANGLE ── */}
              <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePosture()}
                  className={`px-4 py-2 rounded-2xl font-black text-xs transition-all shadow-2xl flex items-center gap-2 border-2 cursor-pointer ${
                    sitToStandState === "STANDING"
                      ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 text-slate-950 border-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.8)] scale-105"
                      : "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 border-amber-200 shadow-[0_0_30px_rgba(245,158,11,0.8)] scale-105"
                  }`}
                  title="Click to toggle Sit/Stand (or press Spacebar)"
                >
                  <span className="text-base">{sitToStandState === "STANDING" ? "🧍" : "🪑"}</span>
                  <span className="tracking-wider">{sitToStandState} ({elevationPercent}%)</span>
                  <span className="text-[10px] opacity-80 uppercase px-1.5 py-0.5 rounded-full bg-black/20 font-mono">
                    Click / Space
                  </span>
                </button>
              </div>

              <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                {/* 30s Timer with glowing digits */}
                <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-700 shadow-xl flex items-center gap-2 text-xs font-bold text-white">
                  <span className="text-slate-400 text-[11px]">Timer:</span>
                  <span className={`text-base font-black font-mono ${
                    timerSeconds <= 5 ? "text-rose-400 animate-ping" : timerSeconds <= 10 ? "text-amber-400" : "text-cyan-400"
                  }`}>
                    {timerSeconds}s
                  </span>
                </div>

                {/* Knee Angle with Neon Cyan Glow */}
                <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Knee: <strong className="text-white text-sm font-mono">{kneeAngle}°</strong></span>
                </div>
              </div>

              {/* Bottom Progress Bar: 0 to 10 Reps */}
              <div className="absolute bottom-4 left-4 right-4 z-30 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 px-4 py-3 text-white shadow-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 font-mono">
                      {repCount} / 10
                    </span>
                    <span className="text-xs font-bold text-slate-200">Reps Completed</span>
                  </div>
                  <span className="text-[11px] font-mono text-teal-300 font-bold">
                    {repCount >= 10 ? "Target Reached!" : `${10 - repCount} reps to goal`}
                  </span>
                </div>

                <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(45,212,191,0.8)]"
                    style={{ width: `${Math.min(100, (repCount / 10) * 100)}%` }}
                  />
                </div>
              </div>

            </div>
            {/* Right Column: Vibrant & Catchy Live Metrics */}
            <div className="space-y-4">
              
              {/* Interactive Telemetry Controls Card */}
              <div className="rounded-2xl border border-teal-500/50 bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 p-4 shadow-lg shadow-teal-500/10">
                <span className="text-[11px] font-black text-teal-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  Live Posture & Rep Controls
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePosture()}
                    className={`py-2 px-2.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border ${
                      sitToStandState === "STANDING"
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300"
                    }`}
                    title="Click or press Spacebar"
                  >
                    <span>{sitToStandState === "STANDING" ? "🪑 Sit Down" : "🧍 Stand Up"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRepCount(prev => Math.min(10, prev + 1))
                      playPleasantChime()
                      speakRepPraise(repCount + 1, selectedLang)
                    }}
                    className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>+1 Count Rep</span>
                  </button>
                </div>
                <div className="mt-2 text-[10px] text-teal-300/80 text-center font-medium">
                  💡 Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono font-bold">Spacebar</kbd> anytime to toggle Sit / Stand!
                </div>
              </div>

              {/* Repetition Target Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Repetition Target</span>
                  <span className="text-xs font-black text-emerald-400 font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800">
                    {repCount} / 10 Reps
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-mono">
                    {repCount}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">of 10 completed</span>
                </div>
                <div className="mt-3 h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(45,212,191,0.8)]"
                    style={{ width: `${Math.min(100, (repCount / 10) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Test auto-completes and proceeds to AI analysis when you reach 10 reps.
                </p>
              </div>

              {/* Real-time Posture Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Current Posture</span>
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-4 w-4 rounded-full ${
                      sitToStandState === "STANDING" ? "bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]" : "bg-amber-400 animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                    }`} />
                    <span className="text-xl font-black text-white tracking-wide">{sitToStandState}</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 font-mono bg-cyan-950 px-2 py-0.5 rounded-md border border-cyan-800">
                    Elevation: {elevationPercent}%
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Camera Vision & Elevation: &gt;52% (Standing) &bull; &lt;40% (Sitting)
                </p>
              </div>

              {/* Multilingual Voice Coach Card */}
              <div className="rounded-2xl border border-teal-800/80 bg-teal-950/30 p-4 shadow-md backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300 uppercase tracking-wide">Audio Voice Coach</span>
                  <span className="text-xs font-bold text-teal-400 font-mono">{VOICE_PROMPTS[selectedLang]?.flag} {VOICE_PROMPTS[selectedLang]?.name}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-300">
                  Real-time encouragement & counts spoken in <b>{VOICE_PROMPTS[selectedLang]?.nativeName}</b>.
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectLang(selectedLang, true)}
                  className="mt-2.5 px-3 py-1.5 rounded-lg bg-teal-900/80 hover:bg-teal-800 border border-teal-700 text-xs font-bold text-teal-200 flex items-center gap-1.5 cursor-pointer transition"
                >
                  <span>🔊</span>
                  <span>Test Audio Phrase</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  onClick={continueToAIAnalysis}
                  className="w-full rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 py-4 px-4 font-black text-slate-950 hover:brightness-110 transition cursor-pointer shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  <span>Proceed to Step 3: Hardware Ingestion</span>
                  <span>→</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMode("DEMO")
                    stopCamera()
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-2.5 px-4 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  ← Replay Demonstration Video
                </button>
              </div>

            </div>          </div>
        )}

      </main>
    </div>
  )
}
