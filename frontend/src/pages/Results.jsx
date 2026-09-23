import { useState, useEffect, useRef } from "react"
import { addScreening } from "../utils/screeningsStore"
import { useNavigate, useLocation } from "react-router-dom"
import Navbar from "../components/Navbar"
import ScreeningStepper from "../components/ScreeningStepper"
import { updateScreeningStep } from "../utils/supabaseClient"
import { 
  HeartPulse, 
  CheckCircle2, 
  Printer, 
  PhoneCall, 
  ArrowRight, 
  Building2, 
  Activity, 
  Clock, 
  Smile, 
  HelpCircle,
  AlertTriangle
} from "lucide-react"

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
    district: "Kamrup",
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
        age: Number(patient.age) || 58,
        gender: patient.gender || "Female",
        phone: patient.phone || "+91 98640 12000",
        state: patient.state || "Assam",
        district: patient.district || "Kamrup",
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
    updateScreeningStep(4, { compositeScore, riskCategory, klProxy }, compositeScore)
    setSynced(true)
  }, [compositeScore, riskCategory, klProxy, womacScore, reps, rom, alignmentRatio, varusValgus, burstCount, peakFrequency, patient])

  const [downloading, setDownloading] = useState(false)

  const handleDownloadPDF = () => {
    setDownloading(true)
    setTimeout(() => {
      window.print()
      setDownloading(false)
    }, 300)
  }

  // Friendly title & text based on risk
  const isLow = riskCategory === "LOW"
  const isModerate = riskCategory === "MODERATE"
  const isHigh = riskCategory === "HIGH"

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-teal-100 selection:text-teal-900 pb-20">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Stepper with step 4 */}
      <ScreeningStepper currentStep={4} />

      <main className="mx-auto max-w-4xl p-4 sm:p-6 md:p-8 space-y-6">
        
        {/* Patient Bar & Print Button */}
        <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-200">
              Knee Health Summary & Report
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Report for {patient.name || "Patient"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {patient.age || 58} years &bull; {patient.gender || "Female"} &bull; {patient.joint || "Right Knee"} &bull; {patient.state || "Assam"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl border border-teal-600 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-2xs transition"
          >
            <Printer size={16} className="text-teal-700" />
            <span>{downloading ? "Preparing..." : "Print / Save PDF"}</span>
          </button>
        </div>

        {/* Big Reassuring Status Card */}
        <div className={`rounded-3xl p-6 sm:p-8 text-center border-2 shadow-xs ${
          isLow 
            ? "bg-emerald-50/70 border-emerald-300 text-emerald-950" 
            : isModerate 
            ? "bg-amber-50/80 border-amber-300 text-amber-950" 
            : "bg-rose-50/80 border-rose-300 text-rose-950"
        }`}>
          <div className="flex justify-center mb-3">
            <span className="text-4xl">
              {isLow ? "🟢" : isModerate ? "🟡" : "🔴"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black">
            {isLow 
              ? "Good News: Your Knees are in Healthy Shape!"
              : isModerate
              ? "Mild to Moderate Knee Joint Wear"
              : "Doctor Checkup Recommended for Your Knee"}
          </h2>

          <p className="mt-2 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            {isLow 
              ? "Your movement speed, bending range, and joint sounds show good joint mobility with little or no cartilage wear. Keep active with gentle daily walks!"
              : isModerate
              ? "You have some noticeable knee stiffness or discomfort during daily activities. Simple daily home exercises and leg strengthening will help protect your joints."
              : "Your test results indicate significant knee pain, restricted movement, or joint friction. We recommend consulting a doctor or visiting your local health center for an in-person knee exam."}
          </p>

          <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-2xs text-xs sm:text-sm font-bold text-slate-800">
            <span>Overall Score: <strong>{compositeScore} / 100</strong></span>
            <span>&bull;</span>
            <span>Joint Condition: <strong className={isLow ? "text-emerald-700" : isModerate ? "text-amber-700" : "text-rose-700"}>{riskCategory}</strong></span>
          </div>
        </div>

        {/* Plain Language Key Test Numbers */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            What Your Checkup Showed
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Chair Stands */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-teal-800 uppercase">30s Chair Stand</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{reps} reps</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {reps >= 10 ? "Great leg muscle power" : reps >= 6 ? "Moderate leg strength" : "Leg muscles need gentle strengthening"}
              </p>
            </div>

            {/* Bending Range */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-teal-800 uppercase">Knee Bending</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{rom}°</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {rom >= 105 ? "Smooth full flexibility" : rom >= 80 ? "Slight tightness when bending" : "Noticeable bending stiffness"}
              </p>
            </div>

            {/* Joint Sounds */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-teal-800 uppercase">Joint Sounds</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{burstCount} clicks</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {burstCount <= 2 ? "Quiet, smooth joint" : burstCount <= 4 ? "Mild occasional popping" : "Frequent joint friction"}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Concrete Daily Home Care & Exercise Steps for Seniors */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div>
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">
              Daily Care for Seniors
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              4 Simple Habits to Protect Your Knees Every Day
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Habit 1 */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex items-start gap-3.5">
              <span className="text-2xl">🪑</span>
              <div>
                <h4 className="text-sm font-bold text-teal-950">Seated Knee Straightening</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  Sit comfortably in a chair. Slowly raise and straighten one leg out in front of you. Hold for 5 seconds, then gently lower it. Repeat 10 times on each leg.
                </p>
              </div>
            </div>

            {/* Habit 2 */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex items-start gap-3.5">
              <span className="text-2xl">🚶</span>
              <div>
                <h4 className="text-sm font-bold text-teal-950">15 Minutes of Gentle Walking</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  Walking on flat, even ground helps produce natural joint fluid that cushions your cartilage. Avoid steep steps or rough ground if your knee aches.
                </p>
              </div>
            </div>

            {/* Habit 3 */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex items-start gap-3.5">
              <span className="text-2xl">♨️</span>
              <div>
                <h4 className="text-sm font-bold text-teal-950">Warm Compress for Morning Stiffness</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  If your knees feel tight when waking up, apply a warm towel or warm water bag for 10 minutes to relax muscles and improve circulation.
                </p>
              </div>
            </div>

            {/* Habit 4 */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex items-start gap-3.5">
              <span className="text-2xl">👟</span>
              <div>
                <h4 className="text-sm font-bold text-teal-950">Comfortable Footwear & Support</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  Wear soft, flat footwear with a good cushioned sole and grip. Always use handrails when walking up or down stairs.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Doctor Consultation & Hospital Referral Guidance */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                When Should You See a Doctor?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                Consult a medical officer, orthopedic doctor, or visit your local Primary Health Center (PHC) if:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700 list-disc list-inside">
                <li>Your knee suddenly becomes swollen, red, or warm to the touch.</li>
                <li>You feel sharp, unbearable pain that prevents you from putting any weight on your leg.</li>
                <li>Your knee gives way or feels like it is locking up when you try to walk.</li>
              </ul>
            </div>
          </div>

          {/* Tertiary Centers Mention */}
          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            For advanced clinical care in the North East, you can consult orthopedic departments at <b>GMCH Guwahati</b>, <b>NEIGRIHMS Shillong</b>, or <b>RIMS Imphal</b>.
          </div>
        </div>

        {/* Help & Helpline card */}
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhoneCall size={22} className="text-amber-800" />
            <div>
              <p className="text-sm font-bold text-amber-950">
                Have questions or need someone to explain your results?
              </p>
              <p className="text-xs text-amber-900">
                You can call our toll-free patient line: <b>1800-103-6004</b> (Monday to Saturday, 9 AM – 6 PM).
              </p>
            </div>
          </div>

          <a
            href="tel:18001036004"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-2xs"
          >
            Call Support Now
          </a>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/screening")}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-sm cursor-pointer shadow-2xs transition"
          >
            ← Return to Screening Hub
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
          >
            <span>Doctor / Clinic View</span>
            <ArrowRight size={16} />
          </button>
        </div>

      </main>

    </div>
  )
}
