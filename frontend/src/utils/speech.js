// Multilingual Speech Synthesis for Sandhi-AI (ASHA Field Guidance)
// Supports English, Assamese, Bengali, and Hindi

export const VOICE_PROMPTS = {
  en: {
    name: "English",
    flag: "🇬🇧",
    langCode: "en-IN",
    sitToStandStart: "Please stand up and sit down as many times as you can in 30 seconds. Keep your arms crossed over your chest.",
    repCounted: "Repetition counted: ",
    testFinished: "Test complete. Great job! Processing your knee joint biomechanics.",
    varusWarning: "Warning: High medial knee load detected. Keep feet shoulder-width apart.",
    crepitusNotice: "Acoustic sensor detected joint crepitus. Analyzing acoustic burst frequency.",
    riskModerate: "Screening complete. Moderate risk detected. Recommended for PHC physiotherapy follow-up."
  },
  as: {
    name: "অসমীয়া",
    flag: "🇮🇳",
    langCode: "as-IN",
    sitToStandStart: "অনুগ্ৰহ কৰি পিঠি পোন কৰি ৩০ ছেকেণ্ডত যিমান পাৰে সিমান বাৰ চকীৰ পৰা উঠক আৰু বহক।",
    repCounted: "গণনা কৰা হ'ল: ",
    testFinished: "পৰীক্ষা সম্পূৰ্ণ হ'ল। ধন্যবাদ! আঁঠুৰ সঞ্চালন বিশ্লেষণ কৰা হৈছে।",
    varusWarning: "সতৰ্কবাণী: আঁঠুত অতিৰিক্ত চাপ ধৰা পৰিছে। ভৰি দুখন সমান্তৰালভাৱে ৰাখক।",
    crepitusNotice: "শব্দ সংবেদকে আঁঠুৰ শব্দ ধৰা পেলাইছে।",
    riskModerate: "স্ক্ৰীনিং সম্পূৰ্ণ। মধ্যমীয়া বিপদৰ সম্ভাৱনা আছে। চিকিৎসালয়ৰ পৰামৰ্শ লওক।"
  },
  bn: {
    name: "বাংলা",
    flag: "🇮🇳",
    langCode: "bn-IN",
    sitToStandStart: "দয়া করে পিঠ সোজা রেখে ৩০ সেকেন্ডে যতবার সম্ভব চেয়ার থেকে উঠুন এবং বসুন।",
    repCounted: "পুনরাবৃত্তি গণনা করা হয়েছে: ",
    testFinished: "পরীক্ষা সম্পন্ন হয়েছে। হাঁটুর জয়েন্ট গতিশীলতা বিশ্লেষণ করা হচ্ছে।",
    varusWarning: "সতর্কতা: হাঁটুতে অতিরিক্ত চাপ অনুভূত হয়েছে। পা দুটো সোজা রাখুন।",
    crepitusNotice: "অ্যাকোস্টিক সেন্সর জয়েন্টের শব্দ সনাক্ত করেছে।",
    riskModerate: "স্ক্রীনিং সম্পূর্ণ। মাঝারি ঝুঁকির সম্ভাবনা রয়েছে।"
  },
  hi: {
    name: "हिन्दी",
    flag: "🇮🇳",
    langCode: "hi-IN",
    sitToStandStart: "कृपया अपनी पीठ सीधी रखते हुए 30 सेकंड में जितनी बार हो सके कुर्सी से उठें और बैठें।",
    repCounted: "गिनती पूरी हुई: ",
    testFinished: "परीक्षण पूरा हुआ। बहुत बढ़िया! आपके घुटने की गति का विश्लेषण किया जा रहा है।",
    varusWarning: "चेतावनी: घुटने के जोड़ पर अतिरिक्त भार देखा गया है।",
    crepitusNotice: "ध्वनि सेंसर ने घुटने में घर्षण की आवाज दर्ज की है।",
    riskModerate: "जांच पूरी हुई। मध्यम जोखिम पाया गया है। फिजियोथेरेपी की सलाह दी जाती है।"
  }
}

export function speakText(text, lang = "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported in this browser.")
    return
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  const langConfig = VOICE_PROMPTS[lang] || VOICE_PROMPTS.en
  utterance.lang = langConfig.langCode || "en-IN"
  utterance.rate = 0.95 // slightly slower for clinical clarity
  utterance.pitch = 1.0

  // Fallback to hindi/indian voice if assamese not installed locally in OS
  const voices = window.speechSynthesis.getVoices()
  const matchedVoice = voices.find(v => v.lang.startsWith(langConfig.langCode.split("-")[0]))
  if (matchedVoice) {
    utterance.voice = matchedVoice
  }

  window.speechSynthesis.speak(utterance)
}
