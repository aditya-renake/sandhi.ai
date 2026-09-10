// Comprehensive Multilingual Speech Engine for Sandhi-AI
// Supports English, Hindi, Assamese, Bengali, Mizo, and Manipuri with warm, soothing delivery.

let cachedVoices = []

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  cachedVoices = window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices()
  }
}

export const VOICE_PROMPTS = {
  en: {
    id: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    langCode: "en-US",
    previewPhrase: "Welcome to Sandhi-AI! English voice guidance is ready.",
    welcomeTutorial: "Welcome to your knee health check. Sit comfortably on your chair with arms crossed over your chest. When ready, click Start Test Now to begin our 3-2-1 countdown.",
    videoTitle: "How a Real Human Performs the Chair Stand Test",
    videoSubtitle: "Observe the clinician and patient: back straight, feet flat, arms crossed, and full standing extension.",
    videoBadge: "🇬🇧 English Clinical Demo",
    videoNarration: "This is the 30-Second Chair Stand Test. First, sit in the middle of a sturdy chair with your back straight and feet flat on the floor. Cross your arms over your chest with hands on opposite shoulders. When the test begins, stand up completely straight without using your hands to push off, and sit all the way back down smoothly. Aim to complete ten repetitions.",
    videoSteps: [
      "1. Sit straight on a sturdy chair with feet flat on the floor",
      "2. Cross your arms tightly over your chest (do not push off with hands)",
      "3. Rise to a full standing position with knees completely straight",
      "4. Sit back down smoothly and repeat as many times as possible"
    ],
    countdown3: "Three",
    countdown2: "Two",
    countdown1: "One",
    countdownGo: "Begin! Stand up tall, and sit down gently. You are doing so well!",
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
    testFinished: "Wonderful effort! You did fantastic today. Take a gentle breath while we prepare your report.",
    varusWarning: "Please keep your feet a little wider apart to protect your knees.",
    crepitusNotice: "Acoustic analysis complete. Vibroarthrographic crepitus signals and joint stability metrics have been processed."
  },
  hi: {
    id: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    langCode: "hi-IN",
    previewPhrase: "सन्धि-एआई में आपका स्वागत है। मधुर हिन्दी आवाज़ तैयार है।",
    welcomeTutorial: "नमस्ते! घुटने की जांच में आपका स्वागत है। कुर्सी पर आराम से बैठें, दोनों हाथ सीने पर रखें। जब आप तैयार हों, 'Start Test Now' दबाएं।",
    videoTitle: "चेयर स्टैंड टेस्ट कैसे करें — क्लिनिकल वीडियो",
    videoSubtitle: "डॉक्टर और मरीज का सही तरीका देखें: पीठ सीधी, पैर जमीन पर, हाथ सीने पर और पूरा उठना।",
    videoBadge: "🇮🇳 हिन्दी क्लिनिकल प्रदर्शन",
    videoNarration: "यह 30 सेकंड का चेयर स्टैंड टेस्ट है। सबसे पहले एक मजबूत कुर्सी पर सीधे बैठें, और दोनों पैर जमीन पर सपाट रखें। अपने दोनों हाथ सीने पर क्रॉस करके बांध लें। टेस्ट शुरू होने पर हाथों का सहारा लिए बिना पूरी तरह सीधे खड़े हों, और फिर आराम से कुर्सी पर वापस बैठें। 10 बार पूरा करने का प्रयास करें।",
    videoSteps: [
      "1. कुर्सी के बीच में सीधे बैठें, दोनों पैर जमीन पर सपाट रखें",
      "2. दोनों हाथ सीने पर बांध लें, हाथों का सहारा बिल्कुल न लें",
      "3. घुटनों को पूरी तरह सीधा करते हुए बिल्कुल सीधे खड़े हों",
      "4. आराम से कुर्सी पर वापस बैठें और लगातार दोहराएं"
    ],
    countdown3: "तीन",
    countdown2: "दो",
    countdown1: "एक",
    countdownGo: "शुरू करें! आराम से खड़े हों और बैठें। बहुत बढ़िया!",
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
    crepitusNotice: "ध्वनिक विश्लेषण पूरा हुआ। सैंडी-बैंड द्वारा जोड़ के कंपन और स्थिरता का डेटा प्रोसेस कर लिया गया है।"
  },
  as: {
    id: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    flag: "🇮🇳",
    langCode: "as-IN",
    previewPhrase: "সন্ধি-এআইলৈ আপোনাক স্বাগতম। অসমীয়া কণ্ঠ সক্ৰিয় হ'ল।",
    welcomeTutorial: "নমস্কাৰ! আপোনাক আদৰণি জনাইছোঁ। চকীখনত আৰামেৰে বহক, হাত দুখন বুকুত ৰাখক। সাজু হ'লে পৰীক্ষা আৰম্ভ কৰক।",
    videoTitle: "চকী ষ্টেণ্ড পৰীক্ষা কেনেকৈ কৰিব লাগে — ক্লিনিকেল ভিডিঅ'",
    videoSubtitle: "চিকিৎসক আৰু ৰোগীৰ সঠিক পদ্ধতি চাওক: পোন হৈ বহা, বুকুত হাত বন্ধা আৰু সম্পূৰ্ণ থিয় হোৱা।",
    videoBadge: "🇮🇳 অসমীয়া ক্লিনিকেল প্ৰদৰ্শন",
    videoNarration: "এইটো ৩০ ছেকেণ্ডৰ চকী ষ্টেণ্ড পৰীক্ষা। প্ৰথমে এখন মজবুত চকীত পোন হৈ বহক আৰু দুয়োখন ভৰি মজিয়াত সমানকৈ ৰাখক। হাত দুখন বুকুত বান্ধি লওক। পৰীক্ষা আৰম্ভ হ'লে হাতৰ সহায় নোলোৱাকৈ সম্পূৰ্ণৰূপে থিয় হওক, আৰু পুনৰ আৰামেৰে চকীত বহক। ১০ বাৰ কৰিবলৈ চেষ্টা কৰক।",
    videoSteps: [
      "১. মজবুত চকীত পোন হৈ বহক, দুয়োখন ভৰি মজিয়াত সমানকৈ ৰাখক",
      "২. হাত দুখন বুকুত বান্ধি লওক, হাতৰ সহায় কেতিয়াও নলব",
      "৩. আঁঠু আৰু কঁকাল পোন কৰি সম্পূৰ্ণৰূপে থিয় হওক",
      "৪. পুনৰ আৰামেৰে চকীত বহক আৰু একেৰাহে দোহাৰক"
    ],
    countdown3: "তিনি",
    countdown2: "দুই",
    countdown1: "এক",
    countdownGo: "আৰম্ভ কৰক! থিয় হওক আৰু আৰামেৰে বহক। বৰ ভাল হৈছে!",
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
    crepitusNotice: "শব্দ তৰংগৰ বিশ্লেষণ সম্পন্ন হ'ল। সন্ধিবন্ধৰ কঁপনি আৰু আঁঠুৰ জোৰাৰ তথ্য প্ৰস্তুত হৈছে।"
  },
  bn: {
    id: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    flag: "🇮🇳",
    langCode: "bn-IN",
    previewPhrase: "সন্ধি-এআই-তে আপনাকে স্বাগতম। মিষ্টি বাংলা ভয়েস প্রস্তুত।",
    welcomeTutorial: "নমস্কার! এই সহজ হাঁটু পরীক্ষাটিতে আপনাকে স্বাগতম। হাত দুটো বুকে রাখুন এবং প্রস্তুত হলে টেস্ট শুরু করুন।",
    videoTitle: "চেয়ার স্ট্যান্ড টেস্ট কিভাবে করবেন — ক্লিনিক্যাল ভিডিও",
    videoSubtitle: "চিকিৎসক ও রোগীর সঠিক ভঙ্গি দেখুন: সোজা হয়ে বসা, বুকে হাত ক্রস এবং পুরো দাঁড়িয়ে ওঠা।",
    videoBadge: "🇮🇳 বাংলা ক্লিনিক্যাল ভিডিও",
    videoNarration: "এটি ৩০ সেকেন্ড চেয়ার স্ট্যান্ড টেস্ট। প্রথমে একটি শক্ত চেয়ারে সোজা হয়ে বসুন এবং পা দুটো মাটিতে সমানভাবে রাখুন। হাত দুটো বুকের ওপর আড়াআড়ি রাখুন। পরীক্ষা শুরু হলে হাতের সাহায্য ছাড়া পুরোপুরি টানটান হয়ে দাঁড়ান, এবং আবার চেয়ারে বসুন। ১০ বার সম্পন্ন করার চেষ্টা করুন।",
    videoSteps: [
      "১. শক্ত চেয়ারে সোজা হয়ে বসুন, পা দুটো মাটিতে সমানভাবে রাখুন",
      "২. হাত দুটো বুকের ওপর ক্রস করে রাখুন, হাতের ভর দেবেন না",
      "৩. হাঁটু পুরোপুরি সোজা করে একদম টানটান হয়ে দাঁড়ান",
      "৪. চেয়ারে পুরোপুরি বসুন এবং একটানা ১০ বার সম্পন্ন করার চেষ্টা করুন"
    ],
    countdown3: "তিন",
    countdown2: "দুই",
    countdown1: "এক",
    countdownGo: "শুরু করুন! সোজা হয়ে দাঁড়ান, আবার বসুন। দারুণ হচ্ছে!",
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
    crepitusNotice: "শব্দ তরঙ্গ বিশ্লেষণ সম্পন্ন হয়েছে। সন্ধিব্যান্ডের কম্পন ও হাঁটুর স্থায়িত্বের তথ্য প্রস্তুত।"
  },
  lus: {
    id: "lus",
    name: "Mizo",
    nativeName: "Mizo ṭawng",
    flag: "🇮🇳",
    langCode: "en-IN",
    previewPhrase: "Sandhi-AI ah kan lo lawm a che. Mizo tawng hman theih a ni e.",
    welcomeTutorial: "Chibai! I khup endiknaah kan lo lawm a che. Thuthlengah ṭhu la, i kut i awmah kuangkuah rawh le. I inpeih hunah Start Test Now hmet rawh.",
    videoTitle: "Thuthleng Din Test Neih Dan — Clinical Video",
    videoSubtitle: "Duhthusam takin en la: thuthleng laiah ding ngilin ṭhu la, i kut awmah kuangkuah rawh.",
    videoBadge: "🇮🇳 Mizo Zirtirna Video",
    videoNarration: "He hi second 30 chhung thuthleng atanga din test a ni. Thuthleng nghet takah ṭhu la, i kephah chhuatah dah ngil rawh. I kut i awmah kuangkuah tlat la. Tan a nih hunah kut hman miah loin ding ngil zak la, ṭhu leh rawh. Vawi 10 tih tlin tum rawh le.",
    videoSteps: [
      "1. Thuthleng nghet takah ding ngilin ṭhu la, ke chhuatah dah rawh",
      "2. I kut i awmah kuangkuah tlat rawh, kut hman phal a ni lo",
      "3. I khup leh kawng tiding ngil zakin ding chhuak rawh",
      "4. Thuthlengah ṭhu leh la, vawi 10 tlin tum rawh"
    ],
    countdown3: "Pathum",
    countdown2: "Pahnih",
    countdown1: "Khat",
    countdownGo: "Tan rawh le! Ding ngil la, ṭhu leh rawh le. I ti ṭha lutuk e!",
    repPraise: [
      "A ṭha lutuk, pakhat!",
      "Khatih chiah kha, pahnih!",
      "I ti ṭha lutuk, pathum!",
      "Chhunzawm zel rawh, pali!",
      "A chanve kan thleng ta, panga!",
      "Pariak!",
      "Pasarih!",
      "Pariat!",
      "Pakua!",
      "Kan zo e! Sawm a tling ta e!"
    ],
    tenRepsFinished: "I ti ṭha lutuk e! Vawi 10 i thleng fel ta. Result i en ang le.",
    testFinished: "I ti ṭha lutuk e! Hahchawl la, result kan buatsaih mek e.",
    varusWarning: "I ke kha tlemtein pawt kau deuh rawh le.",
    crepitusNotice: "Khup ri chhuak endikna a zo ta. Thluak leh chuktuah dinhmun fel taka chhinchhiah a ni e."
  },
  mni: {
    id: "mni",
    name: "Manipuri",
    nativeName: "মৈতৈলোন্",
    flag: "🇮🇳",
    langCode: "bn-IN",
    previewPhrase: "সন্ধি-এআইদা তরামনা ওকচরি। মণিপুরী খোঞ্জেল শেম-শারে।",
    welcomeTutorial: "খুরুমজরি! খোংগী হকশেল য়েংশিনবদা তরামনা ওকচরি। ফমবাক্তা তোংদুনা খুৎ অদু থবাক্তা থমসি। শেম-শাবদা Start Test Now অদু নমসি।",
    videoTitle: "চকিদা লেপ্পগী তেস্ত পাংথোকপগী খোঞ্জেল অমসুং ভিদিও লমজিং",
    videoSubtitle: "লমজিংবা য়েংসি: অচুম্বা চকিদা তোংবা, খুৎ থবাক্তা কুংশিনবা অমসুং খোংবু তিংথোক্তুনা লেপ্পা।",
    videoBadge: "🇮🇳 মৈতৈলোন্ ক্লিনিকেল ভিদিও",
    videoNarration: "মসি সেকেন্ড ৩০ গী চকিদা লেপ্পগী তেস্তনি। অহানবদা অচুম্বা চকিদা তোংদুনা ফম্মু অমসুং খোংবু লৈমাক্তা চপ চানা থম্মু। খুৎ অনী অদু থবাক্তা কুংশিনসি। তেস্ত হৌরবদা খুৎ শিজিন্নদনা খোংবু অচুম্বা ওইনা লেপ্পু, অদুগা অমুক চকীদোমদা তোংলকউ। তরা রক মপুং ফাহনসি।",
    videoSteps: [
      "১. অচুম্বা চকিদা তোংদুনা ফম্মু, খোংবু লৈমাক্তা চপ চানা থম্মু",
      "২. খুৎ অনী অদু থবাক্তা কুংশিনবা, খুৎনা চকিমদা নমগনু",
      "৩. খোংবু অচুম্বা ওইনা লেপ্পু, খোংবু মপুং ফানা তিংথোকউ",
      "৪. চকীদোমদা অমুক তোংলকউ অমসুং তরা রক শুরসি"
    ],
    countdown3: "অহুম",
    countdown2: "অনি",
    countdown1: "অমা",
    countdownGo: "হৌরো! লেপকনি অদুগা অমুক ফমগনি। য়াম্না ফরে!",
    repPraise: [
      "য়াম্না ফরে, অমা!",
      "ফরে, অনি!",
      "অহুম!",
      "মরি!",
      "মঙা!",
      "তরুক!",
      "তরেৎ!",
      "নিপাল!",
      "মাপন!",
      "য়াম্না ফরে! তরা শুরে!"
    ],
    tenRepsFinished: "থাগৎচরি! তরা মপুং ফানা লোইশিনখ্রে।",
    testFinished: "য়াম্না ফরে! পোথারসি অদুগা রিজল্ট য়েংসি।",
    varusWarning: "খোং অনী অদু খর হায়দোকউ।",
    crepitusNotice: "খোংগী মখোং য়েংশিনবা লোইশিনখ্রে। খোংগী শক্তম অমসুং ফিভমগী রিজল্ট শেম-শারে।"
  }
}

