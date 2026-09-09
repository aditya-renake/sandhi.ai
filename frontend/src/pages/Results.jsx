import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import Navbar from "../components/Navbar"

export default function Results() {
  const navigate = useNavigate()
  const location = useLocation()

  const stateData = location.state || {}
  const compositeScore = stateData.compositeScore || 68
  const riskCategory = stateData.riskCategory || (compositeScore >= 65 ? "HIGH" : compositeScore >= 35 ? "MODERATE" : "LOW")
  const klProxy = stateData.klProxy || 2
  const patientName = stateData.patientName || "Bimla Karmakar"
  const abhaId = stateData.abhaId || "14-5829-1029-4821"

  const [downloading, setDownloading] = useState(false)

  const handleDownloadPDF = () => {
    setDownloading(true)
    setTimeout(() => {
      window.print()
      setDownloading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl p-4 md:p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <span className="rounded-full bg-teal-100 text-teal-800 font-bold px-3 py-1 text-xs uppercase tracking-wider">
            Screening Protocol Complete
          </span>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Osteoarthritis Clinical Risk Evaluation
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Comprehensive diagnostic summary generated for MDoNER PS 26004
          </p>
        </div>

        {/* Patient Bar */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div>
            <p className="text-xs text-slate-400 font-medium">Patient</p>
            <p className="text-base font-bold text-slate-900">{patientName}</p>
            <p className="text-xs font-mono text-slate-500">ABHA: {abhaId}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="rounded-xl border border-teal-600 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition flex items-center gap-1.5"
            >
              <span>📄</span>
              <span>{downloading ? "Preparing PDF..." : "Export / Print Clinical PDF"}</span>
            </button>
          </div>
        </div>

        {/* Score Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Multimodal Composite Risk Score
          </p>

          <p className={`mt-3 text-7xl font-black font-mono ${
            riskCategory === "HIGH" ? "text-red-600" :
            riskCategory === "MODERATE" ? "text-orange-600" : "text-emerald-600"
          }`}>
            {compositeScore}
          </p>

          <div className="mt-2 flex justify-center">
            <span className={`px-4 py-1 rounded-full text-sm font-black tracking-wide ${
              riskCategory === "HIGH" ? "bg-red-100 text-red-700" :
              riskCategory === "MODERATE" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {riskCategory} RISK &bull; KL GRADE {klProxy} PROXY
            </span>
          </div>

          <p className="mx-auto mt-4 max-w-lg text-xs text-slate-500 leading-relaxed">
            Evaluation fuses MediaPipe computer vision kinematics, SandhiBand™ VAG acoustic crepitus spikes, clinical WOMAC score, and North Eastern regional terrain factors.
          </p>
        </div>

        {/* Diagnostic Factor Breakdown */}
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Contributing Diagnostic Biomarkers
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 flex items-start gap-3">
              <span className="text-red-500 text-base">⚠️</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Biomechanical Flexion Deficit</p>
                <p className="text-[11px] text-slate-500">Active flexion restricted to &lt;120°. Extension lag detected.</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 flex items-start gap-3">
              <span className="text-amber-500 text-base">⚡</span>
              <div>
                <p className="text-xs font-bold text-slate-800">VAG Crepitus Micro-bursts</p>
                <p className="text-[11px] text-slate-500">SandhiBand piezoelectric sensor captured 4 bursts at patella.</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 flex items-start gap-3">
              <span className="text-orange-500 text-base">⚖️</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Varus Alignment & Load Asymmetry</p>
                <p className="text-[11px] text-slate-500">Dknee/Dankle ratio &gt; 1.3 indicates elevated medial compartment load.</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 flex items-start gap-3">
              <span className="text-blue-500 text-base">⛰️</span>
              <div>
                <p className="text-xs font-bold text-slate-800">NER Occupational & Terrain Burden</p>
                <p className="text-[11px] text-slate-500">Daily load carrying on steep terrace slopes increases mechanical stress.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Referral Plan */}
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/70 p-6 shadow-xs">
          <h3 className="text-base font-bold text-teal-950">Recommended Intervention Plan</h3>
          <ul className="mt-3 space-y-2 text-xs text-teal-900">
            <li className="flex items-center gap-2">
              <span className="font-bold text-teal-700">&bull;</span>
              <span><b>Tele-Rheumatology Referral:</b> Schedule appointment with District Orthopedic Surgeon.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="font-bold text-teal-700">&bull;</span>
              <span><b>Physiotherapy:</b> Isometric quadriceps strengthening and hamstring stretching exercises.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="font-bold text-teal-700">&bull;</span>
              <span><b>Ergonomic Advice:</b> Utilize supportive walking cane when navigating hilly tea garden slopes.</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-slate-300 px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            ← Back to Dashboard
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => navigate("/registration")}
              className="rounded-xl bg-teal-700 px-6 py-3 text-xs font-bold text-white hover:bg-teal-800 transition cursor-pointer shadow-sm"
            >
              + Start Next Patient Screening
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}
