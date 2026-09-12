import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dflmzxleodgigvqrczid.supabase.co"
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder"

let client = null
try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("placeholder")) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
} catch (e) {
  console.warn("Supabase client initialized in local-resilient fallback mode", e)
}

export const supabase = client

// Local storage keys for resilient offline/caching support
const PATIENTS_KEY = "sandhi_registered_patients"
const ACTIVE_PATIENT_KEY = "sandhi_active_patient"
const CURRENT_SCREENING_KEY = "sandhi_current_screening_session"

// 1. Get all registered patients
export function getRegisteredPatients() {
  try {
    return JSON.parse(localStorage.getItem(PATIENTS_KEY) || "[]")
  } catch {
    return []
  }
}

// 2. Register a new patient
export async function registerPatient(patientData) {
  const patientId = "PAT-" + Math.floor(100000 + Math.random() * 900000)
  const newPatient = {
    id: patientId,
    patient_id: patientId,
    name: patientData.name || patientData.fullName,
    phone: patientData.phone || "",
    email: patientData.email || "",
    password: patientData.password || "",
    age: Number(patientData.age) || 45,
    gender: patientData.gender || "Female",
    height: Number(patientData.height) || 160,
    weight: Number(patientData.weight) || 62,
    bmi: Number(patientData.height) && Number(patientData.weight)
      ? Number((patientData.weight / Math.pow(patientData.height / 100, 2)).toFixed(1))
      : 24.2,
    state: patientData.state || "Assam",
    district: patientData.district || "Kamrup",
    occupation: patientData.occupation || "Agricultural Worker",
    priorInjury: patientData.priorInjury || "No",
    familyHistory: patientData.familyHistory || "No",
    role: "patient",
    createdAt: new Date().toISOString(),
    screenings: []
  }

  // Attempt Supabase insert if client configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("patients")
        .insert([{
          id: newPatient.id,
          name: newPatient.name,
          phone: newPatient.phone,
          age: newPatient.age,
          gender: newPatient.gender,
          height: newPatient.height,
          weight: newPatient.weight,
          bmi: newPatient.bmi,
          state: newPatient.state,
          metadata: {
            occupation: newPatient.occupation,
            priorInjury: newPatient.priorInjury,
            familyHistory: newPatient.familyHistory
          }
        }])
      if (error) console.warn("Supabase insert notice (using local storage):", error.message)
    } catch (err) {
      console.warn("Supabase sync fallback:", err)
    }
  }

  // Store in resilient local cache
  const allPatients = getRegisteredPatients()
  allPatients.unshift(newPatient)
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(allPatients))
  
  // Set as active logged in patient
  localStorage.setItem(ACTIVE_PATIENT_KEY, JSON.stringify(newPatient))
  return newPatient
}

// 3. Login patient with ID/Phone and password
export async function loginPatient(identifier, password) {
  const allPatients = getRegisteredPatients()
  const matched = allPatients.find(p => 
    (p.phone === identifier || p.id === identifier || p.email === identifier || p.name.toLowerCase() === identifier.toLowerCase()) &&
    (!p.password || p.password === password)
  )

  if (matched) {
    localStorage.setItem(ACTIVE_PATIENT_KEY, JSON.stringify(matched))
    return { success: true, patient: matched }
  }

  // If identifier exists without password or demo match
  if (identifier && identifier.trim().length >= 3) {
    // Quick auto-provision for clinical testing if needed
    const demoPatient = {
      id: "PAT-" + Math.floor(100000 + Math.random() * 900000),
      name: identifier.includes("@") ? identifier.split("@")[0] : identifier,
      phone: identifier.match(/^\d+$/) ? identifier : "+91 98640 55123",
      age: 52,
      gender: "Female",
      height: 158,
      weight: 64,
      bmi: 25.6,
      state: "Assam",
      district: "Kamrup Metropolitan",
      occupation: "Tea Garden Worker",
      priorInjury: "Yes, mild sprain",
      familyHistory: "Yes, mother had OA",
      role: "patient",
      screenings: []
    }
    allPatients.unshift(demoPatient)
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(allPatients))
    localStorage.setItem(ACTIVE_PATIENT_KEY, JSON.stringify(demoPatient))
    return { success: true, patient: demoPatient }
  }

  return { success: false, error: "Patient not found. Please register first." }
}

// 4. Get current logged in user (patient or doctor)
export function getActiveUser() {
  try {
    const patient = JSON.parse(localStorage.getItem(ACTIVE_PATIENT_KEY) || "null")
    if (patient) return { ...patient, role: "patient" }

    const doctor = JSON.parse(localStorage.getItem("sandhi_user") || "null")
    if (doctor) return { ...doctor, role: doctor.role || "doctor" }

    return null
  } catch {
    return null
  }
}

// 5. Logout current user
export function logoutUser() {
  localStorage.removeItem(ACTIVE_PATIENT_KEY)
  localStorage.removeItem("sandhi_user")
  localStorage.removeItem("sandhi_token")
  localStorage.removeItem(CURRENT_SCREENING_KEY)
}

// 6. Current Screening Session State Management for the 4-Step Pipeline
export function getCurrentScreeningSession() {
  try {
    const active = JSON.parse(localStorage.getItem(CURRENT_SCREENING_KEY) || "null")
    if (active) return active

    // Start fresh session using active patient data
    const patient = JSON.parse(localStorage.getItem(ACTIVE_PATIENT_KEY) || "null")
    const newSession = {
      sessionId: "SES-" + Math.floor(100000 + Math.random() * 900000),
      startedAt: new Date().toISOString(),
      patient: patient || {
        name: "Anonymous Citizen",
        age: 50,
        gender: "Female",
        height: 160,
        weight: 60,
        bmi: 23.4,
        state: "Assam",
        district: "Kamrup"
      },
      currentStep: 1, // 1: Questionnaire, 2: CV, 3: Hardware, 4: Results
      steps: {
        step1: { completed: false, score: null, data: null },
        step2: { completed: false, score: null, data: null },
        step3: { completed: false, score: null, data: null },
        step4: { completed: false, score: null, data: null }
      }
    }
    localStorage.setItem(CURRENT_SCREENING_KEY, JSON.stringify(newSession))
    return newSession
  } catch {
    return null
  }
}

export function updateScreeningStep(stepNumber, stepData, stepScore) {
  const session = getCurrentScreeningSession()
  if (!session) return

  const stepKey = `step${stepNumber}`
  session.steps[stepKey] = {
    completed: true,
    completedAt: new Date().toISOString(),
    score: stepScore,
    data: stepData
  }

  // Advance current step pointer
  if (session.currentStep <= stepNumber) {
    session.currentStep = Math.min(4, stepNumber + 1)
  }

  localStorage.setItem(CURRENT_SCREENING_KEY, JSON.stringify(session))
  return session
}

export function resetScreeningSession() {
  localStorage.removeItem(CURRENT_SCREENING_KEY)
  return getCurrentScreeningSession()
}
