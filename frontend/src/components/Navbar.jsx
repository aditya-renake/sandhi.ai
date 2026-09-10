import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { VOICE_PROMPTS, speakText, playPleasantChime } from "../utils/speech"

export default function Navbar({ onPortalChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [portalMode, setPortalMode] = useState("asha")
  const [selectedLang, setSelectedLang] = useState("en")
  const [user, setUser] = useState({ username: "invictus", full_name: "Admin Invictus", role: "admin" })

  useEffect(() => {
    const savedPortal = localStorage.getItem("sandhi_portal_mode") || "asha"
    setPortalMode(savedPortal)

    const savedLang = localStorage.getItem("sandhi_lang") || "en"
    setSelectedLang(savedLang)

    const storedUser = localStorage.getItem("sandhi_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {}
    }

    const onLangChange = (e) => {
      if (e.detail) setSelectedLang(e.detail)
    }
    window.addEventListener("sandhi_language_changed", onLangChange)
    return () => window.removeEventListener("sandhi_language_changed", onLangChange)
  }, [])

  const handlePortalSwitch = (mode) => {
    setPortalMode(mode)
    localStorage.setItem("sandhi_portal_mode", mode)
    if (onPortalChange) {
      onPortalChange(mode)
    }
    // If not already on dashboard, take them to dashboard
    if (location.pathname !== "/dashboard") {
      navigate("/dashboard")
    }
  }

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

  const handleLogout = () => {
    localStorage.removeItem("sandhi_token")
    localStorage.removeItem("sandhi_user")
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 lg:px-8 py-3.5 shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        
        {/* Brand */}
        <div 
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white font-black text-lg shadow-sm group-hover:scale-105 transition">
            SA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">SANDHI-AI</span>
              <span className="hidden sm:inline-block rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 tracking-wide">
                MDoNER 26004
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Assessment of NER Degenerative Joint Health & Intervention
            </p>
          </div>
        </div>

        {/* DUAL PORTAL SWITCHER (PDF Checklist Item 1) */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 shadow-inner">
          <button
            type="button"
            onClick={() => { setPortalMode("patient"); navigate("/screening") }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              location.pathname === "/screening" || location.pathname === "/assessment" || location.pathname === "/movement"
                ? "bg-white text-teal-800 shadow-sm border border-slate-200 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <span className="text-base">🩺</span>
            <span className="hidden md:inline">Citizen Screening Hub</span>
            <span className="md:hidden">Screening</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch("doctor")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              portalMode === "doctor"
                ? "bg-teal-700 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <span className="text-base">⚕</span>
            <span className="hidden md:inline">Doctor & MDoNER Hub</span>
            <span className="md:hidden">Doctor</span>
          </button>
        </div>

        {/* Right Tools: Multilingual Voice & User */}
        <div className="flex items-center gap-3">
          
          {/* MULTILINGUAL VOICE TOGGLE (PDF Checklist Item 4) */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            {Object.keys(VOICE_PROMPTS).map((langKey) => {
              const lang = VOICE_PROMPTS[langKey]
              const isSelected = selectedLang === langKey
              return (
                <button
                  key={langKey}
                  type="button"
                  title={`Voice audio: ${lang.name} (${lang.nativeName}) - Click to hear audio`}
                  onClick={() => handleLangChange(langKey)}
                  className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-teal-700 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden lg:inline">{lang.name}</span>
                </button>
              )
            })}
          </div>

          {/* User profile badge */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-right">
            <div>
              <p className="text-xs font-bold text-slate-800">{user.full_name || "Admin Invictus"}</p>
              <p className="text-[10px] text-teal-700 capitalize font-medium">{user.role || "Admin"}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition text-xs cursor-pointer"
          >
            Logout
          </button>

        </div>

      </div>
    </header>
  )
}
