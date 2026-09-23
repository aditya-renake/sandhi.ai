import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  HeartPulse,
  ArrowRight, 
  Video, 
  Volume2, 
  CheckCircle2, 
  ShieldCheck, 
  PhoneCall, 
  UserCheck, 
  Users, 
  Clock, 
  Smile,
  HelpCircle,
  Stethoscope
} from "lucide-react"
import { getScreenings } from "../utils/screeningsStore"
import { VOICE_PROMPTS, speakText, playPleasantChime } from "../utils/speech"

export default function Gateway() {
  const navigate = useNavigate()
  const [totalPatients, setTotalPatients] = useState(128)
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem("sandhi_lang") || "en")

  useEffect(() => {
    try {
      const records = getScreenings()
      if (records && records.length) setTotalPatients(records.length)
    } catch (e) {}
  }, [])

  const handleLangChange = (lang) => {
    setSelectedLang(lang)
    localStorage.setItem("sandhi_lang", lang)
    window.dispatchEvent(new CustomEvent("sandhi_language_changed", { detail: lang }))
    const prompt = VOICE_PROMPTS[lang]
    if (prompt) {
      playPleasantChime()
      speakText(prompt.previewPhrase || prompt.nativeName, lang)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* Top Banner & Accessibility Bar */}
      <header className="border-b border-slate-200 bg-white px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">Sandhi</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Knee Health Check
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Free Community Knee Care & Early Arthritis Screening
              </p>
            </div>
          </div>

          {/* Quick Language & Voice selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700">
              <Volume2 size={15} className="text-teal-700" />
              <span className="font-semibold hidden md:inline">Voice Language:</span>
              <select
                value={selectedLang}
                onChange={(e) => handleLangChange(e.target.value)}
                aria-label="Choose voice language"
                className="bg-transparent font-bold text-teal-900 focus:outline-none cursor-pointer"
              >
                {Object.keys(VOICE_PROMPTS).map((langKey) => {
                  const lang = VOICE_PROMPTS[langKey]
                  return (
                    <option key={langKey} value={langKey}>
                      {lang.flag} {lang.name} ({lang.nativeName})
                    </option>
                  )
                })}
              </select>
            </div>

            <a
              href="tel:18001036004"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition"
              title="Call toll-free patient help"
            >
              <PhoneCall size={14} className="text-emerald-700" />
              <span>Toll-Free: 1800-103-6004</span>
            </a>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 md:py-12 flex flex-col justify-center">
        
        {/* Warm, Welcoming Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100 border border-teal-200 text-teal-900 text-xs sm:text-sm font-bold mb-4 shadow-2xs">
            <Smile size={16} className="text-teal-700" />
            <span>Simple, Free & Safe for Seniors and Grandparents</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Check Your <span className="text-teal-700 underline decoration-teal-300 decoration-wavy decoration-2">Knee Health</span> in 3 Minutes
          </h1>
          
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Are your knees hurting, stiff in the morning, or making it hard to climb stairs? 
            Take this simple check at home to understand your knee condition and receive clear, doctor-approved daily advice.
          </p>

          {/* Reassurance pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-700">
            <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>No medical equipment needed</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
              <Users size={16} className="text-teal-600" />
              <span>Family members can help take the test</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
              <Clock size={16} className="text-teal-600" />
              <span>Takes less than 3 minutes</span>
            </span>
          </div>
        </div>

        {/* TWO PRIMARY DOORS: PATIENT / CITIZEN vs DOCTOR / CLINIC */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto w-full">
          
          {/* DOOR 1: FOR CITIZENS & SENIORS (PRIMARY - 7 COLS) */}
          <div className="md:col-span-7 rounded-3xl bg-white border-2 border-teal-600/30 hover:border-teal-600 p-6 sm:p-8 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-300 text-xs font-extrabold uppercase tracking-wide">
                  <UserCheck size={15} />
                  For Seniors & Patients
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Free & Open
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                Start My Knee Health Check
              </h2>
              
              <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                Take our guided 3-step check. You can sit comfortably in your chair at home. Spoken audio instructions will guide you every step of the way.
              </p>

              {/* 3 Simple Steps preview */}
              <div className="mt-6 space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Answer 5 Simple Questions</h4>
                    <p className="text-xs text-slate-500">Tell us where your knee hurts and how it affects walking or resting.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Chair Stand Test (30 seconds)</h4>
                    <p className="text-xs text-slate-500">A simple test sitting and standing from a steady chair with gentle guidance.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Get Your Clear Knee Advice</h4>
                    <p className="text-xs text-slate-500">Understand your joint health in plain words, with daily exercises you can do at home.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => navigate("/screening")}
                className="w-full py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-base sm:text-lg shadow-md hover:shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-[0.99] cursor-pointer"
              >
                <span>Start Free Knee Check</span>
                <ArrowRight size={20} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/movement")}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200"
              >
                <Video size={16} className="text-teal-700" />
                <span>Jump directly to 30-Second Chair Stand Test</span>
              </button>
            </div>
          </div>

          {/* DOOR 2: FOR DOCTORS & CLINICS (5 COLS) */}
          <div className="md:col-span-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-extrabold uppercase tracking-wide">
                  <Stethoscope size={15} className="text-teal-700" />
                  Medical & Clinic Staff
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                Doctor & Clinic Portal
              </h3>

              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                For Orthopedic Specialists, Primary Health Center Doctors, ASHA Community Health Workers, and MDoNER coordinators.
              </p>

              <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5">
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                  <span><b>Patient Records:</b> Access submitted tests and community screening history</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                  <span><b>Clinical Details:</b> Knee flexion angles, posture alignment, and joint acoustics</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                  <span><b>Hospital Referrals:</b> Fast-track specialist appointments at tertiary medical colleges</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Enter Doctor Hub</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ShieldCheck size={15} className="text-teal-700" />
                <span>Doctor Sign In / Register</span>
              </button>
            </div>
          </div>

        </div>

        {/* Helpful Support & Reassurance Note for Elderly */}
        <div className="mt-10 max-w-5xl mx-auto w-full bg-teal-50/70 border border-teal-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
              <HelpCircle size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-teal-950">
                Are you helping a parent or grandparent?
              </p>
              <p className="text-xs text-teal-800 font-medium">
                You can answer the questions on their behalf and place the phone on a table for the chair movement test.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/screening")}
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shrink-0 cursor-pointer"
          >
            Start Check for Senior
          </button>
        </div>

      </main>

      {/* Trust & Compliance Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-600">
            Sandhi &bull; Community Joint Health & Osteoarthritis Care Portal
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500">
            <span>Free & Open Access</span>
            <span>&bull;</span>
            <span>WOMAC Clinical Standard</span>
            <span>&bull;</span>
            <span>CDC STEADI Mobility Guidelines</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
