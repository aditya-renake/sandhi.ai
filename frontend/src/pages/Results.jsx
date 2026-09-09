import { useNavigate } from "react-router-dom"

function Results() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50">

      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-teal-700">
          OA Care
        </h1>

        <p className="text-sm text-slate-500">
          Screening Result
        </p>
      </header>

      <main className="mx-auto max-w-4xl p-8">

        <div className="text-center">

          <p className="text-sm font-medium text-teal-700">
            SCREENING COMPLETE
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-800">
            Osteoarthritis Risk Result
          </h2>

        </div>

        {/* Risk score */}
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">

          <p className="text-sm text-slate-500">
            Estimated Risk Score
          </p>

          <p className="mt-3 text-6xl font-bold text-red-600">
            74
          </p>

          <p className="mt-2 text-xl font-semibold text-red-600">
            HIGH RISK
          </p>

          <p className="mx-auto mt-4 max-w-lg text-sm text-slate-500">
            This is a prototype result. A qualified healthcare
            professional should evaluate the patient before
            making any clinical decision.
          </p>

        </div>

        {/* Factors */}
        <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm">

          <h3 className="text-xl font-semibold text-slate-800">
            Contributing Factors
          </h3>

          <div className="mt-5 space-y-3">

            <div className="rounded-lg bg-slate-50 p-4">
              Persistent joint pain
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              Previous joint injury
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              Reduced mobility
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              Abnormal movement pattern
            </div>

          </div>

        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700"
          >
            Back to Dashboard
          </button>

          <button
            onClick={() => navigate("/referral")}
            className="rounded-lg bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800"
          >
            Create Referral →
          </button>

        </div>

      </main>
    </div>
  )
}

export default Results