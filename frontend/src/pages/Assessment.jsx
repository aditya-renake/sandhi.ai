import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"

export default function Assessment() {
  const navigate = useNavigate()

  const [painLevel, setPainLevel] = useState("3") // 0 to 5
  const [morningStiffnessMins, setMorningStiffnessMins] = useState("20")
  const [squatDifficulty, setSquatDifficulty] = useState("severe")
  const [stairDifficulty, setStairDifficulty] = useState("moderate")
  const [audibleCracking, setAudibleCracking] = useState("yes")

  const handleSubmit = (e) => {
    e.preventDefault()
    const assessment = {
      painLevel,
      morningStiffnessMins,
      squatDifficulty,
      stairDifficulty,
      audibleCracking
    }
    localStorage.setItem("sandhi_symptoms", JSON.stringify(assessment))
    navigate("/movement")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl p-4 md:p-8">
        
        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 2 of 4 &bull; Clinical WOMAC Index</span>
          <h1 className="mt-1 text-2xl md:text-3xl font-black text-slate-900">
            Clinical Joint Symptoms & Functional Impairment
          </h1>
          <p className="text-sm text-slate-500">
            Standardized Western Ontario and McMaster Universities Osteoarthritis (WOMAC) Index
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
          
          {/* Question 1: Pain Level */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-800">
                1. Knee Pain Severity during weight-bearing activities (VAS 0 - 10)
              </label>
              <span className="font-mono font-bold text-teal-700 text-sm">{painLevel}/10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={painLevel}
              onChange={(e) => setPainLevel(e.target.value)}
              className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0 (No Pain)</span>
              <span>5 (Moderate Pain)</span>
              <span>10 (Severe / Debilitating)</span>
            </div>
          </div>

          {/* Question 2: Morning Stiffness */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <label className="block text-xs font-bold text-slate-800 mb-2">
              2. Duration of Morning Joint Stiffness (Minutes)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: "5", label: "< 15 mins (Mild)" },
                { val: "20", label: "15 - 30 mins (Typical OA)" },
                { val: "45", label: "> 30 mins (Severe/Inflammatory)" }
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setMorningStiffnessMins(opt.val)}
                  className={`p-3 rounded-lg border text-xs font-semibold text-center transition cursor-pointer ${
                    morningStiffnessMins === opt.val
                      ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Deep Squatting & Chores */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <label className="block text-xs font-bold text-slate-800 mb-2">
              3. Difficulty with Deep Squatting (Household Chores / Tea Picking)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["None", "Mild", "Moderate", "Severe"].map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setSquatDifficulty(level.toLowerCase())}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition cursor-pointer ${
                    squatDifficulty === level.toLowerCase()
                      ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Question 4: Walking on Hilly Slopes / Stairs */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <label className="block text-xs font-bold text-slate-800 mb-2">
              4. Difficulty Descending / Ascending Hilly Slopes & Steps
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["None", "Mild", "Moderate", "Severe"].map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setStairDifficulty(level.toLowerCase())}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition cursor-pointer ${
                    stairDifficulty === level.toLowerCase()
                      ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Question 5: Audible Crepitus */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <label className="block text-xs font-bold text-slate-800 mb-2">
              5. Sensation or Sound of Grating / Cracking (Crepitus) in the Joint?
            </label>
            <div className="flex gap-4">
              {[
                { val: "yes", label: "Yes (Frequent Clicking or Grinding)" },
                { val: "no", label: "No (Smooth / Silent)" }
              ].map((opt) => (
                <label key={opt.val} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="crepitus"
                    value={opt.val}
                    checked={audibleCracking === opt.val}
                    onChange={() => setAudibleCracking(opt.val)}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/registration")}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              ← Back to Demographics
            </button>

            <button
              type="submit"
              className="rounded-xl bg-teal-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Step 3: Camera CV</span>
              <span>→</span>
            </button>
          </div>

        </form>

      </main>
    </div>
  )
}
