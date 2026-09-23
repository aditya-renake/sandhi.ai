import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { VOICE_PROMPTS, speakText, playPleasantChime } from "../utils/speech"
import { Type, Volume2, HeartPulse, LogOut } from "lucide-react"

export default function Navbar({ onPortalChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [portalMode, setPortalMode] = useState("asha")
  const [selectedLang, setSelectedLang] = useState("en")
  const [textSize, setTextSize] = useState("normal") // "normal" | "large" | "xl"
  const [user, setUser] = useState({ username: "invictus", full_name: "Admin Invictus", role: "admin" })

  useEffect(() => {
    const savedPortal = localStorage.getItem("sandhi_portal_mode") || "asha"
    setPortalMode(savedPortal)

    const savedLang = localStorage.getItem("sandhi_lang") || "en"
    setSelectedLang(savedLang)

    const savedSize = localStorage.getItem("sandhi_text_size") || "normal"
    setTextSize(savedSize)
    if (savedSize === "normal") {
      document.documentElement.removeAttribute("data-text-size")
    } else {
      document.documentElement.setAttribute("data-text-size", savedSize)
    }

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

  const handleTextSizeChange = (size) => {
    setTextSize(size)
    localStorage.setItem("sandhi_text_size", size)
    if (size === "normal") {
      document.documentElement.removeAttribute("data-text-size")
    } else {
      document.documentElement.setAttribute("data-text-size", size)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("sandhi_token")
    localStorage.removeItem("sandhi_user")
    navigate("/")
  }

  const isPatientFlow = location.pathname === "/" || 
    location.pathname === "/gateway" || 
    location.pathname === "/screening" || 
    location.pathname === "/assessment" || 
    location.pathname === "/movement" || 
    location.pathname === "/analysis" || 
    location.pathname === "/results"

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-3 sm:px-6 lg:px-8 py-3 shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        
        {/* Brand */}
        <div 
          onClick={() => navigate("/")}
          className="flex items-center gap-3 cursor-pointer group"
          title="Return to home page"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700 shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
            <HeartPulse className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">Sandhi</span>
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-800 tracking-wide border border-teal-200">
                Knee Health
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Free Community Knee Screening & Care
            </p>
          </div>
        </div>

        {/* Portal Switcher */}
        <nav aria-label="Portal Navigation" className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => { setPortalMode("patient"); navigate("/screening") }}
            className={`flex items-center gap-1.5 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
              isPatientFlow && location.pathname !== "/dashboard"
                ? "bg-white text-teal-900 shadow-xs border border-slate-200/80 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <span className="text-sm">🩺</span>
            <span>Knee Check</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch("doctor")}
            className={`flex items-center gap-1.5 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
              location.pathname === "/dashboard"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <span className="text-sm">⚕</span>
            <span className="hidden sm:inline">Doctor / Clinic</span>
            <span className="sm:hidden">Doctor</span>
          </button>
        </nav>

        {/* Accessibility & Language Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Senior Text Size Adjuster */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200" title="Adjust text size for easier reading">
            <span className="text-[11px] font-bold text-slate-500 px-1.5 hidden md:inline flex items-center gap-0.5">
              <Type size={12} /> Text:
            </span>
            <button
              type="button"
              onClick={() => handleTextSizeChange("normal")}
              className={`px-2 py-1 rounded text-xs font-bold transition cursor-pointer ${
                textSize === "normal" ? "bg-white text-teal-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
              title="Standard text size"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => handleTextSizeChange("large")}
              className={`px-2 py-1 rounded text-xs font-bold transition cursor-pointer ${
                textSize === "large" ? "bg-white text-teal-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
              title="Large text size for easier reading"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => handleTextSizeChange("xl")}
              className={`px-2 py-1 rounded text-xs font-bold transition cursor-pointer ${
                textSize === "xl" ? "bg-white text-teal-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
              title="Extra large text size"
            >
              A++
            </button>
          </div>

          {/* Multilingual Voice Selector */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <span className="hidden xl:flex items-center gap-1 text-[11px] font-bold text-slate-500 px-2">
              <Volume2 size={12} className="text-teal-600" />
              Voice:
            </span>
            <select
              value={selectedLang}
              onChange={(e) => handleLangChange(e.target.value)}
              aria-label="Select voice guidance language"
              className="bg-transparent font-medium text-xs text-slate-800 py-1 px-1.5 rounded focus:outline-none cursor-pointer"
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

          {/* Exit / Logout if logged in */}
          {user && (
            <button
              onClick={handleLogout}
              title="Exit / Sign out"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition text-xs font-medium cursor-pointer flex items-center gap-1"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Exit</span>
            </button>
          )}

        </div>

      </div>
    </header>
  )
}
