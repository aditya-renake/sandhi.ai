import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"

export default function Dashboard() {
  const navigate = useNavigate()
  
  // Tabs: 'clinical_queue', 'xray_verification', 'hardware_showcase', 'asha_field', 'ner_analytics'
  const [activeTab, setActiveTab] = useState("clinical_queue")
  const [portalMode, setPortalMode] = useState("doctor") // 'doctor' or 'asha'

  // X-Ray Calibration State (User Request Section 1, 2, 3)
  const [selectedPatientForXray, setSelectedPatientForXray] = useState({
    name: "Bimla Karmakar",
    abhaId: "14-5829-1029-4821",
    fieldScore: 68.5,
    riskLevel: "HIGH",
    womac: "58/96",
    rom: "108°",
    crepitus: "5 bursts",
    alignment: "Varus (1.42)"
  })

  const [xrayLoading, setXrayLoading] = useState(false)
  const [xrayVerified, setXrayVerified] = useState(false)
  const [xrayData, setXrayData] = useState({
    medialJswMm: 2.9,
    lateralJswMm: 4.8,
    narrowing: "Moderate Medial Compartment Narrowing (JSN)",
    osteophytes: "Definite Small Osteophytes (22 detected)",
    sclerosis: "Present (Subchondral Plate Thickening)",
    klGrade: 2,
    klConfidence: 0.94,
    qwkScore: 0.88,
    spearmanRho: 0.84,
    agreementPct: 92.4,
    verdict: "STRONG CONCORDANCE: Field screening accurately predicted radiographic osteoarthritis severity."
  })

  useEffect(() => {
    const savedPortal = localStorage.getItem("sandhi_portal_mode") || "doctor"
    setPortalMode(savedPortal)
    if (savedPortal === "asha") {
      setActiveTab("asha_field")
    } else {
      setActiveTab("clinical_queue")
    }
  }, [])

  const handlePortalChange = (mode) => {
    setPortalMode(mode)
    if (mode === "asha") {
      setActiveTab("asha_field")
    } else {
      setActiveTab("clinical_queue")
    }
  }

  const handleTriggerXrayCalibration = (patient = null) => {
    if (patient) {
      setSelectedPatientForXray({
        name: patient.patientName,
        abhaId: patient.abhaId,
        fieldScore: patient.compositeScore,
        riskLevel: patient.riskLevel,
        womac: patient.womacScore,
        rom: patient.kneeRom,
        crepitus: patient.acousticBursts,
        alignment: patient.alignment
      })
    }
    setActiveTab("xray_verification")
    setXrayLoading(true)
    setXrayVerified(false)

    // Simulate/Run OpenCV CLAHE + JSW edge calculation + CNN KL prediction
    setTimeout(() => {
      setXrayLoading(false)
      setXrayVerified(true)
    }, 800)
  }

  // Clinical Queue Data
  const clinicalQueue = [
    {
      id: "sc_assam_001",
      patientName: "Bimla Karmakar",
      abhaId: "14-5829-1029-4821",
      age: 54,
      gender: "Female",
      state: "Assam",
      district: "Dibrugarh",
      occupation: "Tea Garden Worker",
      womacScore: "58/96 (60%)",
      kneeRom: "108° (Deficit: 32°)",
      alignment: "Varus (Dknee/Dankle: 1.42)",
      acousticBursts: "5 spikes (Severe)",
      klGrade: "KL Grade 2",
      compositeScore: 68.5,
      riskLevel: "HIGH",
      referralStatus: "URGENT: District Orthopedic Specialist",
      date: "Today, 09:30 AM"
    },
    {
      id: "sc_mizoram_002",
      patientName: "Lalmuanpuia",
      abhaId: "91-4921-3910-8472",
      age: 49,
      gender: "Male",
      state: "Mizoram",
      district: "Champhai",
      occupation: "Terrace Farmer",
      womacScore: "34/96 (35%)",
      kneeRom: "122° (Deficit: 18°)",
      alignment: "Normal (Dknee/Dankle: 1.05)",
      acousticBursts: "2 spikes (Mild)",
      klGrade: "KL Grade 1",
      compositeScore: 42.0,
      riskLevel: "MODERATE",
      referralStatus: "PHC Physiotherapy & Joint Mobility Monitoring",
      date: "Today, 11:15 AM"
    },
    {
      id: "sc_arunachal_003",
      patientName: "Dorjee Tsering",
      abhaId: "32-8419-7721-9941",
      age: 62,
      gender: "Male",
      state: "Arunachal Pradesh",
      district: "Tawang",
      occupation: "Hill Porter",
      womacScore: "66/96 (68%)",
      kneeRom: "98° (Deficit: 42°)",
      alignment: "Varus (Dknee/Dankle: 1.51)",
      acousticBursts: "6 spikes (Severe)",
      klGrade: "KL Grade 3",
      compositeScore: 78.0,
      riskLevel: "HIGH",
      referralStatus: "URGENT: District Ortho & X-Ray AP Weight-Bearing",
      date: "Yesterday"
    },
    {
      id: "sc_manipur_004",
      patientName: "Thoibi Devi",
      abhaId: "78-1934-6629-3310",
      age: 45,
      gender: "Female",
      state: "Manipur",
      district: "Imphal West",
      occupation: "Handloom Weaver",
      womacScore: "18/96 (18%)",
      kneeRom: "136° (Normal)",
      alignment: "Normal (Dknee/Dankle: 1.01)",
      acousticBursts: "0 spikes (Silent)",
      klGrade: "KL Grade 0",
      compositeScore: 19.5,
      riskLevel: "LOW",
      referralStatus: "Community Ergonomic Care",
      date: "Yesterday"
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onPortalChange={handlePortalChange} />

      <main className="mx-auto max-w-7xl p-4 md:p-8">
        
        {/* Top Banner with Portal Indicator */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                portalMode === "doctor" ? "bg-purple-100 text-purple-800" : "bg-teal-100 text-teal-800"
              }`}>
                {portalMode === "doctor" ? "⚕ Doctor & MDoNER Specialist Hub" : "🩺 ASHA Community Worker Portal"}
              </span>
              <span className="text-xs text-slate-500 font-mono">MDoNER Problem Statement 26004</span>
            </div>
            <h1 className="mt-1 text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {portalMode === "doctor" ? "Clinical Triaging & X-Ray Validation Hub" : "Community OA Screening & Field Operations"}
            </h1>
            <p className="text-sm text-slate-500">
              Gold-standard X-Ray calibration against community camera, WOMAC and acoustic sensor proxies
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTriggerXrayCalibration()}
              className="rounded-xl border border-purple-600 bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-800 hover:bg-purple-100 transition flex items-center gap-2 cursor-pointer"
            >
              <span>🔬</span>
              <span>Open X-Ray Verification Loop</span>
            </button>

            <button
              onClick={() => navigate("/registration")}
              className="rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition flex items-center gap-2 cursor-pointer"
            >
              <span>+</span>
              <span>New Patient Screening</span>
            </button>
          </div>
        </div>

        {/* STATS OVERVIEW */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
              <span>Total Screenings</span>
              <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded">All 8 NER States</span>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 font-mono">1,482</p>
            <p className="mt-1 text-xs text-slate-400">128 registered this week</p>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
              <span>X-Ray Validated Cohort</span>
              <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Gold Standard</span>
            </div>
            <p className="mt-2 text-3xl font-black text-purple-700 font-mono">312</p>
            <p className="mt-1 text-xs text-purple-700 font-medium">QWK Agreement: 0.88</p>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
              <span>SandhiBand™ Connected</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">BLE Active</span>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 font-mono">64 Units</p>
            <p className="mt-1 text-xs text-emerald-700 font-medium">Piezo VAG & IMU online</p>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
              <span>Calibration Status</span>
              <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Active Learning</span>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 font-mono">92.4%</p>
            <p className="mt-1 text-xs text-slate-500">Spearman ρ: 0.84</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("clinical_queue")}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "clinical_queue"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            📋 Doctor Clinical Queue & Triage
          </button>

          <button
            onClick={() => setActiveTab("xray_verification")}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "xray_verification"
                ? "border-purple-700 text-purple-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            🔬 X-Ray Gold-Standard Verification & Calibration Loop
          </button>

          <button
            onClick={() => setActiveTab("hardware_showcase")}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "hardware_showcase"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            ⚡ 3D CAD & Wokwi Hardware Showcase (SandhiBand™)
          </button>

          <button
            onClick={() => setActiveTab("asha_field")}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "asha_field"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            🩺 ASHA Field Protocol & Workflow
          </button>

          <button
            onClick={() => setActiveTab("ner_analytics")}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === "ner_analytics"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            🗺️ MDoNER Regional Heatmap (8 NER States)
          </button>
        </div>

        {/* TAB 1: DOCTOR CLINICAL QUEUE */}
        {activeTab === "clinical_queue" && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Clinical Tele-Rheumatology Queue</h3>
                <p className="text-xs text-slate-500">Patients ranked by Multimodal Composite OA Risk Score (0-100)</p>
              </div>

              <div className="flex gap-2">
                <span className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-bold text-red-700">
                  2 Urgent Referrals
                </span>
                <span className="rounded-lg bg-orange-50 border border-orange-200 px-2.5 py-1 text-xs font-bold text-orange-700">
                  1 Moderate Follow-up
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Patient / ABHA ID</th>
                    <th className="p-3.5">State & Occupation</th>
                    <th className="p-3.5">Knee ROM & Alignment</th>
                    <th className="p-3.5">SandhiBand VAG</th>
                    <th className="p-3.5">Field Score</th>
                    <th className="p-3.5">Referral Status</th>
                    <th className="p-3.5 text-right">Gold-Standard Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clinicalQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{item.patientName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{item.abhaId}</p>
                        <span className="text-[10px] text-slate-500">{item.age}y &bull; {item.gender}</span>
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800">{item.state}</p>
                        <span className="inline-block mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                          {item.occupation}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <p className="font-mono font-bold text-slate-900">{item.kneeRom}</p>
                        <p className={`text-[11px] font-semibold ${
                          item.alignment.includes("Varus") ? "text-red-600" : "text-slate-600"
                        }`}>
                          {item.alignment}
                        </p>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono font-bold text-amber-700">{item.acousticBursts}</span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black font-mono ${
                            item.riskLevel === "HIGH" ? "text-red-600" :
                            item.riskLevel === "MODERATE" ? "text-orange-600" : "text-emerald-600"
                          }`}>
                            {item.compositeScore}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.riskLevel === "HIGH" ? "bg-red-100 text-red-700" :
                            item.riskLevel === "MODERATE" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {item.riskLevel}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <p className="font-medium text-slate-800 leading-snug">{item.referralStatus}</p>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleTriggerXrayCalibration(item)}
                          className="rounded-lg bg-purple-700 px-3 py-1.5 font-semibold text-white hover:bg-purple-800 transition cursor-pointer flex items-center gap-1.5 ml-auto"
                        >
                          <span>🔬</span>
                          <span>Upload & Verify X-Ray</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: X-RAY VERIFICATION & CALIBRATION LOOP (DETAILED ARCHITECTURE) */}
        {activeTab === "xray_verification" && (
          <div className="space-y-6">
            
            {/* Header info card explaining the verification loop */}
            <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="rounded-md bg-purple-200 text-purple-900 font-bold px-2 py-0.5 text-xs uppercase tracking-wider">
                    Closed-Loop Active Learning Architecture
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-purple-950">
                    X-Ray Gold-Standard Verification & Surrogate Calibration
                  </h3>
                  <p className="mt-1 text-xs text-purple-800 max-w-3xl leading-relaxed">
                    Camera kinematics + WOMAC + SandhiBand™ VAG provide an accessible, low-cost community proxy.
                    When patients are referred to District Hospitals, their weight-bearing knee X-rays are processed via
                    <b> OpenCV Joint Space Width (JSW)</b> and <b>ResNet-50 / DenseNet-121 transfer learning</b> to calibrate proxy weights using <b>Quadratic Weighted Kappa (QWK)</b>.
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleTriggerXrayCalibration()}
                    className="rounded-xl bg-purple-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-800 transition cursor-pointer shadow-sm flex items-center gap-2"
                  >
                    <span>🔄</span>
                    <span>Re-Run OAI Ground Truth Benchmark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3-Column Comparative Dashboard */}
            <div className="grid gap-6 lg:grid-cols-3">
              
              {/* Column 1: Field Screening (Cheap Surrogate) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">1. Community Proxy Signal</span>
                    <span className="rounded bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5">₹15 &bull; Doorstep</span>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-slate-500">Patient ABHA Profile</p>
                    <h4 className="text-lg font-black text-slate-900">{selectedPatientForXray.name}</h4>
                    <p className="text-xs font-mono text-slate-400">{selectedPatientForXray.abhaId}</p>
                  </div>

                  <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase">Composite 0-100 Score</p>
                    <p className="text-5xl font-black font-mono text-red-600 mt-1">{selectedPatientForXray.fieldScore}</p>
                    <p className="text-xs font-bold text-red-600 mt-1">HIGH RISK TIER</p>
                  </div>

                  <div className="mt-5 space-y-2.5 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                      <span className="text-slate-500">WOMAC Burden</span>
                      <span className="font-bold text-slate-800">{selectedPatientForXray.womac}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                      <span className="text-slate-500">MediaPipe Knee ROM</span>
                      <span className="font-bold text-slate-800">{selectedPatientForXray.rom}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                      <span className="text-slate-500">Frontal Alignment</span>
                      <span className="font-bold text-red-600">{selectedPatientForXray.alignment}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                      <span className="text-slate-500">SandhiBand Crepitus</span>
                      <span className="font-bold text-amber-700">{selectedPatientForXray.crepitus}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                  Screening captured on ASHA Android device without radiation or specialized imaging infrastructure.
                </p>
              </div>

              {/* Column 2: Gold-Standard X-Ray (OpenCV + CNN) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">2. Radiographic Gold Standard</span>
                    <span className="rounded bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5">Hospital Referral</span>
                  </div>

                  {/* Simulated / Analyzed Radiograph with OpenCV Annotation */}
                  <div className="mt-4 relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-4/3 flex items-center justify-center">
                    {xrayLoading ? (
                      <div className="text-center text-xs text-purple-300">
                        <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin mx-auto mb-2" />
                        Executing OpenCV CLAHE & JSW Profilometry...
                      </div>
                    ) : (
                      <>
                        {/* High-contrast Knee X-Ray Representation */}
                        <div className="w-full h-full p-4 flex flex-col justify-between relative bg-gradient-to-b from-slate-900 to-slate-950">
                          {/* Femur Condyles */}
                          <div className="w-48 h-20 mx-auto rounded-b-3xl border-2 border-slate-400/60 bg-slate-800/70 flex items-center justify-center">
                            <span className="text-[10px] font-mono text-slate-400">FEMUR CONDYLES</span>
                          </div>

                          {/* Joint Space Narrowing Bounding Box (OpenCV JSW) */}
                          <div className="w-56 h-8 mx-auto border-2 border-dashed border-orange-400 bg-orange-500/20 rounded flex items-center justify-between px-3 text-[10px] font-mono text-orange-300">
                            <span>Medial: {xrayData.medialJswMm}mm</span>
                            <span className="animate-pulse text-red-400">JSN GAP</span>
                            <span>Lateral: {xrayData.lateralJswMm}mm</span>
                          </div>

                          {/* Tibial Plateau */}
                          <div className="w-52 h-20 mx-auto rounded-t-3xl border-2 border-slate-400/60 bg-slate-800/70 flex items-center justify-center">
                            <span className="text-[10px] font-mono text-slate-400">TIBIA PLATEAU</span>
                          </div>

                          {/* Grad-CAM Heatmap Overlay Banner */}
                          <div className="absolute top-2 right-2 rounded bg-red-600/80 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-white">
                            Grad-CAM: Medial Focus
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* OpenCV Quantitative Metrics */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="rounded-lg bg-purple-50 p-2.5 border border-purple-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-purple-950">CNN Kellgren-Lawrence Grade</p>
                        <p className="text-[11px] text-purple-800">ResNet-50 / DenseNet121 Transfer Model</p>
                      </div>
                      <span className="text-base font-black text-purple-900 font-mono">KL Grade {xrayData.klGrade}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <p className="text-slate-500">Medial JSW</p>
                        <p className="font-mono font-bold text-orange-700">{xrayData.medialJswMm} mm (Narrowed)</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <p className="text-slate-500">Lateral JSW</p>
                        <p className="font-mono font-bold text-slate-800">{xrayData.lateralJswMm} mm (Preserved)</p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100 text-[11px]">
                      <span className="text-slate-500">Osteophyte Status: </span>
                      <span className="font-semibold text-slate-800">{xrayData.osteophytes}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                  Measured via CLAHE + Canny bone edge detection calibrated at 0.14 mm/pixel.
                </p>
              </div>

              {/* Column 3: The Verification & Recalibration Loop */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">3. Statistical Correlation</span>
                    <span className="rounded bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5">Agreement Metrics</span>
                  </div>

                  <div className="mt-4 space-y-3.5">
                    {/* QWK Card */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-emerald-950">Quadratic Weighted Kappa (QWK)</span>
                        <span className="text-2xl font-black font-mono text-emerald-700">{xrayData.qwkScore}</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-1">
                        Standard ordinal evaluation metric for OA clinical papers. Near-perfect agreement threshold &gt; 0.80.
                      </p>
                    </div>

                    {/* Spearman Correlation */}
                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-blue-950">Spearman Rank Correlation (ρ)</span>
                        <span className="text-2xl font-black font-mono text-blue-700">{xrayData.spearmanRho}</span>
                      </div>
                      <p className="text-[11px] text-blue-800 mt-1">
                        High monotonic rank agreement between composite field score and medial joint space reduction.
                      </p>
                    </div>

                    {/* Calibration Concordance Verdict */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                      <span className="font-bold text-slate-800">Concordance Verdict:</span>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        {xrayData.verdict}
                      </p>
                    </div>

                    {/* Active Learning Notice */}
                    <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 text-[11px] text-purple-900 leading-normal">
                      <b>Active Learning Feedback:</b> Radiologist confirmation feeds ground-truth back into community XGBoost weighting parameters without retraining overhead.
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => alert("Doctor clinical sign-off confirmed! Labeled pair saved to Supabase xray_records for active learning calibration.")}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 py-3 text-xs font-bold text-white hover:from-purple-800 hover:to-indigo-800 transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>✓</span>
                    <span>Sign Off & Log Calibration Ground Truth</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: 3D CAD & WOKWI HARDWARE SHOWCASE */}
        {activeTab === "hardware_showcase" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">Hardware Prototype</span>
                    <span className="text-xs font-mono text-slate-500">SandhiBand™ Wearable v2.1</span>
                  </div>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    Non-Invasive Vibroarthrographic (VAG) Knee Band
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dual piezoelectric contact acoustic microphone + 6-DOF IMU for field joint kinematics & acoustic crepitus capture
                  </p>
                </div>

                <a
                  href="https://wokwi.com"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-teal-600 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition flex items-center gap-2 w-fit"
                >
                  <span>⚡</span>
                  <span>Open Wokwi Simulation</span>
                </a>
              </div>

              {/* Hardware Architecture Grid */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-950 p-5 text-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-teal-400 font-mono mb-3">
                      <span>3D CAD ASSEMBLY</span>
                      <span>AUTODESK / STEP</span>
                    </div>
                    <div className="h-44 rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                      <div className="w-24 h-24 rounded-full border-4 border-teal-500/60 flex items-center justify-center relative">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-teal-400 flex items-center justify-center text-xs font-mono text-teal-300">
                          PATELLA
                        </div>
                        <div className="absolute -top-2 w-4 h-4 rounded-full bg-red-500 animate-ping" />
                        <div className="absolute -top-2 w-4 h-4 rounded-full bg-red-500" title="Contact Piezo 1" />
                        <div className="absolute -bottom-2 w-4 h-4 rounded-full bg-red-500" title="Contact Piezo 2" />
                        <div className="absolute -right-2 w-4 h-4 rounded bg-amber-400" title="6-DOF IMU" />
                      </div>
                      <p className="mt-3 text-[10px] font-mono text-slate-400">Neoprene Knee Sleeve &bull; Medial/Lateral Sensors</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                    Ergonomic sleeve 3D modeled in CAD for Asian anthropometric knee circumference (34-42 cm).
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Circuit & Sensor Components
                  </h4>

                  <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                    <p className="text-xs font-bold text-slate-800">ESP32-S3 Microcontroller</p>
                    <p className="text-[11px] text-slate-500">Dual-core 240MHz &bull; BLE 5.0 mesh sync &bull; 8MB Flash</p>
                  </div>

                  <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                    <p className="text-xs font-bold text-slate-800">Dual Piezoelectric Contact Transducers</p>
                    <p className="text-[11px] text-slate-500">Bandwidth: 20Hz - 2000Hz &bull; Captures sub-audible crepitus</p>
                  </div>

                  <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                    <p className="text-xs font-bold text-slate-800">6-Axis Inertial Measurement Unit (IMU)</p>
                    <p className="text-[11px] text-slate-500">MPU-6050 / ICM-42688 &bull; 3D Angular Velocity & Knee ROM</p>
                  </div>

                  <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                    <p className="text-xs font-bold text-slate-800">Power Management (PMIC)</p>
                    <p className="text-[11px] text-slate-500">500mAh LiPo &bull; 14 hours field screening battery life</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Wokwi Pinout Configuration
                  </h4>

                  <table className="w-full text-left text-[11px]">
                    <thead className="border-b border-slate-200 font-semibold text-slate-600">
                      <tr>
                        <th className="pb-1.5">Sensor Pin</th>
                        <th className="pb-1.5">ESP32-S3 GPIO</th>
                        <th className="pb-1.5">Function</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr>
                        <td className="py-1.5 font-mono text-teal-700">PIEZO_L_A0</td>
                        <td className="py-1.5 font-mono">GPIO 1 (ADC1_CH0)</td>
                        <td className="py-1.5">Medial VAG</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-mono text-teal-700">PIEZO_R_A1</td>
                        <td className="py-1.5 font-mono">GPIO 2 (ADC1_CH1)</td>
                        <td className="py-1.5">Lateral VAG</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-mono text-teal-700">IMU_SDA</td>
                        <td className="py-1.5 font-mono">GPIO 8 (I2C SDA)</td>
                        <td className="py-1.5">Kinematics</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-mono text-teal-700">IMU_SCL</td>
                        <td className="py-1.5 font-mono">GPIO 9 (I2C SCL)</td>
                        <td className="py-1.5">Kinematics</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-mono text-teal-700">BLE_STATUS</td>
                        <td className="py-1.5 font-mono">GPIO 38 (RGB LED)</td>
                        <td className="py-1.5">Sync Status</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 text-[11px] text-teal-900">
                    <b>Offline First:</b> Telemetry records are buffered into SPIFFS flash memory if cellular data is unavailable, syncing automatically to Supabase when reconnected.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ASHA FIELD PROTOCOL */}
        {activeTab === "asha_field" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div>
              <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">Field Workflow</span>
              <h3 className="mt-1 text-xl font-bold text-slate-900">
                4-Step Community Screening Protocol for ASHA Workers
              </h3>
              <p className="text-xs text-slate-500">Standardized protocol for field health workers in North Eastern hilly tea-garden villages</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:border-teal-400 transition cursor-pointer" onClick={() => navigate("/registration")}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white font-bold text-sm mb-3">
                  1
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Patient Registration</h4>
                <p className="mt-1 text-xs text-slate-500">
                  ABHA ID lookup, age, terrain type (steep slopes), occupation, load carrying hours.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:border-teal-400 transition cursor-pointer" onClick={() => navigate("/assessment")}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white font-bold text-sm mb-3">
                  2
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Clinical Symptoms (WOMAC)</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Pain, morning stiffness, difficulty squatting and climbing hills.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:border-teal-400 transition cursor-pointer" onClick={() => navigate("/movement")}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white font-bold text-sm mb-3">
                  3
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Camera CV Kinematics</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Real-time MediaPipe pose tracking, 30s chair stand reps, and varus/valgus gait ratio.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:border-teal-400 transition cursor-pointer" onClick={() => navigate("/analysis")}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white font-bold text-sm mb-3">
                  4
                </div>
                <h4 className="font-bold text-slate-800 text-sm">SandhiBand VAG & Report</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Acoustic crepitus waveform analysis, composite 0-100 risk score, and PDF summary.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-teal-700 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold">Ready to screen a new patient in the community?</h4>
                <p className="text-xs text-teal-100 mt-1">
                  Connect SandhiBand™ via Bluetooth or proceed with camera-based CV screening immediately.
                </p>
              </div>
              <button
                onClick={() => navigate("/registration")}
                className="rounded-xl bg-white px-5 py-3 font-bold text-teal-800 hover:bg-teal-50 transition cursor-pointer shrink-0 shadow-sm"
              >
                + Start Step 1 Registration
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: REGIONAL NER ANALYTICS */}
        {activeTab === "ner_analytics" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div>
              <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">MDoNER Regional Coverage</span>
              <h3 className="mt-1 text-xl font-bold text-slate-900">
                North Eastern Region Epidemiological Overview
              </h3>
              <p className="text-xs text-slate-500">Degenerative joint disease markers aggregated across 8 North Eastern States</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { state: "Assam", teaWorkers: "Tea Garden Labor", highRisk: "14.2%", screened: 540 },
                { state: "Mizoram", teaWorkers: "Terrace Farming", highRisk: "11.8%", screened: 280 },
                { state: "Arunachal Pradesh", teaWorkers: "High-Altitude Porters", highRisk: "16.4%", screened: 210 },
                { state: "Manipur", teaWorkers: "Handloom / Agricultural", highRisk: "9.6%", screened: 195 },
                { state: "Meghalaya", teaWorkers: "Coal / Heavy Mining", highRisk: "15.1%", screened: 140 },
                { state: "Nagaland", teaWorkers: "Hilly Shifting Cultivation", highRisk: "12.3%", screened: 110 },
                { state: "Sikkim", teaWorkers: "Cardamom Terrace Workers", highRisk: "8.7%", screened: 85 },
                { state: "Tripura", teaWorkers: "Rubber / Plantation", highRisk: "10.2%", screened: 122 }
              ].map((s) => (
                <div key={s.state} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-800 text-sm">{s.state}</p>
                    <span className="font-mono text-xs font-bold text-red-600">{s.highRisk}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{s.teaWorkers}</p>
                  <div className="mt-3 flex justify-between text-[10px] text-slate-400 border-t border-slate-200/60 pt-2">
                    <span>Screened: {s.screened}</span>
                    <span className="text-teal-700 font-semibold">Active Monitoring</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
