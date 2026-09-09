import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState({
    username: "invictus",
    full_name: "Admin Invictus",
    role: "admin",
    state: "Assam"
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sandhi_user")
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      // fallback to default
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("sandhi_token")
    localStorage.removeItem("sandhi_user")
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b bg-white px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-teal-700">
            OA Care
          </h1>
          <p className="text-xs text-slate-500">
            AI-Assisted Osteoarthritis Screening Platform
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-sm text-slate-800">
              {user.full_name || "Admin Invictus"}
            </p>
            <p className="text-xs text-teal-600 font-medium capitalize">
              Role: {user.role || "Admin"} &bull; {user.state || "Central"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl p-8">

        <h2 className="text-3xl font-bold text-slate-800">
          Dashboard
        </h2>

        <p className="mt-2 text-slate-500">
          Monitor and manage osteoarthritis screening across North Eastern Region centers.
        </p>

        {/* Statistics */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">
              Total Patients
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              128
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">
              Screened Today
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              24
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">
              High Risk Alerts
            </p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              7
            </p>
          </div>

        </div>

        {/* New Screening */}
        <div className="mt-8 rounded-2xl bg-teal-700 p-8 text-white shadow-sm">

          <h3 className="text-2xl font-bold">
            Start a New Screening
          </h3>

          <p className="mt-2 text-teal-100">
            Register a patient and begin an AI-assisted OA risk assessment (gait, range of motion, clinical WOMAC score).
          </p>

          <button
            onClick={() => navigate("/registration")}
            className="mt-6 rounded-lg bg-white px-6 py-3 font-semibold text-teal-700 hover:bg-teal-50 transition cursor-pointer shadow"
          >
            + New Screening
          </button>

        </div>

      </main>

    </div>
  )
}

export default Dashboard
