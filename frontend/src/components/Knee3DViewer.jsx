import { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { 
  Eye, 
  RotateCw, 
  Maximize2, 
  Layers, 
  Sparkles, 
  Activity, 
  Info,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle
} from "lucide-react"

export default function Knee3DViewer({
  klGrade = 0,
  medialJswMm = 4.8,
  lateralJswMm = 5.2,
  osteophytes = "None",
  sclerosis = false,
  varusAngle = 0,
  confidence = 0.92,
  targetSide = "Right Knee",
  className = ""
}) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const animFrameIdRef = useRef(null)

  // 3D Object Refs for dynamic morphing
  const femurGroupRef = useRef(null)
  const tibiaGroupRef = useRef(null)
  const fibulaGroupRef = useRef(null)
  const patellaMeshRef = useRef(null)
  const medialMeniscusRef = useRef(null)
  const lateralMeniscusRef = useRef(null)
  const osteophyteSpursRef = useRef([])
  const sclerosisPlatesRef = useRef([])
  const ligamentsGroupRef = useRef(null)

  // Camera animation target
  const targetCamPosRef = useRef(new THREE.Vector3(0, 0, 13))
  const isTransitioningCamRef = useRef(false)

  // View States
  const [activeView, setActiveView] = useState("AP") // 'AP' | 'LATERAL' | 'POSTERIOR' | 'SKYLINE' | 'ORBIT'
  const [autoRotate, setAutoRotate] = useState(false)
  const [showCartilage, setShowCartilage] = useState(true)
  const [showLigaments, setShowLigaments] = useState(true)
  const [showOsteophytes, setShowOsteophytes] = useState(true)
  const [showStressHeatmap, setShowStressHeatmap] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(true)

  // Calculate dynamic biomechanical parameters from X-ray inputs
  const jswRatio = Math.max(0.15, Math.min(1.0, medialJswMm / 4.8))
  const latRatio = Math.max(0.25, Math.min(1.0, lateralJswMm / 5.2))
  const calculatedVarusDeg = varusAngle || Math.max(0, Math.round((lateralJswMm - medialJswMm) * 2.8 * 10) / 10)
  const isBoneOnBone = medialJswMm <= 1.3 || klGrade === 4
  const hasSpurs = osteophytes !== "None" && klGrade >= 1

  // ── VIEW PRESETS ──
  const setCameraView = useCallback((view) => {
    setActiveView(view)
    if (!controlsRef.current || !cameraRef.current) return

    controlsRef.current.target.set(0, 0, 0)
    isTransitioningCamRef.current = true

    if (view === "AP") {
      targetCamPosRef.current.set(0, 0.2, 13)
    } else if (view === "LATERAL") {
      targetCamPosRef.current.set(13, 0.4, 0.5)
    } else if (view === "POSTERIOR") {
      targetCamPosRef.current.set(0, 0.2, -13)
    } else if (view === "SKYLINE") {
      targetCamPosRef.current.set(0, 12, 2.5)
    } else if (view === "ORBIT") {
      isTransitioningCamRef.current = false
    }
  }, [])

  // ── INITIALIZE THREE.JS SCENE ──
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 600
    const height = container.clientHeight || 500

    // 1. Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a101d) // High-contrast deep slate navy
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(0, 0.2, 13)
    cameraRef.current = camera

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 6
    controls.maxDistance = 24
    controls.maxPolarAngle = Math.PI * 0.95
    controlsRef.current = controls

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4)
    keyLight.position.set(8, 12, 10)
    keyLight.castShadow = true
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.75) // Cool clinical rim light
    fillLight.position.set(-10, -4, -6)
    scene.add(fillLight)

    const backLight = new THREE.DirectionalLight(0xf8fafc, 0.6)
    backLight.position.set(0, -10, 8)
    scene.add(backLight)

    // ── ANATOMICAL BONE MATERIALS ──
    const boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.38,
      metalness: 0.06,
      bumpScale: 0.05
    })

    const scleroticBoneMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.08, // High polished eburnation sheen
      metalness: 0.25,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.18
    })

    // ── BUILD PROCEDURAL ANATOMICAL KNEE ──
    const rootKneeGroup = new THREE.Group()
    scene.add(rootKneeGroup)

    // A. FEMUR (Distal Thigh Bone)
    const femurGroup = new THREE.Group()
    femurGroupRef.current = femurGroup
    rootKneeGroup.add(femurGroup)

    // Femoral Shaft
    const shaftGeom = new THREE.CylinderGeometry(1.2, 1.45, 5.0, 32)
    const shaftMesh = new THREE.Mesh(shaftGeom, boneMaterial)
    shaftMesh.position.y = 3.6
    shaftMesh.castShadow = true
    femurGroup.add(shaftMesh)

    // Distal Metaphysis Flare
    const flareGeom = new THREE.CylinderGeometry(1.45, 2.3, 1.6, 32)
    const flareMesh = new THREE.Mesh(flareGeom, boneMaterial)
    flareMesh.position.y = 1.3
    femurGroup.add(flareMesh)

    // Medial Femoral Condyle (Left in right-knee AP view)
    const medCondyleGeom = new THREE.SphereGeometry(1.35, 32, 24)
    medCondyleGeom.scale(1.0, 1.15, 1.4)
    const medCondyleMesh = new THREE.Mesh(medCondyleGeom, boneMaterial)
    medCondyleMesh.position.set(-1.18, 0.45, -0.15)
    medCondyleMesh.castShadow = true
    femurGroup.add(medCondyleMesh)

    // Lateral Femoral Condyle
    const latCondyleGeom = new THREE.SphereGeometry(1.3, 32, 24)
    latCondyleGeom.scale(1.0, 1.12, 1.35)
    const latCondyleMesh = new THREE.Mesh(latCondyleGeom, boneMaterial)
    latCondyleMesh.position.set(1.18, 0.48, -0.15)
    latCondyleMesh.castShadow = true
    femurGroup.add(latCondyleMesh)

    // Trochlear Groove (Anterior patellar articulation)
    const trochleaGeom = new THREE.BoxGeometry(1.4, 1.2, 0.6)
    const trochleaMesh = new THREE.Mesh(trochleaGeom, boneMaterial)
    trochleaMesh.position.set(0, 0.9, 0.95)
    trochleaMesh.rotation.x = 0.25
    femurGroup.add(trochleaMesh)

    // B. TIBIA (Proximal Shin Bone)
    const tibiaGroup = new THREE.Group()
    tibiaGroupRef.current = tibiaGroup
    rootKneeGroup.add(tibiaGroup)

    // Tibial Plateau (Medial articular basin)
    const medPlateauGeom = new THREE.CylinderGeometry(1.35, 1.45, 0.65, 32)
    medPlateauGeom.scale(1.0, 1.0, 1.25)
    const medPlateauMesh = new THREE.Mesh(medPlateauGeom, boneMaterial)
    medPlateauMesh.position.set(-1.18, -0.9, 0)
    medPlateauMesh.receiveShadow = true
    tibiaGroup.add(medPlateauMesh)

    // Tibial Plateau (Lateral articular basin)
    const latPlateauGeom = new THREE.CylinderGeometry(1.3, 1.4, 0.65, 32)
    latPlateauGeom.scale(1.0, 1.0, 1.2)
    const latPlateauMesh = new THREE.Mesh(latPlateauGeom, boneMaterial)
    latPlateauMesh.position.set(1.18, -0.9, 0)
    latPlateauMesh.receiveShadow = true
    tibiaGroup.add(latPlateauMesh)

    // Intercondylar Eminence (Tibial Spine / Tubercles)
    const spineGeom = new THREE.ConeGeometry(0.35, 0.65, 16)
    const spineMedial = new THREE.Mesh(spineGeom, boneMaterial)
    spineMedial.position.set(-0.25, -0.42, 0.05)
    tibiaGroup.add(spineMedial)

    const spineLateral = new THREE.Mesh(spineGeom, boneMaterial)
    spineLateral.position.set(0.25, -0.44, 0.05)
    tibiaGroup.add(spineLateral)

    // Tibial Tuberosity (Anterior bump)
    const tuberosityGeom = new THREE.BoxGeometry(0.85, 1.1, 0.65)
    const tuberosityMesh = new THREE.Mesh(tuberosityGeom, boneMaterial)
    tuberosityMesh.position.set(0, -1.9, 1.1)
    tuberosityMesh.rotation.x = -0.3
    tibiaGroup.add(tuberosityMesh)

    // Tibial Proximal Flare & Shaft
    const tibFlareGeom = new THREE.CylinderGeometry(2.35, 1.35, 1.8, 32)
    const tibFlareMesh = new THREE.Mesh(tibFlareGeom, boneMaterial)
    tibFlareMesh.position.y = -1.9
    tibiaGroup.add(tibFlareMesh)

    const tibShaftGeom = new THREE.CylinderGeometry(1.35, 1.15, 4.6, 32)
    const tibShaftMesh = new THREE.Mesh(tibShaftGeom, boneMaterial)
    tibShaftMesh.position.y = -4.8
    tibShaftMesh.castShadow = true
    tibiaGroup.add(tibShaftMesh)

    // C. FIBULA (Lateral Slender Bone)
    const fibulaGroup = new THREE.Group()
    fibulaGroupRef.current = fibulaGroup
    rootKneeGroup.add(fibulaGroup)

    const fibHeadGeom = new THREE.SphereGeometry(0.65, 24, 20)
    fibHeadGeom.scale(0.9, 1.25, 0.9)
    const fibHeadMesh = new THREE.Mesh(fibHeadGeom, boneMaterial)
    fibHeadMesh.position.set(2.45, -1.6, -0.3)
    fibulaGroup.add(fibHeadMesh)

    const fibShaftGeom = new THREE.CylinderGeometry(0.38, 0.32, 5.2, 24)
    const fibShaftMesh = new THREE.Mesh(fibShaftGeom, boneMaterial)
    fibShaftMesh.position.set(2.5, -4.5, -0.3)
    fibulaGroup.add(fibShaftMesh)

    // D. PATELLA (Kneecap)
    const patellaGeom = new THREE.SphereGeometry(1.05, 32, 24)
    patellaGeom.scale(1.15, 1.35, 0.55)
    const patellaMesh = new THREE.Mesh(patellaGeom, boneMaterial)
    patellaMesh.position.set(0, 0.75, 1.85)
    patellaMesh.castShadow = true
    patellaMeshRef.current = patellaMesh
    rootKneeGroup.add(patellaMesh)

    // E. ARTICULAR CARTILAGE / MENISCI (DYNAMIC CUSHION)
    // Medial Meniscus (C-Shaped pad)
    const medMeniscusGeom = new THREE.TorusGeometry(0.95, 0.32, 16, 32, Math.PI * 1.5)
    const medMeniscusMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.88,
      roughness: 0.15,
      transmission: 0.35,
      thickness: 0.5
    })
    const medMeniscus = new THREE.Mesh(medMeniscusGeom, medMeniscusMat)
    medMeniscus.rotation.x = Math.PI / 2
    medMeniscus.rotation.z = Math.PI * 0.25
    medMeniscus.position.set(-1.18, -0.55, 0)
    medialMeniscusRef.current = medMeniscus
    rootKneeGroup.add(medMeniscus)

    // Lateral Meniscus (O-Shaped pad)
    const latMeniscusGeom = new THREE.TorusGeometry(0.9, 0.32, 16, 32, Math.PI * 1.8)
    const latMeniscusMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.88,
      roughness: 0.15,
      transmission: 0.35,
      thickness: 0.5
    })
    const latMeniscus = new THREE.Mesh(latMeniscusGeom, latMeniscusMat)
    latMeniscus.rotation.x = Math.PI / 2
    latMeniscus.position.set(1.18, -0.55, 0)
    lateralMeniscusRef.current = latMeniscus
    rootKneeGroup.add(latMeniscus)

    // F. OSTEOPHYTES (BONE SPURS)
    const spurs = []
    const spurMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      roughness: 0.6,
      metalness: 0.1
    })

    // Medial Tibial Spur
    const spur1Geom = new THREE.ConeGeometry(0.42, 0.85, 12)
    const spur1 = new THREE.Mesh(spur1Geom, spurMat)
    spur1.rotation.z = Math.PI / 2 + 0.3
    spur1.position.set(-2.45, -0.75, 0.1)
    rootKneeGroup.add(spur1)
    spurs.push(spur1)

    // Medial Femoral Spur
    const spur2Geom = new THREE.ConeGeometry(0.38, 0.75, 12)
    const spur2 = new THREE.Mesh(spur2Geom, spurMat)
    spur2.rotation.z = Math.PI / 2 - 0.2
    spur2.position.set(-2.4, 0.35, 0.1)
    rootKneeGroup.add(spur2)
    spurs.push(spur2)

    // Lateral Tibial Spur
    const spur3Geom = new THREE.ConeGeometry(0.35, 0.7, 12)
    const spur3 = new THREE.Mesh(spur3Geom, spurMat)
    spur3.rotation.z = -Math.PI / 2 - 0.2
    spur3.position.set(2.4, -0.78, 0.0)
    rootKneeGroup.add(spur3)
    spurs.push(spur3)

    osteophyteSpursRef.current = spurs

    // G. SUBCHONDRAL SCLEROSIS PLATE (Medial eburnation disk)
    const sclerosisGeom = new THREE.CylinderGeometry(0.9, 0.9, 0.15, 24)
    const sclerosisMesh = new THREE.Mesh(sclerosisGeom, scleroticBoneMaterial)
    sclerosisMesh.position.set(-1.18, -0.58, 0)
    sclerosisMesh.visible = false
    rootKneeGroup.add(sclerosisMesh)
    sclerosisPlatesRef.current = [sclerosisMesh]

    // H. LIGAMENTS (ACL, PCL, MCL, LCL, Patellar Tendon)
    const ligGroup = new THREE.Group()
    ligamentsGroupRef.current = ligGroup
    rootKneeGroup.add(ligGroup)

    const ligMat = new THREE.MeshStandardMaterial({
      color: 0xfbcfe8,
      transparent: true,
      opacity: 0.75,
      roughness: 0.3
    })

    // MCL (Medial Collateral Ligament)
    const mclGeom = new THREE.CylinderGeometry(0.18, 0.22, 2.9, 16)
    const mclMesh = new THREE.Mesh(mclGeom, ligMat)
    mclMesh.position.set(-2.42, -0.15, 0)
    mclMesh.rotation.z = 0.08
    ligGroup.add(mclMesh)

    // LCL (Lateral Collateral Ligament)
    const lclGeom = new THREE.CylinderGeometry(0.15, 0.18, 3.2, 16)
    const lclMesh = new THREE.Mesh(lclGeom, ligMat)
    lclMesh.position.set(2.42, -0.3, -0.1)
    lclMesh.rotation.z = -0.12
    ligGroup.add(lclMesh)

    // ACL (Anterior Cruciate Ligament)
    const aclGeom = new THREE.CylinderGeometry(0.2, 0.2, 2.1, 16)
    const aclMesh = new THREE.Mesh(aclGeom, ligMat)
    aclMesh.position.set(-0.15, -0.05, 0.1)
    aclMesh.rotation.x = -0.4
    aclMesh.rotation.z = 0.5
    ligGroup.add(aclMesh)

    // Patellar Tendon (connects patella to tibial tuberosity)
    const tendonGeom = new THREE.BoxGeometry(0.65, 1.8, 0.18)
    const tendonMesh = new THREE.Mesh(tendonGeom, ligMat)
    tendonMesh.position.set(0, -0.65, 1.6)
    tendonMesh.rotation.x = -0.32
    ligGroup.add(tendonMesh)

    // ── ANIMATION & RENDER LOOP ──
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate)

      // Smooth camera interpolation for view transitions
      if (isTransitioningCamRef.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, 0.08)
        controlsRef.current.update()
        if (cameraRef.current.position.distanceTo(targetCamPosRef.current) < 0.05) {
          isTransitioningCamRef.current = false
        }
      } else if (controlsRef.current) {
        if (autoRotate) {
          rootKneeGroup.rotation.y += 0.008
        }
        controlsRef.current.update()
      }

      renderer.render(scene, camera)
    }

    animate()

    // ── WINDOW RESIZE HANDLER ──
    const handleResize = () => {
      if (!container || !renderer || !camera) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [autoRotate])

  // ── DYNAMIC MORPHING BASED ON X-RAY DIAGNOSTICS ──
  useEffect(() => {
    if (!femurGroupRef.current || !tibiaGroupRef.current) return

    // 1. Joint Space Clearance & Varus Tilt Morphing
    // Healthy medial space is 4.8mm. As medial space narrows, the femur drops and tilts inward.
    const verticalGapOffset = (medialJswMm / 4.8) * 0.45 - 0.45 // 0 at 4.8mm, -0.45 at 0mm
    femurGroupRef.current.position.y = verticalGapOffset

    // Varus mechanical axis tilt (lateral space preserved while medial collapses)
    const tiltRadians = Math.max(0, (lateralJswMm - medialJswMm) * 0.038)
    femurGroupRef.current.rotation.z = -tiltRadians * 0.6
    tibiaGroupRef.current.rotation.z = tiltRadians * 0.4

    // 2. Cartilage / Meniscus Erosion & Degradation Colors
    if (medialMeniscusRef.current && lateralMeniscusRef.current) {
      medialMeniscusRef.current.visible = showCartilage
      lateralMeniscusRef.current.visible = showCartilage

      // Scale meniscus thickness with actual mm measurement
      const medThickScale = Math.max(0.12, medialJswMm / 4.8)
      const latThickScale = Math.max(0.35, lateralJswMm / 5.2)

      medialMeniscusRef.current.scale.set(1.0, 1.0, medThickScale)
      lateralMeniscusRef.current.scale.set(1.0, 1.0, latThickScale)

      // Color coding of cartilage degeneration:
      // KL 0: Cyan/Blue (Healthy) | KL 1: Green | KL 2: Amber/Yellow | KL 3: Orange | KL 4: Red/Bone-on-Bone
      let cartilageHex = 0x06b6d4
      let cartilageOpacity = 0.88

      if (klGrade === 1) {
        cartilageHex = 0x10b981 // Mild
        cartilageOpacity = 0.82
      } else if (klGrade === 2) {
        cartilageHex = 0xfacc15 // Moderate thinning
        cartilageOpacity = 0.75
      } else if (klGrade === 3) {
        cartilageHex = 0xf97316 // Marked degradation
        cartilageOpacity = 0.65
      } else if (klGrade === 4) {
        cartilageHex = 0xef4444 // Severe collapse / bone-on-bone
        cartilageOpacity = 0.50
        // In Grade 4, medial meniscus is almost completely worn away
        medialMeniscusRef.current.scale.set(0.65, 0.65, 0.12)
      }

      medialMeniscusRef.current.material.color.setHex(cartilageHex)
      medialMeniscusRef.current.material.opacity = cartilageOpacity
      lateralMeniscusRef.current.material.color.setHex(klGrade >= 3 ? 0xfacc15 : 0x06b6d4)
    }

    // 3. Dynamic Osteophyte Bone Spurs
    if (osteophyteSpursRef.current.length > 0) {
      const spurScale = !showOsteophytes || klGrade === 0 ? 0.0001 : 
                        klGrade === 1 ? 0.35 : 
                        klGrade === 2 ? 0.70 : 
                        klGrade === 3 ? 1.15 : 1.55

      osteophyteSpursRef.current.forEach((spur) => {
        spur.visible = showOsteophytes && klGrade > 0
        spur.scale.set(spurScale, spurScale, spurScale)
        // Tint spurs based on severity
        if (klGrade >= 3) {
          spur.material.color.setHex(0xf59e0b)
        } else {
          spur.material.color.setHex(0xfef08a)
        }
      })
    }

    // 4. Subchondral Sclerosis (Eburnation) Plates
    if (sclerosisPlatesRef.current.length > 0) {
      sclerosisPlatesRef.current.forEach((plate) => {
        plate.visible = (sclerosis || klGrade >= 3)
      })
    }

    // 5. Ligaments Visibility
    if (ligamentsGroupRef.current) {
      ligamentsGroupRef.current.visible = showLigaments
    }

    // 6. Patella Visibility
    if (patellaMeshRef.current) {
      patellaMeshRef.current.visible = activeView !== "POSTERIOR"
    }

    // 7. Stress / Heatmap Mode
    if (femurGroupRef.current && tibiaGroupRef.current) {
      const boneMat = femurGroupRef.current.children[0].material
      if (showStressHeatmap) {
        boneMat.color.setHex(0x1e293b)
        boneMat.emissive.setHex(klGrade >= 3 ? 0xdc2626 : klGrade >= 2 ? 0xf59e0b : 0x0284c7)
        boneMat.emissiveIntensity = 0.45
      } else {
        boneMat.color.setHex(0xf1f5f9)
        boneMat.emissive.setHex(0x000000)
        boneMat.emissiveIntensity = 0.0
      }
    }
  }, [
    klGrade, 
    medialJswMm, 
    lateralJswMm, 
    osteophytes, 
    sclerosis, 
    showCartilage, 
    showLigaments, 
    showOsteophytes, 
    showStressHeatmap,
    activeView
  ])

  return (
    <div className={`relative flex flex-col rounded-2xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-2xl ${className}`}>
      
      {/* ── TOP HEADER & VIEW TOGGLES ── */}
      <div className="absolute top-0 inset-x-0 z-20 flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span>LIVE 3D KNEE DIGITAL TWIN</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            {targetSide} &bull; KL-{klGrade} Morphometry
          </span>
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setCameraView("AP")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === "AP"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title="Anterior-Posterior (Frontal Standing View)"
          >
            AP (Front)
          </button>
          <button
            type="button"
            onClick={() => setCameraView("LATERAL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === "LATERAL"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title="Lateral (Side Sagittal View)"
          >
            Lateral
          </button>
          <button
            type="button"
            onClick={() => setCameraView("POSTERIOR")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === "POSTERIOR"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title="Posterior (Back View)"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setCameraView("SKYLINE")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === "SKYLINE"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title="Skyline / Axial (Top-Down Patellofemoral View)"
          >
            Skyline
          </button>
          <button
            type="button"
            onClick={() => {
              setAutoRotate((prev) => !prev)
              setActiveView("ORBIT")
            }}
            className={`p-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              autoRotate ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title="Toggle 360° Continuous Turntable Rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── 3D CANVAS VIEWPORT ── */}
      <div 
        ref={mountRef} 
        className="w-full h-[420px] sm:h-[480px] md:h-[540px] cursor-grab active:cursor-grabbing touch-none"
      />

      {/* ── LIVE HUD CLINICAL CALLOUTS ── */}
      {showAnnotations && (
        <div className="absolute top-16 left-3 z-10 flex flex-col gap-1.5 pointer-events-none select-none">
          {/* Medial Joint Space Width HUD */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg">
            <span className={`w-2.5 h-2.5 rounded-full ${
              medialJswMm >= 4.0 ? "bg-emerald-400" :
              medialJswMm >= 2.8 ? "bg-amber-400" : "bg-rose-500 animate-ping"
            }`} />
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Medial JSW (Weight Bearing)</p>
              <p className="text-sm font-black text-white font-mono">
                {medialJswMm.toFixed(1)} <span className="text-xs font-normal text-slate-400">mm</span>
                {medialJswMm < 2.0 && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    BONE-ON-BONE
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Lateral Joint Space Width HUD */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Lateral Compartment</p>
              <p className="text-sm font-black text-white font-mono">
                {lateralJswMm.toFixed(1)} <span className="text-xs font-normal text-slate-400">mm</span>
              </p>
            </div>
          </div>

          {/* Varus Alignment Tilt Angle */}
          {calculatedVarusDeg > 0.5 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-600/50 backdrop-blur-md shadow-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] text-amber-300 font-medium uppercase tracking-wider">Genu Varum (Bowleg Tilt)</p>
                <p className="text-sm font-black text-amber-200 font-mono">
                  {calculatedVarusDeg.toFixed(1)}° <span className="text-[11px] font-normal text-amber-300">Medial Bias</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BOTTOM HUD & LAYER CONTROLS ── */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-auto">
        {/* Layer Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowCartilage((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
              showCartilage 
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" 
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            Cartilage
          </button>
          <button
            type="button"
            onClick={() => setShowLigaments((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
              showLigaments 
                ? "bg-pink-500/20 text-pink-300 border-pink-500/40" 
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            Ligaments
          </button>
          <button
            type="button"
            onClick={() => setShowOsteophytes((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
              showOsteophytes 
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            Bone Spurs
          </button>
          <button
            type="button"
            onClick={() => setShowStressHeatmap((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
              showStressHeatmap 
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40" 
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            Stress Map
          </button>
        </div>

        {/* Interaction Hint */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Eye className="w-3.5 h-3.5 text-teal-400" />
          <span>Click & Drag to Rotate &bull; Scroll to Zoom</span>
        </div>
      </div>
    </div>
  )
}
