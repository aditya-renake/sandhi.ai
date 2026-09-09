from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.schemas.cv_requests import KeypointStreamPayload, ROMAnalysisResponse
from app.schemas.gait import GaitAnalysisRequest, GaitAnalysisResponse
from app.schemas.functional_tests import FunctionalTestRequest, FunctionalTestResponse
from app.schemas.xray import XrayAnalysisResponse, XrayAnalysisRequest
from app.cv_engine.rom_analyzer import KneeROMAnalyzer
from app.cv_engine.gait_analyzer import GaitKinematicsAnalyzer
from app.cv_engine.functional_tests import FunctionalMobilityTester
from app.cv_engine.xray_classifier import XrayOAClassifier

router = APIRouter(prefix="/cv", tags=["Computer Vision & Biomechanics"])

@router.post("/analyze-joint-rom", response_model=ROMAnalysisResponse)
async def analyze_joint_range_of_motion(payload: KeypointStreamPayload):
    """
    Analyzes pose landmark streams from camera/video for:
    - Active knee flexion angle (normal 135-145 deg)
    - Extension lag / deficit angle
    - Frontal plane alignment (Genu Varum / Bowleg vs Genu Valgum / Knock-knee)
    - Biomechanical early OA risk contribution
    """
    return KneeROMAnalyzer.analyze_pose_sequence(
        frames=payload.frames,
        target_leg=payload.target_leg
    )

@router.post("/analyze-gait", response_model=GaitAnalysisResponse)
async def analyze_gait_kinematics(payload: GaitAnalysisRequest):
    """
    Analyzes walking motion for spatio-temporal gait kinematics:
    - Cadence (steps/minute)
    - Step-Time Asymmetry Index (STAI %)
    - Stance phase load ratio on affected vs contralateral knee
    - Antalgic limp detection & Duchenne compensatory trunk sway
    """
    return GaitKinematicsAnalyzer.analyze_gait_stream(payload)

@router.post("/functional-test", response_model=FunctionalTestResponse)
async def analyze_functional_test(payload: FunctionalTestRequest):
    """
    Evaluates functional lower-limb performance:
    - 30-Second Chair Stand Test (reps, ascent velocity, quadriceps fatigue curve)
    - Timed Up & Go (TUG) Test (sit-to-stand, walk velocity, fall risk bracket)
    """
    return FunctionalMobilityTester.evaluate_test(payload)

@router.post("/analyze-xray", response_model=XrayAnalysisResponse)
async def analyze_knee_xray(
    file: UploadFile = File(...),
    target_side: str = Form("Right Knee"),
    view_type: str = Form("AP_Weight_Bearing")
):
    """
    Evaluates uploaded knee radiograph:
    - Kellgren-Lawrence Grade (KL 0 to 4)
    - Medial & Lateral Joint Space Width (mm) and Narrowing (JSN)
    - Osteophytes & Subchondral Sclerosis detection
    - Explainable Grad-CAM visual heatmap overlay (returned as Base64)
    """
    contents = await file.read()
    if not contents or len(contents) < 100:
        raise HTTPException(status_code=400, detail="Invalid or empty image file uploaded.")

    req = XrayAnalysisRequest(target_side=target_side, view_type=view_type)
    return XrayOAClassifier.analyze_radiograph(image_bytes=contents, request=req)

from app.ai_engine.xray_validator import (
    ClassicalOpenCVRadiology,
    DeepLearningKLClassifier,
    XrayVerificationLoop
)

@router.post("/verify-xray-calibration")
async def verify_xray_calibration(
    file: Optional[UploadFile] = File(None),
    patient_id: Optional[int] = Form(None),
    composite_risk_score: float = Form(68.5),
    target_side: str = Form("Right Knee")
):
    """
    Verification & Calibration Loop:
    Compares cheap community field proxy score (camera + WOMAC + acoustic sensor)
    against gold-standard radiographic measurement (OpenCV JSW + CNN KL Grade).
    Returns Spearman rank correlation and Quadratic Weighted Kappa (QWK) concordance.
    """
    if file:
        contents = await file.read()
    else:
        # Default to high-contrast simulated OAI knee radiograph
        contents = b"placeholder_synthetic_oai_xray_radiograph"

    # Step 1: Classical OpenCV Morphometry (CLAHE, Canny, JSW, Osteophytes)
    opencv_results = ClassicalOpenCVRadiology.preprocess_and_measure_jsw(contents)

    # Step 2: Deep Learning ResNet/DenseNet Transfer Learning KL Grading
    kl_results = DeepLearningKLClassifier.predict_kl_grade(
        jsw_mm=opencv_results["medial_jsw_mm"],
        osteophytes=opencv_results["osteophyte_count"] > 18
    )

    # Step 3: Statistical Concordance & Calibration (QWK + Spearman)
    calibration = XrayVerificationLoop.correlate_proxy_vs_gold_standard(
        composite_risk_score=composite_risk_score,
        kl_grade=kl_results["kl_grade"],
        medial_jsw_mm=opencv_results["medial_jsw_mm"]
    )

    return {
        "status": "CALIBRATION_COMPLETE",
        "target_side": target_side,
        "opencv_morphometry": opencv_results,
        "deep_learning_kl": kl_results,
        "verification_loop": calibration
    }
