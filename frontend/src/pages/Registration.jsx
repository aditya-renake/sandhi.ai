import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, User, Stethoscope, FileText, ChevronDown } from "lucide-react"

function Registration() {
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate("/assessment")
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 pb-12">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-8 py-4 flex items-center gap-4 shadow-sm">
        <button 
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-900/40 text-teal-400 font-bold text-sm shadow-inner ring-1 ring-teal-500/20">
            OA
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight leading-tight">
              OA Care
            </h1>
            <p className="text-[10px] text-teal-400 font-medium uppercase tracking-wider">
              Patient Registration
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl p-6 md:p-8 mt-4">

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <FileText size={14} className="text-teal-400" />
            Step 1 of 3
          </div>
          <h2 className="text-3xl font-bold text-slate-100 tracking-tight">
            Register New Patient
          </h2>
          <p className="mt-3 text-slate-400 max-w-2xl text-sm md:text-base">
            Enter the patient's basic personal and medical information to begin the AI-assisted osteoarthritis risk screening process.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Personal Information */}
          <div className="rounded-2xl bg-slate-800 shadow-xl border border-slate-700 overflow-hidden">
            <div className="border-b border-slate-700 bg-slate-800/50 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-teal-400">
                <User size={20} />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">
                Personal Information
              </h3>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-2">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  required
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>

              {/* Age */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Age
                </label>
                <input
                  type="number"
                  placeholder="Enter age"
                  required
                  min="0"
                  max="120"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Gender
                </label>
                <div className="relative">
                  <select
                    required
                    className="w-full appearance-none rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer"
                  >
                    <option value="" disabled selected hidden>Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Phone Number
                </label>
                <div className="flex">
                  <div className="flex items-center justify-center px-3 rounded-l-lg border border-r-0 border-slate-700 bg-slate-800 text-slate-400 text-sm">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    className="w-full flex-1 rounded-r-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Height */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Height (cm)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 165"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 65"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="rounded-2xl bg-slate-800 shadow-xl border border-slate-700 overflow-hidden">
            <div className="border-b border-slate-700 bg-slate-800/50 px-6 py-4 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-orange-400">
                <Stethoscope size={20} />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">
                Medical Information
              </h3>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Previous Joint Injury?
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer"
                  >
                    <option value="" disabled selected hidden>Select an option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Family History of OA?
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer"
                  >
                    <option value="" disabled selected hidden>Select an option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-10 flex flex-col-reverse sm:flex-row justify-end gap-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 px-6 py-3.5 font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-3.5 font-semibold text-white hover:bg-teal-500 transition-colors shadow-lg shadow-teal-900/20 cursor-pointer"
            >
              <span>Continue to Assessment</span>
              <ArrowRight size={18} />
            </button>
          </div>

        </form>

      </main>
    </div>
  )
}

export default Registration