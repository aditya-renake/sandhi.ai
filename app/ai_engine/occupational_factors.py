from typing import Dict, Any, Tuple

class NEROccupationalRiskModel:
    """Calculates biomechanical joint loading multipliers based on North Eastern geography & occupations."""

    TERRAIN_MULTIPLIERS: Dict[str, float] = {
        "Hilly/Steep": 1.45,             # Mizoram, Nagaland, Meghalaya hills (eccentric knee loading on descent)
        "High Altitude Mountain": 1.55,  # Arunachal Pradesh, Sikkim
        "Foothills": 1.25,               # Upper Assam, Karbi Anglong, Tripura hills
        "Valley/Plains": 1.00            # Brahmaputra valley, Barak valley, Imphal valley
    }

    OCCUPATION_STRAIN_PROFILES: Dict[str, Dict[str, Any]] = {
        "Tea Garden Worker": {
            "base_risk": 35.0,
            "load_multiplier": 1.40,      # Back basket carrying (Doko/Tukuri) on hilly terrain
            "squatting_impact": 1.30,
            "primary_stress": "Medial compartment tibiofemoral compressive overload",
            "ergonomic_advice": [
                "Distribute tea basket weight with padded dual-shoulder harnesses instead of head-strap.",
                "Take 5-minute micro-breaks every 90 minutes to stretch quadriceps and calves.",
                "Use trekking/bamboo poles when navigating steep tea garden slopes to absorb 20-25% knee impact."
            ]
        },
        "Terrace Farmer": {
            "base_risk": 32.0,
            "load_multiplier": 1.35,      # Step-terrace climbing with heavy agricultural produce
            "squatting_impact": 1.45,
            "primary_stress": "Patellofemoral and medial joint shear stress during slope ascent",
            "ergonomic_advice": [
                "Avoid deep squatting during weeding; use a low stool or kneeling pad with knee cushions.",
                "Utilize zig-zag path patterns when descending steep terrace bunds."
            ]
        },
        "Hill Porter": {
            "base_risk": 42.0,
            "load_multiplier": 1.65,      # Sustained 25-40kg loads on head/back across mountain steps
            "squatting_impact": 1.20,
            "primary_stress": "Severe axial joint cartilage compaction and early joint space loss",
            "ergonomic_advice": [
                "Limit single continuous carry loads to under 30% of body weight where possible.",
                "Incorporate hip abductor and core strengthening to stabilize pelvis during load carry."
            ]
        },
        "Handloom Weaver": {
            "base_risk": 22.0,
            "load_multiplier": 1.05,
            "squatting_impact": 1.40,      # Prolonged static knee flexion on floor/bench looms
            "primary_stress": "Patellofemoral joint stiffness and flexor contracture risk",
            "ergonomic_advice": [
                "Perform seated knee extension pumps every 45 minutes of loom operation.",
                "Modify loom bench height to ensure 90-degree hip-knee angle without extreme acute flexion."
            ]
        },
        "Forest Forager": {
            "base_risk": 28.0,
            "load_multiplier": 1.30,
            "squatting_impact": 1.25,
            "primary_stress": "Rotational knee torque on uneven forest undergrowth",
            "ergonomic_advice": [
                "Wear high-traction, shock-absorbing footwear.",
                "Perform ankle stability exercises to prevent compensatory knee strain on uneven terrain."
            ]
        },
        "Elderly Dependent": {
            "base_risk": 25.0,
            "load_multiplier": 1.00,
            "squatting_impact": 1.20,
            "primary_stress": "Age-related sarcopenia and joint stiffness",
            "ergonomic_advice": [
                "Install grab bars in bathrooms and near steps.",
                "Perform gentle chair-based range of motion exercises twice daily."
            ]
        },
        "Other / General": {
            "base_risk": 15.0,
            "load_multiplier": 1.00,
            "squatting_impact": 1.00,
            "primary_stress": "Standard daily activities",
            "ergonomic_advice": [
                "Maintain healthy body weight and 30 minutes of low-impact walking daily."
            ]
        }
    }

    @classmethod
    def calculate_occupational_score(
        cls,
        occupation: str,
        terrain_type: str,
        daily_heavy_load_hours: float,
        squatting_hours: float
    ) -> Tuple[float, Dict[str, Any]]:
        occ_data = cls.OCCUPATION_STRAIN_PROFILES.get(occupation, cls.OCCUPATION_STRAIN_PROFILES["Other / General"])
        terrain_mult = cls.TERRAIN_MULTIPLIERS.get(terrain_type, 1.0)

        # Calculate composite occupational strain score (0 - 100)
        base = occ_data["base_risk"]
        load_contribution = min(30.0, (daily_heavy_load_hours / 8.0) * 30.0 * occ_data["load_multiplier"])
        squat_contribution = min(25.0, (squatting_hours / 6.0) * 25.0 * occ_data["squatting_impact"])

        raw_score = (base + load_contribution + squat_contribution) * (terrain_mult / 1.2)
        final_score = min(100.0, round(raw_score, 1))

        return final_score, occ_data
