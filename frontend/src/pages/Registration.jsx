import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"

export default function Registration() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    abhaId: "14-5829-1029-4821",
    fullName: "Bimla Karmakar",
    age: "54",
    gender: "female",
    phone: "+91 94351 28941",
    state: "Assam",
    district: "Dibrugarh",
    village: "Tinkhong Tea Estate",
    height: "152",
    weight: "64",
    occupation: "Tea Garden Worker",
    steepSlopeWalking: true,
    heavyLoadCarrying: true,
    priorJointInjury: "yes",
    familyHistoryOA: "yes"
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    localStorage.setItem("sandhi_registered_patient", JSON.stringify(formData))
    navigate("/assessment")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl p-4 md:p-8">
        
        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 1 of 4 &bull; Community Ingestion</span>
          <h1 className="mt-1 text-2xl md:text-3xl font-black text-slate-900">
            Patient Demographics & Occupational Risk Factors
          </h1>
          <p className="text-sm text-slate-500">
            ABHA Health ID integration with North Eastern Region terrain and load-carrying profiling
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-xs space-y-8">
          
          {/* Section 1: ABHA & Identity */}
          <div>
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Identity & North Eastern Region Geography
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  ABHA Health ID (Ayushman Bharat)
                </label>
                <input
                  type="text"
                  name="abhaId"
                  value={formData.abhaId}
                  onChange={handleChange}
                  required
                  placeholder="14-XXXX-XXXX-XXXX"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs font-mono outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  NER State
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-teal-600"
                >
                  <option value="Assam">Assam</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tripura">Tripura</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  District & Village / Tea Estate
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="e.g. Dibrugarh, Tinkhong"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Biometrics */}
          <div>
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Biometric Parameters
            </h3>

            <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-teal-600"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs outline-none focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Occupational & Terrain Stressors (Page 6 Schema) */}
          <div>
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Occupational & Terrain Stressors (MDoNER PS 26004)
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Primary Occupation
                </label>
                <select
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-teal-600"
                >
                  <option value="Tea Garden Worker">Tea Garden Worker (Plucker / Labor)</option>
                  <option value="Terrace Farmer">Hilly Terrace Farmer (Shifting Cultivation)</option>
                  <option value="Hill Porter">High-Altitude Hill Porter / Load Carrier</option>
                  <option value="Handloom Weaver">Handloom Weaver (Repetitive Knee Treadle)</option>
                  <option value="Domestic Chores">Rural Household / Fuelwood Fetching</option>
                  <option value="Sedentary">Sedentary / Office Worker</option>
                </select>
              </div>

              <div className="flex flex-col justify-center gap-2 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="steepSlopeWalking"
                    checked={formData.steepSlopeWalking}
                    onChange={handleChange}
                    className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <span>Regular Steep Slope / Foothills Walking (&gt;3 hrs/day)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="heavyLoadCarrying"
                    checked={formData.heavyLoadCarrying}
                    onChange={handleChange}
                    className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <span>Daily Heavy Load Carrying (&gt;15 kg head/back load)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Prior History */}
          <div>
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Clinical & Family Risk
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Prior Joint Injury or Sprain?
                </label>
                <select
                  name="priorJointInjury"
                  value={formData.priorJointInjury}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-teal-600"
                >
                  <option value="yes">Yes (Previous Knee Trauma / Fall)</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Family History of Osteoarthritis?
                </label>
                <select
                  name="familyHistoryOA"
                  value={formData.familyHistoryOA}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-teal-600"
                >
                  <option value="yes">Yes (First-degree relative)</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-teal-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Step 2: WOMAC Symptoms</span>
              <span>→</span>
            </button>
          </div>

        </form>

      </main>
    </div>
  )
}
