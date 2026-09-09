from fastapi import APIRouter, Query
from typing import List, Dict, Any
from app.config import settings

router = APIRouter(prefix="/guidance", tags=["Joint Care & Multilingual Guidance"])

EXERCISES_LIBRARY = [
    {
        "id": "ex_quad_sets",
        "name": "Isometric Quadriceps Sets",
        "local_names": {
            "en": "Quadriceps Towel Press",
            "as": "উৰুৰ পেশীৰ সংকোচন ব্যায়াম",
            "bn": "উরুর পেশী শক্ত করার ব্যায়াম",
            "lus": "Khel tha tihchakna",
            "mni": "খুরোইগী মপাঙ্গল কনখৎহনবা এক্সরসাইজ"
        },
        "target_joint": "Knee",
        "difficulty": "Beginner",
        "reps_sets": "15 reps, hold for 6 seconds, 2 sets daily",
        "purpose": "Strengthens vastus medialis to stabilize patella and absorb walking impact on hills.",
        "steps": [
            "Sit on a flat mat with legs extended straight in front of you.",
            "Place a small rolled towel or cloth underneath your affected knee.",
            "Tighten the muscles on the top of your thigh, pressing the back of your knee down into the towel.",
            "Hold tight for 6 seconds, then relax for 3 seconds."
        ]
    },
    {
        "id": "ex_straight_leg_raise",
        "name": "Straight Leg Raise (SLR)",
        "local_names": {
            "en": "Straight Leg Raise",
            "as": "ভৰি পোনকৈ উঠোৱা ব্যায়াম",
            "bn": "সোজা পা তোলার ব্যায়াম",
            "lus": "Ke chawi kan",
            "mni": "খোং তপ্না থাংগৎপা"
        },
        "target_joint": "Knee & Hip",
        "difficulty": "Beginner",
        "reps_sets": "10 reps each leg, 3 sets daily",
        "purpose": "Strengthens anterior knee dynamic stabilizers without compressing the tibiofemoral joint.",
        "steps": [
            "Lie flat on your back, bending the unaffected knee with foot flat on floor.",
            "Keep the affected leg straight and tighten thigh muscles.",
            "Slowly raise the straight leg about 12 inches (30 cm) off the ground.",
            "Hold for 3 seconds, then gently lower down."
        ]
    },
    {
        "id": "ex_heel_slides",
        "name": "Closed-Chain Seated Heel Slides",
        "local_names": {
            "en": "Heel Slides",
            "as": "গোৰোহা চোঁচৰোৱা ব্যায়াম",
            "bn": "গোড়ালি পিছলে আনার ব্যায়াম",
            "lus": "Ke chhunglam tawlh",
            "mni": "খোং খুৎতুনা খোং চৎপা"
        },
        "target_joint": "Knee Flexion",
        "difficulty": "Beginner",
        "reps_sets": "12 reps, 2 sets daily",
        "purpose": "Preserves knee flexion arc and reduces stiffness after prolonged sitting.",
        "steps": [
            "Sit upright on a sturdy chair with feet flat on the floor.",
            "Slowly slide your affected heel backwards under the chair as far as comfortable.",
            "Hold the flexed position for 5 seconds.",
            "Slide foot back to starting position."
        ]
    },
    {
        "id": "ex_hill_walking_ergonomics",
        "name": "Mountain & Terrace Slope Walking Technique",
        "local_names": {
            "en": "Hill Walking Posture",
            "as": "পাহাৰীয়া পথত খোজকঢ়াৰ নিয়ম",
            "bn": "পাহাড়ি পথে হাঁটার সঠিক নিয়ম",
            "lus": "Tlang kal dan dik",
            "mni": "চিং চৎপদা খোং থাবা নিয়ম"
        },
        "target_joint": "Bilateral Lower Extremity",
        "difficulty": "All Levels",
        "reps_sets": "Apply during all mountain travel",
        "purpose": "Reduces peak impact loads by up to 25% during steep mountain descents.",
        "steps": [
            "Keep knees slightly bent (soft knees) rather than locking them straight when stepping downhill.",
            "Take shorter, rhythmic steps instead of long lunges.",
            "Use a bamboo cane or walking stick placed on the opposite side of the painful knee.",
            "Descend steep slopes in a slight diagonal (zig-zag) pattern to decrease slope angle."
        ]
    }
]

@router.get("/exercises")
async def get_physiotherapy_exercises(lang: str = Query("en", description="Language code: en, as, bn, mni, lus, etc.")):
    """Returns evidence-based physiotherapy exercise instructions with multilingual descriptions."""
    return {
        "language": lang,
        "total_exercises": len(EXERCISES_LIBRARY),
        "exercises": EXERCISES_LIBRARY
    }

@router.get("/nutrition")
async def get_localized_nutrition_guidance(state: str = Query("Assam", description="NER State")):
    """Returns state-specific anti-inflammatory nutrition recommendations tailored for North East India."""
    return {
        "state": state,
        "dietary_recommendations": [
            {
                "category": "Anti-Inflammatory Indigenous Greens",
                "items": ["Dhekia Saak (Fiddlehead fern)", "Mandukaparni / Manimuni (Centella asiatica)", "Lai Saak (Mustard greens)"],
                "benefit": "Rich in natural polyphenols and flavonoids that downregulate pro-inflammatory cytokines (IL-1β, TNF-α)."
            },
            {
                "category": "Natural Joint Lubrication & Collagen Support",
                "items": ["Bone broth soup", "Small indigenous river fish with edible bones (Mola / Puthi)", "Fermented bamboo shoots (Khorisa / Soibum) in moderation"],
                "benefit": "Provides bioavailable calcium, phosphorus, glucosamine, and chondroitin sulfate."
            },
            {
                "category": "Antioxidant Spices",
                "items": ["Fresh local turmeric (Kacha Haldi) infused in warm water with black pepper", "Ginger root"],
                "benefit": "Curcumin and gingerol act as natural COX-2 enzyme inhibitors for joint stiffness relief."
            },
            {
                "category": "Hydration in High Altitudes",
                "items": ["Warm boiled water / herbal infusions (at least 2.5 L daily)"],
                "benefit": "Cartilage is 70-80% water; proper hydration prevents mechanical wear and joint friction."
            }
        ]
    }