// Gentle pleasant musical chime
export function playPleasantChime() {
  if (typeof window === "undefined") return
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    const notes = [659.25, 830.61] // E5 -> G#5
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
  } catch (e) {}
}

export function getBestVoice(targetLang = "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null

  let voices = cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices()
  if (!voices.length) return null

  const harshNames = ["Albert", "Bad News", "Bahh", "Bells", "Boing", "Bubbles", "Cellos", "Deranged", "Fred", "Good News", "Hysterical", "Junior", "Kathy", "Organ", "Princess", "Ralph", "Trinoids", "Whisper", "Zarvox"]
  const cleanVoices = voices.filter(v => !harshNames.some(h => v.name.includes(h)))

  // 1. Language-specific matching FIRST to prevent English voices trying to speak Indian languages
  if (targetLang === "hi") {
    const hiVoice = cleanVoices.find(v => v.lang.toLowerCase().startsWith("hi") || v.name.includes("हिन्दी") || v.name.toLowerCase().includes("hindi") || v.name.includes("Lekha") || v.name.includes("Veena") || v.name.includes("Neerja") || v.name.includes("Swara"))
    if (hiVoice) return hiVoice
  }

  if (targetLang === "bn") {
    const bnVoice = cleanVoices.find(v => v.lang.toLowerCase().startsWith("bn") || v.name.includes("বাংলা") || v.name.toLowerCase().includes("bengali") || v.name.includes("Tanishaa") || v.name.includes("Bashkar"))
    if (bnVoice) return bnVoice
  }

  if (targetLang === "as") {
    const asVoice = cleanVoices.find(v => v.lang.toLowerCase().startsWith("as") || v.lang.toLowerCase().startsWith("bn") || v.name.includes("বাংলা") || v.name.includes("Lekha") || v.name.includes("Neerja"))
    if (asVoice) return asVoice
  }

  if (targetLang === "mni") {
    const mniVoice = cleanVoices.find(v => v.lang.toLowerCase().startsWith("mni") || v.lang.toLowerCase().startsWith("bn") || v.name.includes("বাংলা") || v.lang.toLowerCase().startsWith("hi"))
    if (mniVoice) return mniVoice
  }

  if (targetLang === "lus") {
    const lusVoice = cleanVoices.find(v => v.lang.toLowerCase().startsWith("en-in") || v.name.includes("Neerja") || v.name.includes("Veena") || v.name.includes("Samantha") || v.name.includes("Ava"))
    if (lusVoice) return lusVoice
  }

  // 2. High-quality pleasant natural voices for English or fallback
  const topPleasantVoices = [
    "Samantha (Enhanced)", "Ava (Enhanced)", "Serena (Premium)", "Serena", "Samantha", "Ava",
    "Zoe (Enhanced)", "Karen (Enhanced)", "Moira", "Fiona", "Tessa",
    "Google UK English Female", "Google US English", "Google English",
    "Microsoft Jenny Online (Natural)", "Microsoft Aria Online (Natural)", "Microsoft Zira"
  ]

  for (const name of topPleasantVoices) {
    const match = cleanVoices.find(v => v.name.toLowerCase().includes(name.toLowerCase()))
    if (match) return match
  }

  const langConfig = VOICE_PROMPTS[targetLang] || VOICE_PROMPTS.en
  const targetPrefix = langConfig.langCode.split("-")[0]
  const langMatches = cleanVoices.filter(v => v.lang.toLowerCase().startsWith(targetPrefix))
  
  if (langMatches.length) {
    const naturalMatch = langMatches.find(v => 
      v.name.toLowerCase().includes("female") || 
      v.name.toLowerCase().includes("natural") ||
      v.name.toLowerCase().includes("enhanced")
    )
    return naturalMatch || langMatches[0]
  }

  return cleanVoices[0] || voices[0]
}

export function speakText(text, lang = "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return

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

    // Tuning for a calm, friendly, empathetic healthcare assistant
    utterance.pitch = lang === "en" ? 1.02 : 1.0
    utterance.rate = lang === "en" ? 0.94 : 0.91
    utterance.volume = 1.0

    window.speechSynthesis.speak(utterance)
  } catch (err) {
    console.warn("Speech notice:", err)
  }
}

export function speakRepPraise(repIndex, lang = "en") {
  const langConfig = VOICE_PROMPTS[lang] || VOICE_PROMPTS.en
  const praiseList = langConfig.repPraise || VOICE_PROMPTS.en.repPraise
  const praiseText = praiseList[Math.min(repIndex - 1, praiseList.length - 1)] || `${repIndex}`
  speakText(praiseText, lang)
}

export function speakVideoNarration(lang = "en") {
  const prompt = VOICE_PROMPTS[lang] || VOICE_PROMPTS.en
  playPleasantChime()
  speakText(prompt.videoNarration || prompt.welcomeTutorial, lang)
}
