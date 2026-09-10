import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Phone, User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react"

function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (isLogin) {
      // Existing User Login flow
      try {
        const response = await fetch("/api/v1/auth/login-json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password })
        })

        if (response.ok) {
          const data = await response.json()
          localStorage.setItem("sandhi_token", data.access_token)
          localStorage.setItem(
            "sandhi_user",
            JSON.stringify({
              username: data.username,
              full_name: data.full_name || data.username,
              role: data.role || "asha_worker",
              state: data.state || "Assam",
              phone: phone || ""
            })
          )
          navigate("/dashboard")
          return
        }

        // Demo / offline fallback for invictus
        if (username.trim() === "invictus" && password === "invictus@11") {
          localStorage.setItem(
            "sandhi_user",
            JSON.stringify({
              username: "invictus",
              full_name: "Admin Invictus",
              role: "admin",
              state: "Assam",
              phone: phone || ""
            })
          )
          navigate("/dashboard")
          return
        }

        const errData = await response.json().catch(() => ({}))
        setError(errData.detail || "Invalid username or password")
      } catch {
        // Offline / network fallback
        if (username.trim() === "invictus" && password === "invictus@11") {
          localStorage.setItem(
            "sandhi_user",
            JSON.stringify({
              username: "invictus",
              full_name: "Admin Invictus",
              role: "admin",
              state: "Assam",
              phone: phone || ""
            })
          )
          navigate("/dashboard")
        } else if (username.trim() && password) {
          // Allow offline session for demonstration
          localStorage.setItem(
            "sandhi_user",
            JSON.stringify({
              username: username.trim(),
              full_name: username.trim(),
              role: "asha_worker",
              state: "Assam",
              phone: phone || ""
            })
          )
          navigate("/dashboard")
        } else {
          setError("Network error. Please check your connection or credentials.")
        }
      } finally {
        setLoading(false)
      }
    } else {
      // New User Registration flow (Username, Email, Phone, Password)
      try {
        const regResponse = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim() || undefined,
            password: password,
            full_name: username.trim(),
            role: "asha_worker",
            state: "Assam",
            district: "Kamrup Metropolitan",
            phc_name: "Dispur PHC"
          })
        })

        if (regResponse.ok) {
          // Optional automatic token login
          try {
            const loginResponse = await fetch("/api/v1/auth/login-json", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: username.trim(), password })
            })
            if (loginResponse.ok) {
              const data = await loginResponse.json()
              localStorage.setItem("sandhi_token", data.access_token)
            }
          } catch {
            // non-blocking
          }

          localStorage.setItem(
            "sandhi_user",
            JSON.stringify({
              username: username.trim(),
              full_name: username.trim(),
              email: email.trim(),
              phone: phone.trim(),
              role: "asha_worker",
              state: "Assam"
            })
          )
          navigate("/dashboard")
          return
        }

        const errData = await regResponse.json().catch(() => ({}))
        if (errData.detail) {
          setError(errData.detail)
          return
        }

        // Fallback save and continue
        localStorage.setItem(
          "sandhi_user",
          JSON.stringify({
            username: username.trim(),
            full_name: username.trim(),
            email: email.trim(),
            phone: phone.trim(),
            role: "asha_worker",
            state: "Assam"
          })
        )
        navigate("/dashboard")
      } catch {
        // Backend offline fallback - establish local session for demo
        localStorage.setItem(
          "sandhi_user",
          JSON.stringify({
            username: username.trim(),
            full_name: username.trim(),
            email: email.trim(),
            phone: phone.trim(),
            role: "asha_worker",
            state: "Assam"
          })
        )
        navigate("/dashboard")
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 p-8 shadow-2xl border border-slate-700">
        
        {/* Brand Header */}
        <div className="mb-6 text-center">
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

        {error && (
          <div className="mb-5 rounded-lg bg-red-900/20 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin ? (
            /* Registration Mode: 1. Username, 2. Email, 3. Phone, 4. Password */
            <>
              {/* 1. Username */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    required
                    className="w-full rounded-lg bg-slate-900/50 border border-slate-700 pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* 2. Email */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-lg bg-slate-900/50 border border-slate-700 pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* 3. Phone */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Phone
                </label>
                <div className="flex">
                  <div className="flex items-center justify-center px-3 rounded-l-lg border border-r-0 border-slate-700 bg-slate-800 text-slate-400 text-sm font-medium">
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
                      required
                      className="w-full rounded-r-lg bg-slate-900/50 border border-slate-700 pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Password with Eye toggle */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    className="w-full rounded-lg bg-slate-900/50 border border-slate-700 pl-10 pr-10 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Login Mode: Username and Password */
            <>
              {/* Username */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Username
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

              {/* Password with Eye toggle */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-lg bg-slate-900/50 border border-slate-700 pl-10 pr-10 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Continue to Dashboard Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 font-semibold text-white hover:bg-teal-500 disabled:opacity-50 transition-colors cursor-pointer shadow-lg shadow-teal-900/20"
          >
            {loading ? "Processing..." : "Continue to Dashboard"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Already have account / Don't have account toggle at the bottom of Continue to Dashboard */}
        <div className="mt-6 text-center text-sm text-slate-400">
          {!isLogin ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true)
                  setError("")
                }}
                className="font-semibold text-teal-400 hover:text-teal-300 underline cursor-pointer transition-colors"
              >
                Log in
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false)
                  setError("")
                }}
                className="font-semibold text-teal-400 hover:text-teal-300 underline cursor-pointer transition-colors"
              >
                Register
              </button>
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          MDoNER Healthcare Screening Platform &bull; Problem Statement 26004
        </p>

      </div>
    </div>
  )
}

export default Login
