// High-Quality, Natural & Soothing Audio Guidance for Sandhi-AI
// Uses premium human-like voice filtering, voice loading listeners, and gentle chime cues.

let cachedVoices = []

// Pre-load voices on browser ready
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  cachedVoices = window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices()
  }
}

export const VOICE_PROMPTS = {
  en: {
    name: "English (Sweet Natural)",
    flag: "🇬🇧",
    langCode: "en-US",
    welcomeTutorial: "Welcome to your knee health check. Let's make this very easy for you. Sit comfortably on your chair with arms gently crossed. Whenever you are ready, press Start Test Now and we will do it together.",
    countdown3: "Three",
    countdown2: "Two",
    countdown1: "One",
    countdownGo: "Begin! Stand up tall, and sit down gently. You are doing so well!",
    sitToStandStart: "Let's begin! Stand up tall, then sit down comfortably. You are doing wonderful!",
    repPraise: [
      "Good! That is one.",
      "Very nice posture, that is two.",
      "Wonderful! That is three.",
      "You are doing so well, that is four.",
      "Halfway there, that is five.",
      "Keep it up, that is six.",
      "Great balance, that is seven.",
      "Almost done, that is eight.",
      "Just one more, that is nine!",
      "Superb! All ten completed!"
    ],
    tenRepsFinished: "Congratulations! You have completed all 10 repetitions with wonderful form. Taking you to the results now.",
    testFinished: "Wonderful effort! You did fantastic today. Take a gentle breath and relax while we prepare your joint report.",
    varusWarning: "Please keep your feet a little wider apart to protect your knees.",
    crepitusNotice: "Listening gently to your knee joint acoustic vibrations now.",
    riskModerate: "All done! Your knees showed good effort. We have prepared a friendly care plan for you."
  },
  hi: {
    name: "हिन्दी (मधुर आवाज़)",
    flag: "🇮🇳",
    langCode: "hi-IN",
    welcomeTutorial: "नमस्ते! आपका स्वागत है। कुर्सी पर आराम से बैठें, हाथ सीने पर रखें। जब आप तैयार हों, 'Start Test Now' दबाएं।",
    countdown3: "तीन",
    countdown2: "दो",
    countdown1: "एक",
    countdownGo: "शुरू करें! आराम से खड़े हों और बैठें। बहुत बढ़िया!",
    sitToStandStart: "शुरू करें! आराम से खड़े हों, फिर बैठें।",
    repPraise: [
      "बहुत बढ़िया, एक हुआ।",
      "सुंदर, दो हो गए।",
      "शाबाश, तीसरा पूरा हुआ।",
      "बहुत अच्छा, चार हो गए।",
      "आप बहुत मजबूत हैं, पांच पूरे!",
      "अद्भुत, छह हो गए।",
      "बहुत सुंदर संतुलन, सात!",
      "आठ हो गए!",
      "बस एक और, नौ हो गए!",
      "बधाई! दस पूरे हो गए!"
    ],
    tenRepsFinished: "बधाई हो! आपने सभी 10 पुनरावृत्तियां बहुत सुंदर तरीके से पूरी कर ली हैं।",
    testFinished: "बहुत-बहुत बधाई! आपने बहुत सुंदर तरीके से यह जांच पूरी की।",
    varusWarning: "कृपया अपने पैरों को थोड़ा सा फैलाकर रखें।",
    crepitusNotice: "हम आपके घुटने की स्वाभाविक ध्वनि सुन रहे हैं।",
    riskModerate: "जांच पूरी हुई।"
  },
  as: {
    name: "অসমীয়া",
    flag: "🇮🇳",
    langCode: "as-IN",
    welcomeTutorial: "নমস্কাৰ! আপোনাক আদৰণি জনাইছোঁ। চকীখনত আৰামেৰে বহক, হাত দুখন বুকুত ৰাখক। সাজু হ'লে পৰীক্ষা আৰম্ভ কৰক।",
    countdown3: "তিনি",
    countdown2: "দুই",
    countdown1: "এক",
    countdownGo: "আৰম্ভ কৰক! থিয় হওক আৰু আৰামেৰে বহক।",
    sitToStandStart: "আহক আৰম্ভ কৰোঁ! থিয় হওক আৰু আৰামেৰে বহক।",
    repPraise: [
      "বৰ ধুনীয়া, এক হ'ল।",
      "বৰ ভাল হৈছে, দুই হ'ল।",
      "উত্তম প্ৰয়াস, তিনি হ'ল।",
      "চাৰি হ'ল!",
      "পাঁচ হ'ল!",
      "ছয় হ'ল!",
      "সাত হ'ল!",
      "আঠ হ'ল!",
      "ন হ'ল!",
      "অভিনন্দন! দহোটা সম্পূৰ্ণ হ'ল!"
    ],
    tenRepsFinished: "অভিনন্দন! আপুনি দহোটা গণনা সফলতাৰে সম্পূৰ্ণ কৰিলে।",
    testFinished: "বৰ আনন্দিত হ'লোঁ! আপুনি বৰ সুন্দৰকৈ পৰীক্ষাটো সম্পূৰ্ণ কৰিলে।",
    varusWarning: "ভৰি দুখন অলপ ফাঁক কৰি ৰাখক।",
    crepitusNotice: "আঁঠুৰ স্বাভাৱিক শব্দ পৰীক্ষা কৰা হৈছে।",
    riskModerate: "পৰীক্ষা সম্পূৰ্ণ হ'ল।"
  },
  bn: {
    name: "বাংলা",
    flag: "🇮🇳",
    langCode: "bn-IN",
    welcomeTutorial: "নমস্কার! এই সহজ হাঁটু পরীক্ষাটিতে আপনাকে স্বাগতম। হাত দুটো বুকে রাখুন এবং প্রস্তুত হলে টেস্ট শুরু করুন।",
    countdown3: "তিন",
    countdown2: "দুই",
    countdown1: "এক",
    countdownGo: "শুরু করুন! সোজা হয়ে দাঁড়ান, আবার বসুন।",
    sitToStandStart: "আসুন শুরু করি! সোজা হয়ে দাঁড়ান, আবার বসুন।",
    repPraise: [
      "দারুণ, এক হলো।",
      "খুব ভালো, দুই হলো।",
      "চমৎকার, তিন হলো।",
      "চার হলো!",
      "পাঁচ হলো!",
      "ছয় হলো!",
      "সাত হলো!",
      "আট হলো!",
      "নয় হলো!",
      "অভিনন্দন! দশটি সম্পন্ন হয়েছে!"
    ],
    tenRepsFinished: "অভিনন্দন! আপনি সফলভাবে ১০টি সম্পন্ন করেছেন।",
    testFinished: "অসংখ্য ধন্যবাদ! আপনি অত্যন্ত সুন্দরভাবে পরীক্ষাটি সম্পন্ন করেছেন।",
    varusWarning: "পা দুটো একটু ফাঁক করে রাখুন।",
    crepitusNotice: "হাঁটুর জয়েন্টের শব্দ পরীক্ষা করা হচ্ছে।",
    riskModerate: "পরীক্ষা সম্পন্ন।"
  }
}

