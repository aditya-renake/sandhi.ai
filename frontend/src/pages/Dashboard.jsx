import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Users, Activity, AlertTriangle, PlusCircle, User, LogOut, ChevronDown, MapPin, Building2, Phone } from "lucide-react"

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState({
    username: "invictus",
    full_name: "Admin Invictus",
    role: "admin",
    state: "Assam",
    phone: ""
  })
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sandhi_user")
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      // fallback to default
    }
  }, [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("sandhi_token")
    localStorage.removeItem("sandhi_user")
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-900/40 text-teal-400 font-bold text-xl shadow-inner ring-1 ring-teal-500/20">
            OA
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              OA Care
            </h1>
            <p className="text-[11px] text-teal-400 font-medium">
              AI-Assisted Osteoarthritis Screening
            </p>
          </div>
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold shadow-inner">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-slate-100 leading-none">
                {user.full_name || "Admin Invictus"}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 capitalize">
                {user.role || "Admin"}
              </p>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Popover */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-20 origin-top-right animate-in fade-in slide-in-from-top-2">
              <div className="px-5 py-4 border-b border-slate-700/50">
                <p className="text-[11px] font-bold tracking-wider text-teal-500 uppercase mb-3">Healthcare Worker Profile</p>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">{user.full_name || "Admin Invictus"}</p>
                    <p className="text-xs text-slate-400 capitalize">{user.role || "Admin"}</p>
                  </div>
                </div>
              </div>
              
              <div className="px-3 py-2 space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300">
                  <Building2 size={16} className="text-slate-500" />
                  <span className="truncate">NER Primary Health Centre</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300">
                  <MapPin size={16} className="text-slate-500" />
                  <span className="capitalize">{user.state || "Assam"}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300">
                    <Phone size={16} className="text-slate-500" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 rounded-lg transition-colors cursor-pointer text-left">
                  <User size={16} className="text-slate-500" />
                  <span>Profile Settings</span>
                </button>
              </div>

              <div className="px-3 py-2 mt-1 border-t border-slate-700/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors cursor-pointer font-medium"
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl p-8">

        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">
          Dashboard
        </h2>

        <p className="mt-2 text-slate-400">
          Monitor and manage osteoarthritis screening across North Eastern Region centers.
        </p>

        {/* Statistics */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl bg-slate-800 p-6 shadow-lg border border-slate-700 flex flex-col relative overflow-hidden group hover:border-slate-600 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={64} className="text-teal-400" />
            </div>
            <p className="text-sm font-medium text-slate-400 mb-1 z-10 flex items-center gap-2">
              <Users size={16} className="text-teal-400" />
              Total Patients
            </p>
            <p className="mt-2 text-4xl font-bold text-slate-100 z-10">
              128
            </p>
          </div>

          <div className="rounded-2xl bg-slate-800 p-6 shadow-lg border border-slate-700 flex flex-col relative overflow-hidden group hover:border-slate-600 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity size={64} className="text-teal-400" />
            </div>
            <p className="text-sm font-medium text-slate-400 mb-1 z-10 flex items-center gap-2">
              <Activity size={16} className="text-teal-400" />
              Screened Today
            </p>
            <p className="mt-2 text-4xl font-bold text-slate-100 z-10">
              24
            </p>
          </div>

          <div className="rounded-2xl bg-slate-800 p-6 shadow-lg border border-slate-700 flex flex-col relative overflow-hidden group hover:border-orange-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle size={64} className="text-orange-500" />
            </div>
            <p className="text-sm font-medium text-slate-400 mb-1 z-10 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              High Risk Alerts
            </p>
            <p className="mt-2 text-4xl font-bold text-orange-400 z-10">
              7
            </p>
          </div>

        </div>

        {/* New Screening */}
        <div className="mt-10 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden relative">
          {/* Subtle accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-600 to-teal-400"></div>
          
          <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/30 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-4">
                Clinical Workflow
              </div>
              <h3 className="text-2xl font-bold text-slate-100">
                Start a New Screening
              </h3>
              <p className="mt-3 text-slate-400 leading-relaxed max-w-2xl">
                Register a patient and begin an AI-assisted OA risk assessment. 
                The workflow includes symptom tracking, clinical WOMAC scoring, 
                and camera-based gait and range of motion analysis.
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <button
                onClick={() => navigate("/registration")}
                className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-4 font-semibold text-white hover:bg-teal-500 transition-colors shadow-lg shadow-teal-900/20 cursor-pointer"
              >
                <PlusCircle size={20} />
                <span>New Screening</span>
              </button>
            </div>
          </div>
        </div>

      </main>

    </div>
  )
}

export default Dashboard
