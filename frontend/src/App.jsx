import { BrowserRouter, Routes, Route } from "react-router-dom"

import Gateway from "./pages/Gateway"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Registration from "./pages/Registration"
import Assessment from "./pages/Assessment"
import MovementAnalysis from "./pages/MovementAnalysis"
import Analysis from "./pages/Analysis"
import Results from "./pages/Results"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Gateway />} />
        <Route path="/gateway" element={<Gateway />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/movement" element={<MovementAnalysis />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
