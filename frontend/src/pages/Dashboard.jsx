import { useNavigate } from "react-router-dom"

function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b bg-white px-8 py-5 flex justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-700">
            OA Care
          </h1>

          <p className="text-sm text-slate-500">
            AI-Assisted Osteoarthritis Screening
          </p>
        </div>

        <div className="text-right">
          <p className="font-semibold text-slate-700">
            Healthcare Worker
          </p>

          <p className="text-sm text-slate-500">
            Screening Centre
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl p-8">

        <h2 className="text-3xl font-bold text-slate-800">
          Dashboard
        </h2>

        <p className="mt-2 text-slate-500">
          Monitor and manage osteoarthritis screening.
        </p>

        {/* Statistics */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Patients
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              128
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Screened Today
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              24
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              High Risk
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              7
            </p>
          </div>

        </div>

        {/* New Screening */}
        <div className="mt-8 rounded-2xl bg-teal-700 p-8 text-white">

          <h3 className="text-2xl font-bold">
            Start a New Screening
          </h3>

          <p className="mt-2 text-teal-50">
            Register a patient and begin an AI-assisted OA risk assessment.
          </p>

          <button
            onClick={() => navigate("/registration")}
            className="mt-6 rounded-lg bg-white px-6 py-3 font-semibold text-teal-700 hover:bg-teal-50"
          >
            + New Screening
          </button>

        </div>

      </main>

    </div>
  )
}

export default Dashboard