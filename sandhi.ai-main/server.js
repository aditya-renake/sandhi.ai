const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// In-Memory / Local Session Store for Raw Features & Multimodal Scores
const SESSIONS = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1: QUESTIONNAIRE SERVICE
// ─────────────────────────────────────────────────────────────────────────────
app.post(["/api/questionnaire", "/api/v1/questionnaire"], (req, res) => {
  try {
    const {
      session_id,
      user_id = "default_user",
      pain = [],
      stiffness = [],
      function: funcItems = [],
      age = 55,
      sex = "Female",
      height_cm = 160,
      weight_kg = 65,
      occupation_type = "manual",
      family_history = false,
      prior_joint_injury = false
    } = req.body;

    // Pad or trim items according to WOMAC standard
    const painItems = Array.isArray(pain) && pain.length > 0 ? pain : [0, 0, 0, 0, 0];
    const stiffnessItems = Array.isArray(stiffness) && stiffness.length > 0 ? stiffness : [0, 0];
    const functionItems = Array.isArray(funcItems) && funcItems.length > 0 ? funcItems : new Array(17).fill(0);

    const painSum = painItems.slice(0, 5).reduce((a, b) => a + Number(b || 0), 0);
    const stiffSum = stiffnessItems.slice(0, 2).reduce((a, b) => a + Number(b || 0), 0);
    const funcSum = functionItems.slice(0, 17).reduce((a, b) => a + Number(b || 0), 0);

    // WOMAC Formula from Spec
    const pain_score = (painSum / (5 * 4)) * 20.0;       // Max: 20
    const stiffness_score = (stiffSum / (2 * 4)) * 8.0;   // Max: 8
    const function_score = (funcSum / (17 * 4)) * 68.0;  // Max: 68
    const total_womac = pain_score + stiffness_score + function_score; // Out of 96
    const questionnaire_score = Math.min(100, Math.round((total_womac / 96.0) * 100.0));

    // BMI Calculation
    const height_m = Math.max(0.5, Number(height_cm) / 100.0);
    const bmi = Number((Number(weight_kg) / (height_m * height_m)).toFixed(1));

    const sessId = session_id || crypto.randomUUID();
    const existing = SESSIONS.get(sessId) || {
      session_id: sessId,
      user_id,
      created_at: new Date().toISOString()
    };

    existing.questionnaire_score = questionnaire_score;
    existing.raw_questionnaire_answers = req.body;
    SESSIONS.set(sessId, existing);

    res.json({
      session_id: sessId,
      questionnaire_score,
      subscale_breakdown: {
        pain: Number(pain_score.toFixed(1)),
        stiffness: Number(stiffness_score.toFixed(1)),
        function: Number(function_score.toFixed(1)),
        womac_total_out_of_96: Number(total_womac.toFixed(1))
      },
      risk_factors: {
        bmi,
        bmi_elevated: bmi >= 25.0,
        occupation_flag: String(occupation_type).toLowerCase() === "manual",
        family_history: Boolean(family_history),
        prior_injury: Boolean(prior_joint_injury)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2: COMPUTER VISION SERVICE
// ─────────────────────────────────────────────────────────────────────────────
app.post(["/api/cv-analysis", "/api/v1/cv-analysis"], (req, res) => {
  try {
    const {
      session_id,
      sit_to_stand_reps = 8,
      sit_to_stand_time = 30.0,
      peak_knee_flexion = 94.0,
      extension_angle = 162.0,
      angular_velocity_mean = 45.0,
      trunk_lean_angle = 12.0,
      left_right_asymmetry = 8.5,
      movement_pauses_count = 2,
      cv_confidence = 0.88
    } = req.body;

    const flags = [];

    // Guardrail: Flag low confidence
    if (Number(cv_confidence) < 0.6) {
      flags.push("LOW_CONFIDENCE_WARNING: Camera video quality or body landmark visibility below 60%. Results may have higher variance.");
    }

    // Reps deficit (norm: 14 reps in 30s)
    const repsDeficit = Math.max(0, Math.min(1, (14.0 - Number(sit_to_stand_reps)) / 10.0)) * 40.0;
    if (Number(sit_to_stand_reps) < 8) {
      flags.push(`Severely reduced 30s chair stand power (${sit_to_stand_reps} reps vs 14 normal)`);
    } else if (Number(sit_to_stand_reps) < 12) {
      flags.push(`Mild-to-moderate sit-to-stand endurance deficit (${sit_to_stand_reps} reps)`);
    }

    // Range of Motion deficit (norm: 115 deg)
    const rom = Math.max(20.0, Number(extension_angle) - Number(peak_knee_flexion));
    const romDeficit = Math.max(0, Math.min(1, (115.0 - rom) / 45.0)) * 35.0;
    if (rom < 80.0) {
      flags.push(`Restricted knee Range of Motion (${rom.toFixed(1)}° vs 115°+ expected)`);
    }

    // Coronal Asymmetry & Trunk Lean
    const asymPenalty = Math.min(15.0, (Number(left_right_asymmetry) / 15.0) * 15.0);
    const trunkPenalty = Math.min(10.0, (Number(trunk_lean_angle) / 20.0) * 10.0);

    if (Number(left_right_asymmetry) > 10.0) {
      flags.push(`Limb loading asymmetry during movement (${left_right_asymmetry}%)`);
    }
    if (Number(trunk_lean_angle) > 15.0) {
      flags.push("Anterior trunk lean compensation during ascent");
    }

    const cv_score = Math.min(100, Math.round(repsDeficit + romDeficit + asymPenalty + trunkPenalty));

    const sessId = session_id || crypto.randomUUID();
    const existing = SESSIONS.get(sessId) || {
      session_id: sessId,
      created_at: new Date().toISOString()
    };

    existing.cv_score = cv_score;
    existing.cv_confidence = Number(cv_confidence);
    existing.raw_cv_features = req.body;
    SESSIONS.set(sessId, existing);

    res.json({
      session_id: sessId,
      cv_score,
      cv_confidence: Number(cv_confidence),
      features: {
        sit_to_stand_reps: Number(sit_to_stand_reps),
        knee_rom_deg: Number(rom.toFixed(1)),
        peak_knee_flexion: Number(peak_knee_flexion),
        extension_angle: Number(extension_angle),
        angular_velocity_mean: Number(angular_velocity_mean),
        trunk_lean_angle: Number(trunk_lean_angle),
        left_right_asymmetry: Number(left_right_asymmetry),
        movement_pauses_count: Number(movement_pauses_count)
      },
      flags
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3: HARDWARE INGESTION SERVICE
// ─────────────────────────────────────────────────────────────────────────────
app.post(["/api/hardware-reading", "/api/v1/hardware-reading"], (req, res) => {
  try {
    const {
      session_id,
      imu_readings = [],
      acoustic_signal = [],
      acoustic_burst_count = 4,
      peak_frequency_hz = 142.0,
      rms_vibration_energy = 0.35,
      pressure_readings = []
    } = req.body;

    const burstScore = Math.min(50.0, (Number(acoustic_burst_count) / 8.0) * 50.0);
    const freqScore = Math.max(0.0, Math.min(35.0, ((Number(peak_frequency_hz) - 100.0) / 150.0) * 35.0));
    const rmsScore = Math.min(15.0, (Number(rms_vibration_energy) / 0.80) * 15.0);

    let asymmetry_index = 0.0;
    if (Array.isArray(pressure_readings) && pressure_readings.length >= 2) {
      const p1 = Number(pressure_readings[0] || 0);
      const p2 = Number(pressure_readings[1] || 0);
      asymmetry_index = Number((Math.abs(p1 - p2) / Math.max(1, p1 + p2) * 100).toFixed(1));
    }

    const hardware_score = Math.min(100, Math.round(burstScore + freqScore + rmsScore));
    const crepitus_detected = Number(acoustic_burst_count) >= 3 || Number(peak_frequency_hz) >= 160.0;

    const sessId = session_id || crypto.randomUUID();
    const existing = SESSIONS.get(sessId) || {
      session_id: sessId,
      created_at: new Date().toISOString()
    };

    existing.hardware_score = hardware_score;
    existing.raw_hardware_features = req.body;
    SESSIONS.set(sessId, existing);

    res.json({
      session_id: sessId,
      hardware_score,
      crepitus_detected,
      asymmetry_index,
      raw_features: {
        burst_count: Number(acoustic_burst_count),
        peak_frequency_hz: Number(peak_frequency_hz),
        rms_energy: Number(rms_vibration_energy),
        crepitus_severity: Number(acoustic_burst_count) >= 6 ? "Severe" : Number(acoustic_burst_count) >= 3 ? "Moderate" : "Mild/None"
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4: FUSION ENGINE SERVICE
// ─────────────────────────────────────────────────────────────────────────────
app.post(["/api/fusion", "/api/v1/fusion"], (req, res) => {
  try {
    const {
      session_id,
      questionnaire_score,
      cv_score,
      cv_confidence = 0.85,
      hardware_score,
      hw_confidence = 1.0
    } = req.body;

    const sess = session_id ? (SESSIONS.get(session_id) || {}) : {};
    const q = questionnaire_score !== undefined ? Number(questionnaire_score) : Number(sess.questionnaire_score || 45);
    const cv = cv_score !== undefined ? Number(cv_score) : Number(sess.cv_score || 50);
    const hw = hardware_score !== undefined ? Number(hardware_score) : Number(sess.hardware_score || 42);
    const cvConf = Number(cv_confidence !== undefined ? cv_confidence : (sess.cv_confidence || 0.85));

    // Spec Formula: w_q = 0.30, w_cv = 0.35, w_hw = 0.35
    let w_q = 0.30;
    let w_cv = 0.35;
    let w_hw = 0.35;

    // Down-weight CV if confidence < 0.6 and redistribute to others
    if (cvConf < 0.6) {
      const deficit = w_cv * (1.0 - cvConf);
      w_cv -= deficit;
      w_q += deficit / 2.0;
      w_hw += deficit / 2.0;
    }

    const final_score = Math.min(100, Math.max(0, Math.round(w_q * q + w_cv * cv + w_hw * hw)));

    // Category mapping: < 33 low, 33-66 moderate, > 66 high
    let risk_category = "low";
    let kl_grade = 0;
    if (final_score < 33) {
      risk_category = "low";
      kl_grade = final_score < 18 ? 0 : 1;
    } else if (final_score < 66) {
      risk_category = "moderate";
      kl_grade = 2;
    } else {
      risk_category = "high";
      kl_grade = final_score >= 82 ? 4 : 3;
    }

    // Explainable reasoning
    const explanation = [];
    if (q >= 50) {
      explanation.push(`Elevated joint pain & stiffness reported in clinical questionnaire (${Math.round(q)}/100).`);
    }
    if (cv >= 50) {
      explanation.push(`Reduced knee flexion arc and functional chair-stand power captured on video (${Math.round(cv)}/100).`);
    }
    if (hw >= 45) {
      explanation.push(`Acoustic vibroarthrographic crepitus spikes detected by contact sensor (${Math.round(hw)}/100).`);
    }
    if (explanation.length === 0) {
      explanation.push("All 3 clinical diagnostic streams are within normal, healthy parameters.");
    }

    const disclaimer = "⚠️ Clinical Screening Disclaimer: Sandy AI is an AI-assisted early risk screening tool, not a definitive diagnosis. If risk is moderate or high, consult a qualified Orthopedic Specialist or Medical Officer for clinical examination and confirmatory radiographic imaging (X-ray).";

    const sessId = session_id || crypto.randomUUID();
    if (SESSIONS.has(sessId)) {
      const rec = SESSIONS.get(sessId);
      rec.final_score = final_score;
      rec.risk_category = risk_category;
      rec.kellgren_lawrence_grade = kl_grade;
    }

    res.json({
      session_id: sessId,
      final_score,
      risk_category,
      kellgren_lawrence_grade: kl_grade,
      sub_scores: {
        questionnaire: q,
        cv,
        hardware: hw
      },
      weights_applied: {
        w_questionnaire: Number(w_q.toFixed(3)),
        w_cv: Number(w_cv.toFixed(3)),
        w_hardware: Number(w_hw.toFixed(3))
      },
      explanation,
      clinical_disclaimer: disclaimer
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SESSION RETRIEVAL
// ─────────────────────────────────────────────────────────────────────────────
app.get(["/api/session/:id", "/api/v1/session/:id"], (req, res) => {
  const session = SESSIONS.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json(session);
});

// Serve frontend build if present
const distPath = path.join(__dirname, "frontend", "dist");
app.use(express.static(distPath));

app.use((req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (require("fs").existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("Sandy AI Backend API running. Run 'npm run build --prefix frontend' to serve UI.");
  }
});

app.listen(PORT, () => {
  console.log(`Sandy AI Express Server active on http://localhost:${PORT}`);
});
