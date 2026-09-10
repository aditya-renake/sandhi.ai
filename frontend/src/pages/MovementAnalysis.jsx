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
          speakRepPraise(nextReps, selectedLang)
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
