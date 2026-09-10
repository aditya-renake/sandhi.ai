import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  UserCheck, 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  Video, 
  Volume2, 
  Layers, 
  Database, 
  Sparkles,
  Building2,
  HeartHandshake,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { getScreenings } from "../utils/screeningsStore"

export default function Gateway() {
  const navigate = useNavigate()
  const [totalPatients, setTotalPatients] = useState(128)
  const [highRiskCount, setHighRiskCount] = useState(7)

  useEffect(() => {
    try {
      const records = getScreenings()
      setTotalPatients(records.length)
      setHighRiskCount(records.filter(r => r.scores?.riskCategory === "HIGH").length)
    } catch (e) {}
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-teal-900/40 ring-1 ring-teal-400/30">
              OA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">Sandhi-AI</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-950 text-teal-400 border border-teal-800">
                  v2.4 Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ministry of Development of North Eastern Region (MDoNER) &bull; Problem Statement 26004
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Tele-Screening Pipeline Active</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              <Volume2 size={13} className="text-teal-400" />
              <span>6 NER Languages</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero and Gateway Blocks */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 md:py-14 flex flex-col justify-center">
        
        {/* Banner Title */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-900/30 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-4">
            <Sparkles size={14} className="text-teal-400" />
            <span>AI-Assisted Knee Osteoarthritis Care & Triage System</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Select Your <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">Access Portal</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Choose whether you are taking a knee health screening test as a patient or citizen, or accessing the centralized clinical command center as a doctor or healthcare administrator.
          </p>
        </div>

        {/* Real-time Telemetry Notification Banner */}
        <div className="mb-8 max-w-4xl mx-auto w-full bg-gradient-to-r from-teal-950/70 via-slate-900 to-slate-950 border border-teal-800/50 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-900/60 border border-teal-700/50 flex items-center justify-center text-teal-300 shrink-0">
              <Database size={18} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-200">
                ⚡ Automatic Real-Time Telemetry Synchronization
              </p>
              <p className="text-[11px] text-slate-400">
                Every test completed in the User Portal is automatically reflected in the Doctor & Admin Command Center with full kinematic biomarkers.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col text-right shrink-0">
            <span className="text-xs text-slate-400">Registry Records</span>
            <span className="text-sm font-bold text-teal-400">{totalPatients} Screenings Active</span>
          </div>
        </div>

        {/* TWO PRIMARY PORTAL BLOCKS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto w-full">
          
          {/* BLOCK 1: PATIENT / CITIZEN PORTAL */}
          <div className="group relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-slate-800 hover:border-teal-500/70 p-7 sm:p-9 shadow-2xl transition-all duration-300 hover:shadow-teal-950/40 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/20 transition-all duration-500"></div>
            
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950 text-teal-300 border border-teal-800/80 text-xs font-bold uppercase tracking-wider">
                  <UserCheck size={14} />
                  Patient & Citizen Portal
                </span>
                <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  Open Access
                </span>
              </div>

              {/* Icon & Title */}
              <div className="w-16 h-16 rounded-2xl bg-teal-900/40 border border-teal-600/40 flex items-center justify-center text-teal-400 mb-5 group-hover:scale-105 transition-transform shadow-inner">
                <Activity size={32} />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-teal-300 transition-colors">
                Take Knee OA Screening Test
              </h2>

              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                For patients, tea garden workers, mountain farmers, and citizens across the North East. Complete a guided 3-minute knee assessment.
              </p>

              {/* Feature Points */}
              <div className="mt-6 space-y-3 pt-6 border-t border-slate-800">
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                  <span><b>30s Chair Stand Test:</b> Real human clinical video demonstration + camera angle tracking</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                  <span><b>Native Audio Guidance:</b> Complete voice instructions in Assamese, Bengali, Hindi, Mizo, Meitei & English</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                  <span><b>Instant Health Results:</b> WOMAC disability index, ROM flexion/extension, and clinical recommendations</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                  <span><b>Auto-Sync to Doctor:</b> Test data is instantly sent to the nearest Medical Officer</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-8 pt-4 space-y-3">
              <button
                onClick={() => navigate("/registration")}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-base shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2 group/btn cursor-pointer transition-all active:scale-[0.99]"
              >
                <span>Begin Patient Screening</span>
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate("/movement")}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Video size={14} className="text-teal-400" />
                <span>Jump directly to 30s Movement Test</span>
              </button>
            </div>
          </div>

          {/* BLOCK 2: DOCTOR & ADMIN COMMAND HUB */}
          <div className="group relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-slate-800 hover:border-cyan-500/70 p-7 sm:p-9 shadow-2xl transition-all duration-300 hover:shadow-cyan-950/40 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500"></div>

            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck size={14} />
                  Doctor & MDoNER Admin Hub
                </span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Live Feed
                </span>
              </div>

              {/* Icon & Title */}
              <div className="w-16 h-16 rounded-2xl bg-cyan-900/40 border border-cyan-600/40 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-105 transition-transform shadow-inner">
                <Building2 size={32} />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                Clinical Command Center
              </h2>

              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                For Orthopedic Clinicians, Medical Officers, ASHA coordinators, and MDoNER authorities monitoring citizen screening cohorts.
              </p>

              {/* Feature Points */}
              <div className="mt-6 space-y-3 pt-6 border-t border-slate-800">
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><b>Real-Time Patient Monitor:</b> Live feed of incoming patient tests with instant condition indicators</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><b>Deep Clinical Biomarkers:</b> ROM angles, Varus/Valgus alignment, and VAG acoustic crepitus bursts</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><b>Tertiary Triage Referral:</b> Fast-track referrals to GMCH Guwahati, RIMS Imphal & NEIGRIHMS Shillong</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><b>8 NER States Heatmap:</b> Geographic surveillance across Assam, Meghalaya, Manipur, Mizoram & more</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-8 pt-4 space-y-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-base shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 group/btn cursor-pointer transition-all active:scale-[0.99]"
              >
                <span>Enter Admin Command Hub</span>
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate("/login")}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ShieldCheck size={14} className="text-cyan-400" />
                <span>Doctor Sign In / Register (invictus / invictus@11)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Live System Counter Indicators */}
        <div className="mt-12 max-w-5xl mx-auto w-full grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-2xl font-black text-teal-400">{totalPatients}</span>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Patients Screened</p>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-2xl font-black text-orange-400">{highRiskCount}</span>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">High Risk Triage Cases</p>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-2xl font-black text-cyan-400">8 / 8</span>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">NER States Monitored</p>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-2xl font-black text-emerald-400">&lt; 3 Min</span>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Avg Screening Duration</p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Sandhi-AI &bull; AI-Powered Tele-Screening for Early Knee Osteoarthritis Detection
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>ABHA Compliant</span>
            <span>&bull;</span>
            <span>CDC STEADI Protocol</span>
            <span>&bull;</span>
            <span>WOMAC Standard</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
