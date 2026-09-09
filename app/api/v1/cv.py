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
