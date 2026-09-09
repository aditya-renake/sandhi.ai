import { useNavigate } from "react-router-dom"

function Registration() {
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate("/assessment")
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-teal-700">
          OA Care
        </h1>
        <p className="text-sm text-slate-500">
          Patient Registration
        </p>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl p-8">

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">
            Register New Patient
          </h2>

          <p className="mt-2 text-slate-500">
            Enter the patient's basic information to begin screening.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-8 shadow-sm"
        >

          {/* Personal Information */}
          <h3 className="mb-6 text-xl font-semibold text-slate-800">
            Personal Information
          </h3>

          <div className="grid gap-6 md:grid-cols-2">

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter full name"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Age */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Age
              </label>

              <input
                type="number"
                placeholder="Enter age"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Gender
              </label>

              <select
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-600"
              >
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Phone Number
              </label>

              <input
                type="tel"
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Height */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Height (cm)
              </label>

              <input
                type="number"
                placeholder="e.g. 165"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Weight (kg)
              </label>

              <input
                type="number"
                placeholder="e.g. 65"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

          </div>

          {/* Medical Information */}
          <div className="mt-10">

            <h3 className="mb-6 text-xl font-semibold text-slate-800">
              Medical Information
            </h3>

            <div className="grid gap-6 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Previous Joint Injury?
                </label>

                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-600"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Family History of OA?
                </label>

                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-600"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

            </div>

          </div>

          {/* Buttons */}
          <div className="mt-10 flex justify-end gap-4">

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => navigate("/assessment")}
              className="rounded-lg bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800"
            >
              Continue to Assessment →
            </button>

          </div>

        </form>

      </main>
    </div>
  )
}

export default Registration