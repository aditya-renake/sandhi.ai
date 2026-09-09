import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Assessment() {
  const navigate = useNavigate()

  const [pain, setPain] = useState("")
  const [stiffness, setStiffness] = useState("")
  const [mobility, setMobility] = useState("")
  const [activity, setActivity] = useState("")

  const handleContinue = () => {
    if (!pain || !stiffness || !mobility || !activity) {
      alert("Please answer all questions before continuing.")
      return
    }

    const assessmentData = {
      pain,
      stiffness,
      mobility,
      activity,
    }

    localStorage.setItem(
      "oaAssessment",
      JSON.stringify(assessmentData)
    )

    navigate("/movement")
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-teal-700">
          OA Care
        </h1>

        <p className="text-sm text-slate-500">
          Osteoarthritis Risk Assessment
        </p>
      </header>

      <main className="mx-auto max-w-4xl p-8">

        <h2 className="text-3xl font-bold text-slate-800">
          Symptom Assessment
        </h2>

        <p className="mt-2 text-slate-500">
          Answer the following questions about the patient's symptoms.
        </p>

        <div className="mt-8 space-y-6 rounded-2xl bg-white p-8 shadow-sm">

          {/* Pain */}
          <div>
            <label className="mb-3 block font-medium text-slate-700">
              How would you rate the patient's joint pain?
            </label>

            <select
              value={pain}
              onChange={(e) => setPain(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
            >
              <option value="">Select pain level</option>
              <option value="0">0 - No pain</option>
              <option value="1">1 - Mild</option>
              <option value="2">2 - Mild</option>
              <option value="3">3 - Mild</option>
              <option value="4">4 - Moderate</option>
              <option value="5">5 - Moderate</option>
              <option value="6">6 - Moderate</option>
              <option value="7">7 - Severe</option>
              <option value="8">8 - Severe</option>
              <option value="9">9 - Severe</option>
              <option value="10">10 - Extreme</option>
            </select>
          </div>

          {/* Stiffness */}
          <div>
            <label className="mb-3 block font-medium text-slate-700">
              Is there morning joint stiffness?
            </label>

            <div className="flex gap-4">

              <label>
                <input
                  type="radio"
                  name="stiffness"
                  value="yes"
                  checked={stiffness === "yes"}
                  onChange={(e) => setStiffness(e.target.value)}
                  className="mr-2"
                />
                Yes
              </label>

              <label>
                <input
                  type="radio"
                  name="stiffness"
                  value="no"
                  checked={stiffness === "no"}
                  onChange={(e) => setStiffness(e.target.value)}
                  className="mr-2"
                />
                No
              </label>

            </div>
          </div>

          {/* Mobility */}
          <div>
            <label className="mb-3 block font-medium text-slate-700">
              Does the patient experience difficulty walking or climbing stairs?
            </label>

            <div className="flex gap-4">

              <label>
                <input
                  type="radio"
                  name="mobility"
                  value="yes"
                  checked={mobility === "yes"}
                  onChange={(e) => setMobility(e.target.value)}
                  className="mr-2"
                />
                Yes
              </label>

              <label>
                <input
                  type="radio"
                  name="mobility"
                  value="no"
                  checked={mobility === "no"}
                  onChange={(e) => setMobility(e.target.value)}
                  className="mr-2"
                />
                No
              </label>

            </div>
          </div>

          {/* Activity */}
          <div>
            <label className="mb-3 block font-medium text-slate-700">
              Physical activity level
            </label>

            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
            >
              <option value="">Select activity level</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Button */}
          <div className="flex justify-end pt-4">

            <button
              type="button"
              onClick={handleContinue}
              className="rounded-lg bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800"
            >
              Continue to Movement Analysis →
            </button>

          </div>

        </div>

      </main>
    </div>
  )
}

export default Assessment