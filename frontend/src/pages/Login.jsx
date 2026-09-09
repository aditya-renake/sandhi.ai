import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("invictus")
  const [password, setPassword] = useState("invictus@11")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // 1. Attempt API authentication
      const response = await fetch("/api/v1/auth/login-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("sandhi_token", data.access_token)
        localStorage.setItem("sandhi_user", JSON.stringify({
          username: data.username,
          full_name: data.full_name,
          role: data.role,
          state: data.state
        }))
        navigate("/dashboard")
        return
      }

      // 2. Offline / Demo fallback for invictus admin
      if (username === "invictus" && password === "invictus@11") {
        localStorage.setItem("sandhi_user", JSON.stringify({
          username: "invictus",
          full_name: "Admin Invictus",
          role: "admin",
          state: "Assam"
        }))
        navigate("/dashboard")
        return
      }

      const errData = await response.json().catch(() => ({}))
      setError(errData.detail || "Invalid username or password")
    } catch {
      // Fallback if backend is currently connecting
      if (username === "invictus" && password === "invictus@11") {
        localStorage.setItem("sandhi_user", JSON.stringify({
          username: "invictus",
          full_name: "Admin Invictus",
          role: "admin",
          state: "Assam"
        }))
        navigate("/dashboard")
      } else {
        setError("Network error. Please check your credentials or try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 font-black text-2xl mb-3 shadow-inner">
            OA
          </div>
          <h1 className="text-3xl font-bold text-teal-800 tracking-tight">
            OA Care
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sandhi-NER: AI-Assisted Osteoarthritis Screening
          </p>
        </div>

        {/* Quick Admin Badge */}
        <div className="mb-5 rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-800 flex items-center justify-between">
          <div>
            <span className="font-semibold">Admin Credentials:</span>
            <span className="ml-1 font-mono text-teal-950">invictus</span> / <span className="font-mono text-teal-950">invictus@11</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setUsername("invictus")
              setPassword("invictus@11")
            }}
            className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline ml-2"
          >
            Auto-fill
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Username or Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-700 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50 transition cursor-pointer shadow-sm"
          >
            {loading ? "Signing in..." : "Sign In as Admin"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          MDoNER Healthcare Screening Platform &bull; Problem Statement 26004
        </p>

      </div>
    </div>
  )
}

export default Login