// Gentle pleasant musical chime using Web Audio API
export function playPleasantChime() {
  if (typeof window === "undefined") return
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    // Play a gentle two-tone harmonic bell (E5 -> G#5)
    const notes = [659.25, 830.61]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const startTime = ctx.currentTime + idx * 0.12
      
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, startTime)
      
      gain.gain.setValueAtTime(0.08, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start(startTime)
      osc.stop(startTime + 0.45)
    })
  } catch (e) {
    // Ignore audio context autoplay restrictions
  }
}

// Find the sweetest, most natural, human-grade voice installed on the user's OS/browser
export function getBestVoice(targetLang = "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null

  let voices = cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices()
  if (!voices.length) return null

  // Ranked priority of the most pleasant, warm, studio-quality female/assistant voices
  const topPleasantVoices = [
    // macOS / iOS High-Quality Natural Voices
    "Samantha (Enhanced)",
    "Ava (Enhanced)",
    "Serena (Premium)",
    "Serena",
    "Samantha",
    "Ava",
    "Zoe (Enhanced)",
    "Zoe",
    "Karen (Enhanced)",
    "Karen",
    "Moira",
    "Fiona",
    "Tessa",
    // Chrome / Google Natural Cloud Voices
    "Google UK English Female",
    "Google US English",
    "Google English",
    // Windows Natural Voices
    "Microsoft Jenny Online (Natural)",
    "Microsoft Aria Online (Natural)",
    "Microsoft Zira",
    // Indian Voices
    "Lekha",
    "Veena",
    "Neerja",
    "Google हिन्दी"
  ]

  // Filter out harsh / robotic / joke system voices
  const harshNames = ["Albert", "Bad News", "Bahh", "Bells", "Boing", "Bubbles", "Cellos", "Deranged", "Fred", "Good News", "Hysterical", "Junior", "Kathy", "Organ", "Princess", "Ralph", "Trinoids", "Whisper", "Zarvox"]
  const cleanVoices = voices.filter(v => !harshNames.some(h => v.name.includes(h)))

  // 1. Try finding by highest ranked pleasant names
  for (const name of topPleasantVoices) {
    const match = cleanVoices.find(v => v.name.toLowerCase().includes(name.toLowerCase()))
    if (match) return match
  }

  // 2. Try finding language match with natural female indicators
  const langPrefix = targetLang === "hi" ? "hi" : targetLang === "bn" ? "bn" : targetLang === "as" ? "as" : "en"
  const langMatches = cleanVoices.filter(v => v.lang.toLowerCase().startsWith(langPrefix))
  
  if (langMatches.length) {
    const femaleMatch = langMatches.find(v => 
      v.name.toLowerCase().includes("female") || 
      v.name.toLowerCase().includes("natural") ||
      v.name.toLowerCase().includes("enhanced")
    )
    return femaleMatch || langMatches[0]
  }

  return cleanVoices[0] || voices[0]
}

export function speakText(text, lang = "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return
  }

  try {
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const bestVoice = getBestVoice(lang)
    
    if (bestVoice) {
      utterance.voice = bestVoice
      utterance.lang = bestVoice.lang
    } else {
      const langConfig = VOICE_PROMPTS[lang] || VOICE_PROMPTS.en
      utterance.lang = langConfig.langCode || "en-US"
    }

    // Natural conversational human pitch and relaxed pacing
    utterance.pitch = 1.02 // True human pitch (not chipmunk 1.15)
    utterance.rate = 0.94  // Smooth, clear, calm cadence
    utterance.volume = 1.0

    window.speechSynthesis.speak(utterance)
  } catch (err) {
    console.warn("Speech synthesis notice:", err)
  }
}

export function speakRepPraise(repIndex, lang = "en") {
  const langConfig = VOICE_PROMPTS[lang] || VOICE_PROMPTS.en
  const praiseList = langConfig.repPraise || VOICE_PROMPTS.en.repPraise
  const praiseText = praiseList[Math.min(repIndex - 1, praiseList.length - 1)] || `${repIndex}`
  speakText(praiseText, lang)
}
