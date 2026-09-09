import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"

export default function Dashboard() {
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState("clinical_queue") // 'clinical_queue', 'hardware_showcase', 'asha_field', 'ner_analytics'
  const [portalMode, setPortalMode] = useState("doctor") // 'doctor' or 'asha'

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

  // Clinical Queue Data (seeded patients from backend / PDF specification)
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
              {portalMode === "doctor" ? "Clinical Triaging & Tele-Rheumatology Hub" : "Community OA Screening & Field Operations"}
            </h1>
            <p className="text-sm text-slate-500">
              Early detection system for Osteoarthritis risk markers tailored for North Eastern Region communities
            </p>
          </div>

          <div className="flex items-center gap-3">
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
              <span>High Risk Alerts</span>
              <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">Action Required</span>
            </div>
            <p className="mt-2 text-3xl font-black text-red-600 font-mono">142</p>
            <p className="mt-1 text-xs text-red-600 font-medium">9.5% urgent specialist referrals</p>
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
              <span>Sync Status</span>
              <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Supabase PostgreSQL</span>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 font-mono">100%</p>
            <p className="mt-1 text-xs text-slate-500">Zero offline backlog</p>
          </div>
        </div>

        {/* TABS (PDF Checklist Item 5) */}
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
                    <th className="p-3.5">SandhiBand VAG Bursts</th>
                    <th className="p-3.5">KL Proxy</th>
                    <th className="p-3.5">Risk Score</th>
                    <th className="p-3.5">Clinical Referral Status</th>
                    <th className="p-3.5 text-right">Actions</th>
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
                        <p className="text-slate-500">{item.district}</p>
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
                        <p className="text-[10px] text-slate-400">Piezo Transducer</p>
                      </td>

                      <td className="p-3.5">
                        <span className="rounded bg-teal-50 border border-teal-200 px-2 py-0.5 font-bold text-teal-800">
                          {item.klGrade}
                        </span>
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
                        <span className="text-[10px] text-slate-400">{item.date}</span>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => navigate("/results", { state: { compositeScore: item.compositeScore, patientName: item.patientName, abhaId: item.abhaId } })}
                          className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white hover:bg-teal-800 transition cursor-pointer"
                        >
                          Review & Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: 3D CAD & WOKWI HARDWARE SHOWCASE (PDF Checklist Item 5) */}
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
                {/* 3D CAD Schematic Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-950 p-5 text-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-teal-400 font-mono mb-3">
                      <span>3D CAD ASSEMBLY</span>
                      <span>AUTODESK / STEP</span>
                    </div>
                    {/* Visual representation of 3D CAD band */}
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

                {/* Circuit Specifications */}
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

                {/* Wokwi Wiring Pinout Table */}
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

        {/* TAB 3: ASHA FIELD PROTOCOL */}
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

        {/* TAB 4: REGIONAL NER ANALYTICS */}
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
