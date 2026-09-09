import { useNavigate } from "react-router-dom"

function Login() {
    const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-teal-700">
            OA Care
          </h1>

          <p className="mt-2 text-slate-500">
            AI-Assisted Osteoarthritis Screening
          </p>
        </div>

        <div className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
            />
          </div>

          <button
             onClick={() => navigate("/dashboard")}
             className="w-full rounded-lg bg-teal-700 py-3 font-semibold text-white hover:bg-teal-800"
          >
             Sign In
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Healthcare Screening Platform
        </p>

      </div>
    </div>
  )
}

export default Login