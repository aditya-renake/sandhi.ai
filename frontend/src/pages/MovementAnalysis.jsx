import { useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function MovementAnalysis() {
  const navigate = useNavigate()

  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [cameraStarted, setCameraStarted] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)

  const [results, setResults] = useState({
    gait: null,
    knee: null,
    posture: null,
  })

  const startCamera = async () => {
    try {
      setCameraError("")

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })

      streamRef.current = stream

      setCameraStarted(true)

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream

          videoRef.current.play().catch((error) => {
            console.log("Video play error:", error)
          })
        }
      }, 100)

    } catch (error) {
      console.error("Camera access error:", error)

      setCameraError(
        "Unable to access the camera. Please allow camera permission in your browser."
      )
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraStarted(false)
  }

  const analyzeMovement = () => {
    setAnalyzing(true)
    setAnalysisComplete(false)

    // Simulate AI movement analysis
    setTimeout(() => {
      setResults({
        gait: {
          value: "92%",
          status: "Normal",
        },

        knee: {
          value: "78°",
          status: "Mild Limitation",
        },

        posture: {
          value: "Good",
          status: "Normal",
        },
      })

      setAnalyzing(false)
      setAnalysisComplete(true)
    }, 2500)
  }

  const continueToAnalysis = () => {
    navigate("/analysis", {
      state: {
        movementResults: results,
      },
    })
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-teal-700">
          OA Care
        </h1>

        <p className="text-sm text-slate-500">
          Movement Analysis
        </p>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl p-8">

        {/* Title */}
        <div className="mb-8">

          <p className="text-sm font-medium text-teal-700">
            STEP 3 OF 4
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-800">
            Movement Analysis
          </h2>

          <p className="mt-2 text-slate-500">
            Assess the patient's movement and gait pattern.
          </p>

        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">

          {/* Camera */}
          <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-100">

            {!cameraStarted ? (

              <div className="flex min-h-[350px] items-center justify-center">

                <div className="text-center">

                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 text-4xl">
                    📷
                  </div>

                  <h3 className="text-xl font-semibold text-slate-800">
                    Movement Analysis Camera
                  </h3>

                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Camera-based movement analysis will detect gait,
                    joint movement and body posture.
                  </p>

                  <button
                    onClick={startCamera}
                    className="mt-6 rounded-lg bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800"
                  >
                    Start Camera
                  </button>

                </div>

              </div>

            ) : (

              <div className="relative">

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-[350px] w-full object-cover"
                />

                {/* Camera status */}
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm text-white">

                  <span className="h-2 w-2 rounded-full bg-red-500"></span>

                  Camera Active

                </div>

                {/* Stop */}
                <button
                  onClick={stopCamera}
                  className="absolute bottom-4 right-4 rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700"
                >
                  Stop Camera
                </button>

              </div>

            )}

          </div>

          {/* Error */}
          {cameraError && (

            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {cameraError}
            </div>

          )}

          {/* Analyze button */}
          {cameraStarted && !analysisComplete && (

            <div className="mt-6 flex justify-center">

              <button
                onClick={analyzeMovement}
                disabled={analyzing}
                className={`rounded-lg px-8 py-3 font-semibold text-white ${
                  analyzing
                    ? "cursor-not-allowed bg-slate-400"
                    : "bg-teal-700 hover:bg-teal-800"
                }`}
              >

                {analyzing
                  ? "Analyzing Movement..."
                  : "Analyze Movement"}

              </button>

            </div>

          )}

          {/* Loading */}
          {analyzing && (

            <div className="mt-6 rounded-xl border border-teal-100 bg-teal-50 p-5 text-center">

              <div className="text-lg font-semibold text-teal-800">
                AI is analyzing movement...
              </div>

              <p className="mt-1 text-sm text-teal-600">
                Evaluating gait, knee movement and posture.
              </p>

            </div>

          )}

          {/* Results */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">

            {/* Gait */}
            <div className="rounded-xl border border-slate-200 p-5">

              <p className="text-sm text-slate-500">
                Gait Symmetry
              </p>

              {results.gait ? (

                <>
                  <p className="mt-2 text-2xl font-bold text-teal-700">
                    {results.gait.value}
                  </p>

                  <p className="mt-1 text-sm font-medium text-green-600">
                    {results.gait.status}
                  </p>
                </>

              ) : (

                <p className="mt-2 text-xl font-semibold text-slate-400">
                  Pending
                </p>

              )}

            </div>

            {/* Knee */}
            <div className="rounded-xl border border-slate-200 p-5">

              <p className="text-sm text-slate-500">
                Knee Movement
              </p>

              {results.knee ? (

                <>
                  <p className="mt-2 text-2xl font-bold text-teal-700">
                    {results.knee.value}
                  </p>

                  <p className="mt-1 text-sm font-medium text-orange-500">
                    {results.knee.status}
                  </p>
                </>

              ) : (

                <p className="mt-2 text-xl font-semibold text-slate-400">
                  Pending
                </p>

              )}

            </div>

            {/* Posture */}
            <div className="rounded-xl border border-slate-200 p-5">

              <p className="text-sm text-slate-500">
                Posture
              </p>

              {results.posture ? (

                <>
                  <p className="mt-2 text-2xl font-bold text-teal-700">
                    {results.posture.value}
                  </p>

                  <p className="mt-1 text-sm font-medium text-green-600">
                    {results.posture.status}
                  </p>
                </>

              ) : (

                <p className="mt-2 text-xl font-semibold text-slate-400">
                  Pending
                </p>

              )}

            </div>

          </div>

          {/* Success message */}
          {analysisComplete && (

            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">

              <h3 className="font-semibold text-green-800">
                Movement Analysis Complete
              </h3>

              <p className="mt-1 text-sm text-green-700">
                Movement data has been successfully analyzed.
                Continue to AI Analysis to view the overall OA risk assessment.
              </p>

            </div>

          )}

          {/* Continue */}
          <div className="mt-8 flex justify-end">

            <button
              onClick={continueToAnalysis}
              disabled={!analysisComplete}
              className={`rounded-lg px-6 py-3 font-semibold text-white ${
                analysisComplete
                  ? "bg-teal-700 hover:bg-teal-800"
                  : "cursor-not-allowed bg-slate-300"
              }`}
            >
              Continue to AI Analysis →
            </button>

          </div>

        </div>

      </main>

    </div>
  )
}

export default MovementAnalysis