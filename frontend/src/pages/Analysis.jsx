import { useLocation, useNavigate } from "react-router-dom"

function Analysis() {
  const navigate = useNavigate()
  const location = useLocation()

  // Get movement results from Movement Analysis page
  const movementResults = location.state?.movementResults

  // Fallback values if the page is opened directly
  const gait = movementResults?.gait || {
    value: "92%",
    status: "Normal",
  }

  const knee = movementResults?.knee || {
    value: "78°",
    status: "Mild Limitation",
  }

  const posture = movementResults?.posture || {
    value: "Good",
    status: "Normal",
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-teal-700">
          OA Care
        </h1>

        <p className="text-sm text-slate-500">
          AI-Assisted Osteoarthritis Screening
        </p>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl p-8">

        {/* Page Title */}
        <div className="mb-8">

          <p className="text-sm font-medium text-teal-700">
            STEP 4 OF 4
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-800">
            AI Analysis
          </h2>

          <p className="mt-2 text-slate-500">
            AI-assisted analysis of the patient's symptoms and movement data.
          </p>

        </div>

        {/* Overall Risk */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">

          <div className="grid gap-8 md:grid-cols-2">

            {/* Risk Score */}
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">

              <p className="text-sm font-medium text-slate-600">
                Overall OA Risk
              </p>

              <div className="mt-3 flex items-center gap-4">

                <span className="text-5xl font-bold text-orange-600">
                  Moderate
                </span>

              </div>

              <p className="mt-3 text-sm text-slate-600">
                Based on the available symptom and movement indicators.
              </p>

            </div>

            {/* Score */}
            <div className="rounded-xl border border-slate-200 p-6">

              <p className="text-sm font-medium text-slate-500">
                Risk Score
              </p>

              <div className="mt-2 flex items-end gap-2">

                <span className="text-5xl font-bold text-slate-800">
                  62
                </span>

                <span className="mb-2 text-slate-500">
                  / 100
                </span>

              </div>

              {/* Progress bar */}
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">

                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: "62%" }}
                />

              </div>

              <p className="mt-2 text-xs text-slate-500">
                Higher scores indicate greater screening risk.
              </p>

            </div>

          </div>

          {/* AI Status */}
          <div className="mt-8 rounded-xl border border-teal-200 bg-teal-50 p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-white">
                ✓
              </div>

              <div>

                <h3 className="font-semibold text-teal-900">
                  AI Analysis Complete
                </h3>

                <p className="text-sm text-teal-700">
                  Patient data has been analyzed successfully.
                </p>

              </div>

            </div>

          </div>

          {/* Movement Findings */}
          <div className="mt-8">

            <h3 className="text-xl font-semibold text-slate-800">
              Movement Findings
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-3">

              {/* Gait */}
              <div className="rounded-xl border border-slate-200 p-5">

                <p className="text-sm text-slate-500">
                  Gait Symmetry
                </p>

                <p className="mt-2 text-2xl font-bold text-teal-700">
                  {gait.value}
                </p>

                <p className="mt-1 text-sm font-medium text-green-600">
                  {gait.status}
                </p>

              </div>

              {/* Knee */}
              <div className="rounded-xl border border-slate-200 p-5">

                <p className="text-sm text-slate-500">
                  Knee Movement
                </p>

                <p className="mt-2 text-2xl font-bold text-teal-700">
                  {knee.value}
                </p>

                <p className="mt-1 text-sm font-medium text-orange-500">
                  {knee.status}
                </p>

              </div>

              {/* Posture */}
              <div className="rounded-xl border border-slate-200 p-5">

                <p className="text-sm text-slate-500">
                  Posture
                </p>

                <p className="mt-2 text-2xl font-bold text-teal-700">
                  {posture.value}
                </p>

                <p className="mt-1 text-sm font-medium text-green-600">
                  {posture.status}
                </p>

              </div>

            </div>

          </div>

          {/* Key Findings */}
          <div className="mt-8">

            <h3 className="text-xl font-semibold text-slate-800">
              Key Findings
            </h3>

            <div className="mt-4 space-y-3">

              <div className="flex gap-3 rounded-lg bg-slate-50 p-4">

                <span className="text-teal-700">
                  ✓
                </span>

                <p className="text-slate-700">
                  Gait symmetry is within the normal range.
                </p>

              </div>

              <div className="flex gap-3 rounded-lg bg-orange-50 p-4">

                <span className="text-orange-600">
                  !
                </span>

                <p className="text-slate-700">
                  Mild limitation detected in knee movement.
                </p>

              </div>

              <div className="flex gap-3 rounded-lg bg-slate-50 p-4">

                <span className="text-teal-700">
                  ✓
                </span>

                <p className="text-slate-700">
                  Overall body posture appears normal.
                </p>

              </div>

            </div>

          </div>

          {/* Recommendation */}
          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">

            <h3 className="text-xl font-semibold text-blue-900">
              Recommendation
            </h3>

            <p className="mt-3 leading-relaxed text-blue-800">
              The screening indicates a moderate risk pattern.
              Further clinical evaluation is recommended, particularly
              if the patient experiences persistent pain, stiffness,
              or difficulty with daily activities.
            </p>

            <p className="mt-3 text-sm text-blue-700">
              This screening result is intended to support healthcare
              professionals and should not be considered a definitive diagnosis.
            </p>

          </div>

          {/* Buttons */}
          <div className="mt-8 flex justify-end gap-4">

            <button
              onClick={() => navigate("/movement")}
              className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              ← Back
            </button>

            <button
              onClick={() => navigate("/results")}
              className="rounded-lg bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800"
            >
              View Final Results →
            </button>

          </div>

        </div>

      </main>

    </div>
  )
}

export default Analysis