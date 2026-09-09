import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Phone, User, Lock, ArrowRight, ShieldCheck } from "lucide-react"

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("invictus")
  const [password, setPassword] = useState("invictus@11")
  const [phone, setPhone] = useState("")
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
          state: data.state,
          phone: phone // Store phone locally if needed
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
          state: "Assam",
          phone: phone
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
          state: "Assam",
          phone: phone
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 p-8 shadow-2xl border border-slate-700">
        
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-900/40 text-teal-400 font-bold text-3xl mb-4 shadow-inner ring-1 ring-teal-500/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
            OA Care
          </h1>
          <p className="mt-2 text-sm text-teal-400 font-medium">
            AI-Assisted Osteoarthritis Risk Screening
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Early risk screening and care navigation for osteoarthritis.
          </p>
        </div>

        {/* Quick Admin Badge */}
        <div className="mb-6 rounded-xl bg-slate-900/50 border border-slate-700 p-3 text-xs text-slate-300 flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-100">Admin Credentials:</span>
            <span className="ml-1 font-mono text-teal-400">invictus</span> / <span className="font-mono text-teal-400">invictus@11</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setUsername("invictus")
              setPassword("invictus@11")
            }}
            className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 underline ml-2 transition-colors cursor-pointer"
          >
            Auto-fill
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-900/20 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mb-5 flex items-center justify-center space-x-2">
          <div className="h-px w-full bg-slate-700"></div>
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap px-2">
            Already have an account? Continue with your account
          </span>
          <div className="h-px w-full bg-slate-700"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full rounded-lg bg-slate-900/50 border border-slate-700 pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Phone Number
            </label>
            <div className="flex">
              <div className="flex items-center justify-center px-3 rounded-l-lg border border-r-0 border-slate-700 bg-slate-800 text-slate-400 text-sm">
                +91
              </div>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-r-lg bg-slate-900/50 border border-slate-700 pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-lg bg-slate-900/50 border border-slate-700 pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 font-semibold text-white hover:bg-teal-500 disabled:opacity-50 transition-colors cursor-pointer shadow-lg shadow-teal-900/20"
          >
            {loading ? "Signing in..." : "Continue to Dashboard"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">
          MDoNER Healthcare Screening Platform &bull; Problem Statement 26004
        </p>

      </div>
    </div>
  )
}

export default Login
