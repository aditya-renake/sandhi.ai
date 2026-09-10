import { useState, useEffect, useRef } from "react"
import { addScreening } from "../utils/screeningsStore"
import { useNavigate, useLocation } from "react-router-dom"
import Navbar from "../components/Navbar"

export default function Results() {
  const navigate = useNavigate()
  const location = useLocation()

  const stateData = location.state || {}
  
  // Read dynamic patient data
  const storedPatient = localStorage.getItem("sandhi_patient")
  let parsedPatient = null
  try {
    parsedPatient = storedPatient ? JSON.parse(storedPatient) : null
  } catch (e) {}

  const patient = stateData.patient || parsedPatient || {
    name: "Bimla Karmakar",
    age: 58,
    gender: "Female",
    state: "Assam",
    district: "Kamrup Metropolitan",
    joint: "Right Knee",
    abhaId: "14-5829-1029-4821"
  }

  // Read dynamic score and metrics
  const compositeScore = stateData.compositeScore ?? 54
  const riskCategory = stateData.riskCategory || (compositeScore >= 65 ? "HIGH" : compositeScore >= 35 ? "MODERATE" : "LOW")
  const klProxy = stateData.klProxy ?? (compositeScore >= 80 ? 4 : compositeScore >= 65 ? 3 : compositeScore >= 35 ? 2 : compositeScore >= 20 ? 1 : 0)
  const womacScore = stateData.womacScore ?? 42

  const movement = stateData.movementResults || {}
  const reps = movement.sitToStandReps ?? 8
  const rom = movement.rom ?? 86
  const varusValgus = movement.varusValgusAlignment || (movement.alignmentRatio > 1.3 ? "Varus" : movement.alignmentRatio < 0.8 ? "Valgus" : "Normal")
  const alignmentRatio = movement.alignmentRatio || 1.15

  const vag = stateData.vagData || {}
  const burstCount = vag.burstCount ?? (compositeScore >= 65 ? 7 : compositeScore >= 35 ? 4 : 1)
  const peakFrequency = vag.peakFrequency ?? (compositeScore >= 65 ? 245 : compositeScore >= 35 ? 142 : 85)
  const triFactor = stateData.triFactorBreakdown || {}

  const hasSyncedRef = useRef(false)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (hasSyncedRef.current) return
    hasSyncedRef.current = true

    const newRecord = {
      id: "SCR-" + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString(),
      patient: {
        name: patient.name || "Unknown Patient",
        age: Number(patient.age) || 55,
        gender: patient.gender || "Female",
        phone: patient.phone || "+91 98640 12000",
        state: patient.state || "Assam",
        district: patient.district || "Kamrup Metropolitan",
        joint: patient.joint || "Right Knee",
        occupation: patient.occupation || "Agricultural Worker",
        abhaId: patient.abhaId || "14-" + Math.floor(1000 + Math.random() * 9000) + "-2026-4821"
      },
      scores: {
        compositeScore,
        riskCategory,
        klProxy,
        womacScore,
        sitToStandReps: reps,
        rom,
        flexionAngle: movement.flexionAngle || (180 - rom),
        extensionAngle: movement.extensionAngle || 160,
        alignmentRatio,
        varusValgus,
        burstCount,
        peakFrequency
      },
      clinicalAction: riskCategory === "HIGH" 
        ? "GMCH Guwahati Tertiary Orthopedic Referral"
        : riskCategory === "MODERATE"
        ? "PHC Physiotherapy & Quadriceps Strengthening"
        : "Preventive Joint Health & Lifestyle Counseling",
      status: "New (Auto-Synced)",
      notes: "Auto-synced from citizen screening. Chair Stand: " + reps + " reps, Knee ROM: " + rom + " deg. Acoustic bursts: " + burstCount + "."
    }

    addScreening(newRecord)
    setSynced(true)
  }, [compositeScore, riskCategory, klProxy, womacScore, reps, rom, alignmentRatio, varusValgus, burstCount, peakFrequency, patient])

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
            Screening Protocol Complete &bull; Multi-Modal AI Output
          </span>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Osteoarthritis Clinical Risk Evaluation
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Patient-specific diagnostic synthesis generated for MDoNER PS 26004
          </p>
        </div>

        {/* Real-Time Telemetry Synchronization Notice */}
        <div className="mb-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-200">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>⚡ Automatically Synchronized with Doctor & Admin Hub</span>
                <span className="text-[10px] bg-emerald-900 px-2 py-0.5 rounded-full border border-emerald-700 text-emerald-300 font-mono">LIVE SYNC</span>
              </p>
              <p className="text-[11px] text-emerald-300 mt-0.5">
                Screening biomarkers for <b>{patient.name}</b> (ABHA: {patient.abhaId || "14-xxxx"}) are now immediately viewable in the clinical command dashboard.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-1"
          >
            <span>Inspect in Admin Hub →</span>
          </button>
        </div>

        {/* Patient Bar */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-slate-900">{patient.name}</p>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">
                {patient.age}y &bull; {patient.gender}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ABHA: <b className="font-mono text-slate-700">{patient.abhaId || "14-5829-1029-4821"}</b> &bull; {patient.joint || "Right Knee"} &bull; {patient.district}, {patient.state}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="rounded-xl border border-teal-600 bg-teal-50 px-4 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>📄</span>
              <span>{downloading ? "Generating PDF..." : "Export Clinical PDF"}</span>
            </button>
          </div>
        </div>

        {/* Score Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Patient Multi-Modal Composite Risk Score
          </p>

          <p className={`mt-3 text-7xl font-black font-mono tracking-tight ${
            riskCategory === "HIGH" ? "text-red-600" :
            riskCategory === "MODERATE" ? "text-orange-600" : "text-emerald-600"
          }`}>
            {compositeScore}
            <span className="text-2xl text-slate-400 font-normal"> / 100</span>
          </p>

          <div className="mt-3 flex justify-center">
            <span className={`px-5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase ${
              riskCategory === "HIGH" ? "bg-red-100 text-red-700 border border-red-200" :
              riskCategory === "MODERATE" ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
            }`}>
              {riskCategory} RISK &bull; KELLGREN-LAWRENCE GRADE {klProxy} PROXY
            </span>
          </div>

          {/* Color Gradient Track */}
          <div className="mx-auto mt-6 max-w-md">
            <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: "35%" }} />
              <div className="h-full bg-orange-400" style={{ width: "30%" }} />
              <div className="h-full bg-rose-500" style={{ width: "35%" }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-mono text-slate-400">
              <span>0 Low (Grade 0-1)</span>
              <span>35 Moderate (Grade 2)</span>
              <span>65 High (Grade 3-4)</span>
              <span>100</span>
            </div>
          </div>

          <p className="mx-auto mt-4 max-w-lg text-xs text-slate-500 leading-relaxed">
            Composite evaluation fuses MediaPipe 30s chair stand kinematics, SandhiBand™ VAG acoustic friction micro-bursts, clinical WOMAC index, and anatomical knee axis ratios.
          </p>
        </div>

        {/* Sandy AI 3-Pillar Sub-Score Breakdown */}
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Sandy AI — Tri-Factor Multimodal Sub-Scores
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">
              Final = (0.30 × Q) + (0.35 × CV) + (0.35 × HW)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-teal-700 uppercase">1. Questionnaire (30%)</span>
                <span className="text-sm font-black text-slate-900 font-mono">{triFactor.questionnaire_score ?? womacScore}/100</span>
              </div>
              <p className="text-[11px] text-slate-500">WOMAC pain, stiffness & physical function scale</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-cyan-700 uppercase">2. CV Kinematics (35%)</span>
                <span className="text-sm font-black text-slate-900 font-mono">{triFactor.cv_score ?? (reps < 8 ? 72 : 40)}/100</span>
              </div>
              <p className="text-[11px] text-slate-500">{reps} chair stands in 30s &bull; {rom}° ROM</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-amber-700 uppercase">3. Hardware Sensor (35%)</span>
                <span className="text-sm font-black text-slate-900 font-mono">{triFactor.hardware_score ?? (burstCount >= 5 ? 65 : 35)}/100</span>
              </div>
              <p className="text-[11px] text-slate-500">{burstCount} VAG bursts &bull; {peakFrequency} Hz peak</p>
            </div>
          </div>
        </div>

        {/* Diagnostic Factor Breakdown (Now 100% Dynamic!) */}
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Diagnostic Biomarker Breakdown for {patient.name}
            </h3>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              Calibrated Values
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            
            {/* 1. Range of Motion */}
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-start gap-3">
              <span className="text-xl">📐</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-900">Knee Range of Motion (ROM)</p>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    rom < 75 ? "bg-red-100 text-red-700" : rom < 100 ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {rom}°
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {rom < 75 
                    ? `Severe functional ROM restriction (${rom}°). Flexion contracture and significant terminal extension lag.`
                    : rom < 100 
                    ? `Moderate functional flexion deficit (${rom}° ROM). Mild stiffness during deep flexion.`
                    : `Normal healthy joint flexibility (${rom}° ROM). Full extension and smooth flexion.`
                  }
                </p>
              </div>
            </div>

            {/* 2. SandhiBand VAG Crepitus */}
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-start gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-900">SandhiBand™ VAG Crepitus</p>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    burstCount >= 6 ? "bg-red-100 text-red-700" : burstCount >= 3 ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {burstCount} Bursts &bull; {peakFrequency} Hz
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {burstCount >= 6 
                    ? `Coarse high-frequency acoustic micro-bursts indicate significant articular cartilage erosion and bone-on-bone friction.`
                    : burstCount >= 3 
                    ? `Moderate vibration bursts captured during mid-flexion, indicative of early patellofemoral cartilage softening.`
                    : `Smooth acoustic profile with low-frequency waves, confirming adequate synovial fluid lubrication.`
                  }
                </p>
              </div>
            </div>

            {/* 3. 30-Second Chair Stand Repetitions */}
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-start gap-3">
              <span className="text-xl">🪑</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-900">30s Chair Stand Test (CST)</p>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    reps < 6 ? "bg-red-100 text-red-700" : reps < 10 ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {reps} Reps
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {reps < 6 
                    ? `Severely reduced lower extremity quadriceps power (${reps} reps). High functional fall risk.`
                    : reps < 10 
                    ? `Mild-to-moderate quadriceps weakness (${reps} reps). Patient required extended recovery time per stand.`
                    : `Optimal quadriceps endurance and balance (${reps} reps completed with stable cadence).`
                  }
                </p>
              </div>
            </div>

            {/* 4. Joint Alignment Ratio */}
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-start gap-3">
              <span className="text-xl">⚖️</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-900">Knee Anatomical Alignment</p>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    varusValgus !== "Normal" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {varusValgus} (Ratio: {alignmentRatio})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {varusValgus === "Varus" 
                    ? `Bow-leg varus angulation (ratio ${alignmentRatio} > 1.3) multiplies compressive forces on medial joint compartment.`
                    : varusValgus === "Valgus" 
                    ? `Knock-knee valgus axis shifts mechanical stress towards the lateral patellofemoral facet.`
                    : `Neutral mechanical axis (ratio ${alignmentRatio}) protects against eccentric compartmental overloading.`
                  }
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Clinical Referral Plan Tailored to Patient Risk */}
        <div className={`mt-6 rounded-2xl p-6 shadow-xs border ${
          riskCategory === "HIGH" ? "border-rose-200 bg-rose-50/70 text-rose-950" :
          riskCategory === "MODERATE" ? "border-amber-200 bg-amber-50/70 text-amber-950" :
          "border-emerald-200 bg-emerald-50/70 text-emerald-950"
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">
              {riskCategory === "HIGH" ? "🚨 Priority Orthopedic Clinical Referral" :
               riskCategory === "MODERATE" ? "🩺 Sub-Centre / PHC Physiotherapy Care Pathway" :
               "🌿 Community Health & Prevention Guidance"}
            </h3>
            <span className="text-xs font-black uppercase tracking-wider">
              Protocol: {riskCategory} Risk
            </span>
          </div>

          <ul className="mt-3.5 space-y-2.5 text-xs">
            {riskCategory === "HIGH" ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-red-700 text-sm">&bull;</span>
                  <span><b>Tertiary Referral:</b> Fast-track appointment at GMCH Guwahati / RIMS Imphal Orthopedic Department for radiographic Kellgren-Lawrence staging.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-red-700 text-sm">&bull;</span>
                  <span><b>Viscosupplementation & Pain Management:</b> Evaluate candidate suitability for intra-articular hyaluronic acid or corticosteroid infiltration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-red-700 text-sm">&bull;</span>
                  <span><b>Terrain Unloading:</b> Provide supportive unloader knee brace and walking aid to alleviate steep terrace farming stress.</span>
                </li>
              </>
            ) : riskCategory === "MODERATE" ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-amber-700 text-sm">&bull;</span>
                  <span><b>Community Physiotherapy:</b> Supervised isometric quadriceps strengthening and hamstring stretching 4 times weekly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-amber-700 text-sm">&bull;</span>
                  <span><b>Weight Management & Ergonomics:</b> Recommend joint-friendly seated workstations during agricultural sorting/tea garden duties.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-amber-700 text-sm">&bull;</span>
                  <span><b>Quarterly ASHA Telemetry:</b> Repeat 30s chair stand and SandhiBand acoustic crepitus re-evaluation in 90 days.</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700 text-sm">&bull;</span>
                  <span><b>Preventive Joint Health:</b> Maintain regular low-impact aerobic walking and aquatic/cycling exercises.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700 text-sm">&bull;</span>
                  <span><b>Dietary & Hydration Education:</b> Anti-inflammatory diet rich in calcium and vitamin D suited to North Eastern regional cuisine.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700 text-sm">&bull;</span>
                  <span><b>Annual Health Check:</b> Schedule routine community screening in 12 months.</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* MANDATORY GUARDRAIL: CLINICAL DISCLAIMER */}
        <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4.5 text-amber-900 flex items-start gap-3 shadow-xs">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              Mandatory Clinical Screening Guardrail
            </p>
            <p className="text-xs text-amber-900 mt-1 leading-relaxed">
              Sandy AI is an AI-assisted early risk screening tool, not a definitive medical diagnosis. If your risk is moderate or high, consult a qualified Orthopedic Specialist or Medical Officer for clinical examination and confirmatory radiographic imaging (X-ray).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-slate-300 px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            ← Home Portal
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                localStorage.removeItem("sandhi_patient")
                localStorage.removeItem("sandhi_womac")
                localStorage.removeItem("sandhi_movement")
                navigate("/registration")
              }}
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
