import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useStore } from "../store/useStore";
import { Cpu, Users, Zap, ShieldCheck, Thermometer, Radio, Eye, Move3d, Navigation, Play, Pause, ChevronRight, ShieldAlert, Maximize2, Minimize2 } from "lucide-react";

// Map representation of equipment indices to positions in the 3D scene
const EQUIPMENT_POSITIONS: Record<string, { x: number; y: number; z: number }> = {
  "eq-turbine-01": { x: -18, y: 1.5, z: -10 },
  "eq-pump-02": { x: 18, y: 1.2, z: 12 },
  "eq-compressor-03": { x: -22, y: 1.0, z: 15 },
  "eq-gen-04": { x: 22, y: 2.0, z: -15 },
};

// 5 Real-time wandering factory workers
const FACTORY_WORKERS = [
  {
    id: "wrk-01",
    name: "A. Sahu",
    role: "AI Core Supervisor",
    team: "Neural Operations",
    color: "#00f0ff",
    initials: "AS",
    vitalHeartRate: 74,
    vitalOxygen: "99%",
    path: [
      { x: -12, y: 0.5, z: -8 },
      { x: 10, y: 0.5, z: -8 },
      { x: 10, y: 0.5, z: 10 },
      { x: -12, y: 0.5, z: 10 }
    ],
    speed: 0.12,
    statusText: "Optimizing Central AI weights"
  },
  {
    id: "wrk-02",
    name: "R. Sharma",
    role: "Heavy Mechatronics Tech",
    team: "Robotics & Logistics",
    color: "#fbbf24",
    initials: "RS",
    vitalHeartRate: 88,
    vitalOxygen: "98%",
    path: [
      { x: -25, y: 0.5, z: 10 },
      { x: -10, y: 0.5, z: 10 },
      { x: -10, y: 0.5, z: 20 },
      { x: -25, y: 0.5, z: 20 }
    ],
    speed: 0.14,
    statusText: "Pre-greasing axis mechanics"
  },
  {
    id: "wrk-03",
    name: "S. Tanaka",
    role: "Thermo System Auditor",
    team: "Vent Mitigation",
    color: "#22d3ee",
    initials: "ST",
    vitalHeartRate: 71,
    vitalOxygen: "97%",
    path: [
      { x: 12, y: 0.5, z: -15 },
      { x: 25, y: 0.5, z: -15 },
      { x: 25, y: 0.5, z: -5 },
      { x: 12, y: 0.5, z: -5 }
    ],
    speed: 0.09,
    statusText: "Analyzing gas backpressure"
  },
  {
    id: "wrk-04",
    name: "D. Miller",
    role: "Research Physicist",
    team: "Adversarial Stress Lab",
    color: "#c084fc",
    initials: "DM",
    vitalHeartRate: 75,
    vitalOxygen: "100%",
    path: [
      { x: 5, y: 0.5, z: 12 },
      { x: 20, y: 0.5, z: 12 },
      { x: 20, y: 0.5, z: 22 },
      { x: 5, y: 0.5, z: 22 }
    ],
    speed: 0.08,
    statusText: "Simulating material shear loads"
  },
  {
    id: "wrk-05",
    name: "L. Vance",
    role: "Supergrid Dispatcher",
    team: "Superconductive Grid",
    color: "#f43f5e",
    initials: "LV",
    vitalHeartRate: 85,
    vitalOxygen: "99%",
    path: [
      { x: -25, y: 0.5, z: -15 },
      { x: -10, y: 0.5, z: -15 },
      { x: -10, y: 0.5, z: -5 },
      { x: -25, y: 0.5, z: -5 }
    ],
    speed: 0.16,
    statusText: "Aligning cryogen valves"
  }
];

export default function Factory3DMap() {
  const { equipment, readings, predictions } = useStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interaction State
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [ticker, setTicker] = useState<number>(0);
  const [isFullscreenSafetyPortal, setIsFullscreenSafetyPortal] = useState<boolean>(false);

  // Target Camera perspective values for smooth Pan & Zoom slerping
  const cameraTarget = useRef({
    pos: new THREE.Vector3(0, 32, 48),
    lookAt: new THREE.Vector3(0, 3, 0)
  });

  // Current Camera values being smoothly processed
  const cameraCurrent = useRef({
    pos: new THREE.Vector3(0, 52, 72),
    lookAt: new THREE.Vector3(0, 0, 0)
  });

  // Ref references to capture real-time values for the animation loop
  const eqStateRef = useRef(equipment);
  useEffect(() => {
    eqStateRef.current = equipment;
  }, [equipment]);

  // Keep ticker running to animate field operators
  useEffect(() => {
    let animId: number;
    const tick = () => {
      setTicker((prev) => (prev + 1) % 10000);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Toggle immersive dark safety portal fullscreen view
  const toggleSafetyPortal = () => {
    const nextState = !isFullscreenSafetyPortal;
    setIsFullscreenSafetyPortal(nextState);
    try {
      const container = document.getElementById("factory-3d-floor-container");
      if (container) {
        if (nextState) {
          if (container.requestFullscreen) {
            container.requestFullscreen().catch(() => {});
          }
        } else {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        }
      }
    } catch (err) {
      // Safe iframe dynamic sandboxed rendering fallback
    }
  };

  // Set default view helper
  const resetCameraView = () => {
    setSelectedEquipmentId(null);
    setSelectedWorkerId(null);
    cameraTarget.current.pos.set(0, 32, 48);
    cameraTarget.current.lookAt.set(0, 3, 0);
  };

  // Align camera dynamically when selected equipment changes
  useEffect(() => {
    if (selectedEquipmentId) {
      const pos = EQUIPMENT_POSITIONS[selectedEquipmentId];
      if (pos) {
        // Position camera closer at angle
        cameraTarget.current.pos.set(pos.x + 9, pos.y + 8, pos.z + 13);
        cameraTarget.current.lookAt.set(pos.x, pos.y + 1, pos.z);
      }
    }
  }, [selectedEquipmentId]);

  // Align camera dynamically when selected worker changes
  useEffect(() => {
    if (selectedWorkerId) {
      const selectedWorker = FACTORY_WORKERS.find(w => w.id === selectedWorkerId);
      if (selectedWorker) {
        // Track the current path focal coordinates of that worker.
        cameraTarget.current.pos.set(0, 24, 30);
        cameraTarget.current.lookAt.set(0, 2, 0);
      }
    }
  }, [selectedWorkerId]);

  // Initialize and run the Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = isFullscreenSafetyPortal ? (containerRef.current.clientHeight || 550) : 480;

    // 1. Scene & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0a0a0c"); // Strict brand industrial pitch black base
    scene.fog = new THREE.FogExp2("#0a0a0c", 0.018);

    // 2. Camera setup starting at initial current positioning
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.copy(cameraCurrent.current.pos);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 3. Ambient & directional light constructs
    const ambientLight = new THREE.AmbientLight("#121215", 2.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight("#ffffff", 1.8);
    dirLight.position.set(30, 60, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Overhead spotlights mimicking dramatic industrial facility bay lights
    const spotLight1 = new THREE.SpotLight("#ffffff", 4.0, 60, Math.PI / 8, 0.6, 0.8);
    spotLight1.position.set(0, 25, 0);
    spotLight1.target.position.set(0, 0, 0);
    scene.add(spotLight1);
    scene.add(spotLight1.target);

    // Flat floor blueprint grid
    const gridHelper = new THREE.GridHelper(90, 45, "#1c1c22", "#0f1012");
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Highly realistic grid lines / dark industrial plates floor
    const floorGeo = new THREE.PlaneGeometry(130, 130);
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#080809",
      roughness: 0.85,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Programmatically drawn professional HAZARD YELLOW-BLACK warning stripes
    const hazardGroup = new THREE.Group();
    scene.add(hazardGroup);
    const stripeGeo = new THREE.PlaneGeometry(35, 0.35);
    const yellowMat = new THREE.MeshBasicMaterial({ color: "#eab308" });
    const blackMat = new THREE.MeshBasicMaterial({ color: "#000000" });

    // Warning strip on the left division boundary
    for (let i = 0; i < 30; i++) {
      const stripe = new THREE.Mesh(stripeGeo, i % 2 === 0 ? yellowMat : blackMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(-15 + i * 0.35, 0.03, -15);
      stripe.rotation.z = Math.PI / 4;
      hazardGroup.add(stripe);
    }
    
    // Warning strip on the right division boundary
    for (let i = 0; i < 30; i++) {
      const stripe = new THREE.Mesh(stripeGeo, i % 2 === 0 ? yellowMat : blackMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(-15 + i * 0.35, 0.03, 15);
      stripe.rotation.z = Math.PI / 4;
      hazardGroup.add(stripe);
    }

    // ----------------------------------------------------
    // STRUCTURAL ARCHITECTURE (STEEL COLUMNS & CATWALKS)
    // ----------------------------------------------------
    const archGroup = new THREE.Group();
    scene.add(archGroup);

    // Massive dark steel support columns around the factory layout perimeter
    const colGeo = new THREE.BoxGeometry(1.6, 24, 1.6);
    const colSpikeGeo = new THREE.BoxGeometry(1.8, 0.4, 1.8);
    const columnIronMat = new THREE.MeshStandardMaterial({
      color: "#0f1013",
      roughness: 0.5,
      metalness: 0.85
    });
    const orangeCautionMat = new THREE.MeshBasicMaterial({ color: "#ea580c" });

    const columnCoords = [
      { x: -35, z: -35 }, { x: 35, z: -35 },
      { x: -35, z: 35 }, { x: 35, z: 35 },
      { x: -35, z: 0 }, { x: 35, z: 0 }
    ];

    columnCoords.forEach(coord => {
      const colGroup = new THREE.Group();
      colGroup.position.set(coord.x, 12, coord.z);

      // Core column mesh
      const colMesh = new THREE.Mesh(colGeo, columnIronMat);
      colGroup.add(colMesh);

      // Warning ring accents at intervals
      for (let h = -10; h <= 10; h += 5) {
        const ring = new THREE.Mesh(colSpikeGeo, orangeCautionMat);
        ring.position.y = h;
        colGroup.add(ring);
      }

      // Diagonal stabilizing trusses anchoring to the ground
      const braceGeo = new THREE.CylinderGeometry(0.18, 0.18, 5);
      const b1 = new THREE.Mesh(braceGeo, columnIronMat);
      b1.position.set(2, -10, 0);
      b1.rotation.z = Math.PI / 6;
      const b2 = b1.clone();
      b2.position.set(-2, -10, 0);
      b2.rotation.z = -Math.PI / 6;
      colGroup.add(b1, b2);

      archGroup.add(colGroup);
    });

    // Glass manager observation deck suspended above the floor
    const obsDeckGroup = new THREE.Group();
    obsDeckGroup.position.set(0, 8, -26);

    const deckBase = new THREE.Mesh(new THREE.BoxGeometry(24, 0.3, 6), columnIronMat);
    obsDeckGroup.add(deckBase);

    // Smart Translucent Glass railing panels
    const glassMat = new THREE.MeshStandardMaterial({
      color: "#00f0ff",
      emissive: "#00f0ff",
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.95
    });
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(24, 1.1, 0.1), glassMat);
    frontGlass.position.set(0, 0.7, 3);
    const backGlass = new THREE.Mesh(new THREE.BoxGeometry(24, 1.1, 0.1), glassMat);
    backGlass.position.set(0, 0.7, -3);
    obsDeckGroup.add(frontGlass, backGlass);

    // Steel support scaffolding poles holding the observation deck high
    for (let x = -10; x <= 10; x += 10) {
      const scaffoldLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 8, 8), columnIronMat);
      scaffoldLeg.position.set(x, -4, 0);
      obsDeckGroup.add(scaffoldLeg);
    }
    archGroup.add(obsDeckGroup);

    // Suspended catwalks linking managers' review station to left and right sectors
    const catwalkLeft = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 30), columnIronMat);
    catwalkLeft.position.set(-18, 8, -12);
    const catwalkRight = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 30), columnIronMat);
    catwalkRight.position.set(18, 8, -12);
    archGroup.add(catwalkLeft, catwalkRight);

    // Transparent smart-glass central control room booth
    const ctrlBoothGroup = new THREE.Group();
    ctrlBoothGroup.position.set(0, 9.5, -26);
    const frameGeo = new THREE.BoxGeometry(8, 3, 4);
    const boothFrame = new THREE.Mesh(frameGeo, new THREE.MeshBasicMaterial({
      color: "#00f0ff",
      wireframe: true
    }));
    const boothGlass = new THREE.Mesh(frameGeo, glassMat);
    ctrlBoothGroup.add(boothFrame, boothGlass);

    // Glowing server clusters inside the booth representing NASA diagnostics
    const deskBox = new THREE.Mesh(new THREE.BoxGeometry(4, 0.7, 1.2), columnIronMat);
    deskBox.position.set(0, -0.75, 0);
    const consoleScreenMat = new THREE.MeshBasicMaterial({ color: "#22d3ee" });
    const consoleScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), consoleScreenMat);
    consoleScreen.position.set(0, -0.1, 0.6);
    consoleScreen.rotation.x = -Math.PI / 10;
    ctrlBoothGroup.add(deskBox, consoleScreen);
    archGroup.add(ctrlBoothGroup);


    // ----------------------------------------------------
    // SECTOR 1: CENTRAL AI BRAIN CORE (Coordinates 0, 0, 0)
    // ----------------------------------------------------
    const brainGroup = new THREE.Group();
    brainGroup.position.set(0, 0, 0);
    scene.add(brainGroup);

    // Massive central server cylinder tower
    const towerCoreGeo = new THREE.CylinderGeometry(2.4, 2.8, 9.5, 24);
    const towerCoreMat = new THREE.MeshStandardMaterial({
      color: "#111317",
      roughness: 0.6,
      metalness: 0.82
    });
    const towerCore = new THREE.Mesh(towerCoreGeo, towerCoreMat);
    towerCore.position.y = 4.75;
    brainGroup.add(towerCore);

    // Glowing data light ribbons wrapped around core
    for (let l = 1; l <= 8; l++) {
      const loopRing = new THREE.Mesh(
        new THREE.CylinderGeometry(2.84, 2.84, 0.25, 24),
        new THREE.MeshBasicMaterial({ color: "#00f0ff" })
      );
      loopRing.position.y = l * 1.0;
      loopRing.name = `data_ribbon_${l}`;
      brainGroup.add(loopRing);
    }

    // Outer rotating holographic computing shell (Wireframe orb)
    const holoHarpGroup = new THREE.Group();
    holoHarpGroup.position.set(0, 11.2, 0);
    holoHarpGroup.name = "holo_neural_globe";
    const globeGeo = new THREE.SphereGeometry(1.8, 16, 16);
    const globeMat = new THREE.MeshStandardMaterial({
      color: "#00f0ff",
      emissive: "#00f0ff",
      emissiveIntensity: 1.5,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const globeInner = new THREE.Mesh(globeGeo, globeMat);
    globeInner.scale.set(0.7, 0.7, 0.7);
    const globeOuter = new THREE.Mesh(globeGeo, globeMat);
    holoHarpGroup.add(globeInner, globeOuter);
    brainGroup.add(holoHarpGroup);

    // Symmetrical supercomputer server racks adjacent to brain tower
    const rackGeo = new THREE.BoxGeometry(0.7, 5, 0.7);
    const rackMat = new THREE.MeshStandardMaterial({ color: "#050506", roughness: 0.5 });
    const rackLightMat = new THREE.MeshBasicMaterial({ color: "#22d3ee" });

    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const rack = new THREE.Mesh(rackGeo, rackMat);
      const rx = Math.sin(angle) * 4.5;
      const rz = Math.cos(angle) * 4.5;
      rack.position.set(rx, 2.5, rz);
      rack.rotation.y = angle;
      brainGroup.add(rack);

      // Blinking diagnostic indicator grids on racks
      for (let h = 0.5; h <= 4.5; h += 0.8) {
        const dot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.72), rackLightMat);
        dot.position.set(0, h - 2.5, 0);
        dot.name = "blinking_indicator";
        rack.add(dot);
      }
    }

    // Large high-altitude holographic diagnostic displays
    const screenHoloGroup = new THREE.Group();
    screenHoloGroup.position.set(0, 8, 4);
    screenHoloGroup.name = "hovering_holo_screens";
    const boardBack = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), glassMat);
    const borderLines = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(6, 3)),
      new THREE.LineBasicMaterial({ color: "#00f0ff", linewidth: 2 })
    );
    screenHoloGroup.add(boardBack, borderLines);
    brainGroup.add(screenHoloGroup);


    // ----------------------------------------------------
    // ACTIVE FLOOR CORRIDOR PIPELINES WITH TRAILING FLOW ENERGY PULSES
    // ----------------------------------------------------
    const conduitGroup = new THREE.Group();
    scene.add(conduitGroup);
    
    // Conduits color scheme matches the Energy Network instructions:
    // - Blue superconducting lines
    // - Red thermal recover vents
    // - Green pneumatic air lines
    const blueSuperMat = new THREE.MeshStandardMaterial({ color: "#0ea5e9", emissive: "#0ea5e9", emissiveIntensity: 0.6, roughness: 0.1 });
    const redThermalMat = new THREE.MeshStandardMaterial({ color: "#f43f5e", emissive: "#f43f5e", emissiveIntensity: 0.6, roughness: 0.1 });
    const greenPneumaticMat = new THREE.MeshStandardMaterial({ color: "#10b981", emissive: "#10b981", emissiveIntensity: 0.4, roughness: 0.1 });

    const conduitPositions = [
      // Sector 5 Reactor GA-2 to Core
      { start: { x: 22, y: 0.05, z: -15 }, end: { x: 0, y: 0.05, z: 0 }, mat: blueSuperMat, color: "#0ea5e9" },
      // Sector 3 Geothermal Vent C-3 to Core
      { start: { x: 18, y: 0.05, z: 12 }, end: { x: 0, y: 0.05, z: 0 }, mat: redThermalMat, color: "#f43f5e" },
      // Sector 2 Assembly Hall to Core
      { start: { x: -18, y: 0.05, z: -10 }, end: { x: 0, y: 0.05, z: 0 }, mat: greenPneumaticMat, color: "#10b981" },
      // Sector 4 Laboratory to Core
      { start: { x: -22, y: 0.05, z: 15 }, end: { x: 0, y: 0.05, z: 0 }, mat: blueSuperMat, color: "#0ea5e9" }
    ];

    conduitPositions.forEach((pos, idx) => {
      const dx = pos.end.x - pos.start.x;
      const dz = pos.end.z - pos.start.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      const pipeGeo = new THREE.CylinderGeometry(0.18, 0.18, length, 8);
      const pipe = new THREE.Mesh(pipeGeo, pos.mat);
      pipe.rotation.x = Math.PI / 2;
      pipe.rotation.y = -angle;
      pipe.position.set(pos.start.x + dx / 2, 0.15, pos.start.z + dz / 2);
      conduitGroup.add(pipe);

      // Flanged coupling joints at fractions along the line
      for (let f = 0.2; f <= 0.8; f += 0.2) {
        const ringGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.22, 12);
        const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: "#27272a", roughness: 0.5 }));
        ring.rotation.x = Math.PI / 2;
        ring.rotation.y = -angle;
        ring.position.set(pos.start.x + dx * f, 0.18, pos.start.z + dz * f);
        conduitGroup.add(ring);
      }

      // Energy Flow pulse indicators (traveling dots)
      const pulseGeo = new THREE.SphereGeometry(0.16, 10, 10);
      const pulseMat = new THREE.MeshBasicMaterial({ color: pos.color });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      pulse.name = `pulse_conduit_${idx}`;
      pulse.userData = { start: pos.start, end: pos.end, speed: 0.005 + Math.random() * 0.005, progress: Math.random() };
      conduitGroup.add(pulse);
    });


    // Overhead steel truss rails for structural facility roof depth
    const trussGroup = new THREE.Group();
    scene.add(trussGroup);
    const mainBeamGeo = new THREE.BoxGeometry(100, 0.5, 0.5);
    const steelMat = new THREE.MeshStandardMaterial({ color: "#0b0c0f", roughness: 0.5, metalness: 0.9 });

    for (let z = -30; z <= 30; z += 15) {
      const hBeam = new THREE.Mesh(mainBeamGeo, steelMat);
      hBeam.position.set(0, 18, z);
      trussGroup.add(hBeam);

      for (let x = -40; x <= 40; x += 20) {
        const diagonalGeo = new THREE.CylinderGeometry(0.14, 0.14, 6);
        const diagonalTarget = new THREE.Mesh(diagonalGeo, steelMat);
        diagonalTarget.position.set(x, 15.5, z);
        diagonalTarget.rotation.z = Math.PI / 4;
        trussGroup.add(diagonalTarget);

        const diagonal2 = new THREE.Mesh(diagonalGeo, steelMat);
        diagonal2.position.set(x, 15.5, z);
        diagonal2.rotation.z = -Math.PI / 4;
        trussGroup.add(diagonal2);
      }
    }


    // ----------------------------------------------------
    // 4. SECTORS REDEFINED AS ADVANCED MACHINERY ASSEMBLIES
    // ----------------------------------------------------
    const meshesGroup = new THREE.Group();
    scene.add(meshesGroup);

    // Dict mapping equipment ID to their Three.js mesh entities
    const equipmentMeshesMap: Record<string, THREE.Group> = {};

    Object.entries(EQUIPMENT_POSITIONS).forEach(([eqId, pos]) => {
      const eqGroup = new THREE.Group();
      eqGroup.position.set(pos.x, pos.y, pos.z);
      eqGroup.userData = { id: eqId };

      let alertStatusColor = "#4b5563"; // nominal grey
      const eqItem = eqStateRef.current.find(e => e.id === eqId);
      if (eqItem) {
        if (eqItem.status === "warning") alertStatusColor = "#d97706";
        if (eqItem.status === "critical" || eqItem.status === "emergency") alertStatusColor = "#eb5e55";
      }

      // Shared highly detailed metal materials
      const ironMat = new THREE.MeshStandardMaterial({ color: "#1f2229", roughness: 0.45, metalness: 0.85 });
      const brightMetalMat = new THREE.MeshStandardMaterial({ color: "#475569", roughness: 0.2, metalness: 0.95 });
      const darkPlateMat = new THREE.MeshStandardMaterial({ color: "#0b0c0e", roughness: 0.8, metalness: 0.6 });
      const activeCopperMat = new THREE.MeshStandardMaterial({ color: "#ea580c", roughness: 0.3, metalness: 0.9 });

      if (eqId === "eq-turbine-01") {
        // SECTOR 2: COGNITIVE ROBOTIC ASSEMBLY SWARM
        // Includes active 6-axis mechatronic articulated arm welding joint and sliding conveyor belts
        const assemblyCell = new THREE.Group();

        // 1. Heavy robotic arm base
        const armBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.8, 16), darkPlateMat);
        armBase.position.y = -0.8;
        assemblyCell.add(armBase);

        const rotationPlinth = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.6, 12), brightMetalMat);
        rotationPlinth.position.y = -0.1;
        rotationPlinth.name = "kuka_rotating_plinth";
        assemblyCell.add(rotationPlinth);

        // 2. Articulated armature segments
        const joint1Group = new THREE.Group();
        joint1Group.position.set(0, 0.2, 0);
        joint1Group.name = "kuka_joint_1";

        const limb1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 0.5), ironMat);
        limb1.position.y = 1.0;
        joint1Group.add(limb1);

        const elbowPlat = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 12), brightMetalMat);
        elbowPlat.rotation.x = Math.PI / 2;
        elbowPlat.position.y = 2.0;
        joint1Group.add(elbowPlat);

        const joint2Group = new THREE.Group();
        joint2Group.position.set(0, 2.0, 0);
        joint2Group.name = "kuka_joint_2";

        const limb2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 2.0, 0.38), brightMetalMat);
        limb2.position.set(0, 0.9, 0);
        joint2Group.add(limb2);

        // Grid scanner camera wrist
        const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), darkPlateMat);
        wrist.position.set(0, 1.9, 0);
        joint2Group.add(wrist);

        // Gripper jaws clamping a neon green core block
        const toolGripGroup = new THREE.Group();
        toolGripGroup.position.set(0, 2.1, 0);
        toolGripGroup.name = "kuka_tool";

        const weldFlameNode = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.16, 0.5), activeCopperMat);
        weldFlameNode.position.y = 0.2;
        toolGripGroup.add(weldFlameNode);

        const pieceHold = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), new THREE.MeshBasicMaterial({ color: "#22d3ee" }));
        pieceHold.position.set(0, 0.65, 0);
        toolGripGroup.add(pieceHold);

        joint2Group.add(toolGripGroup);
        joint1Group.add(joint2Group);
        assemblyCell.add(joint1Group);

        // 3. Sliding conveyor belt adjacent to arm
        const beltBase = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.8, 1.8), darkPlateMat);
        beltBase.position.set(0, -1.0, 2.5);
        assemblyCell.add(beltBase);

        // Rotating rollers at belt ends
        const rollerL = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.82), brightMetalMat);
        rollerL.rotation.x = Math.PI / 2;
        rollerL.position.set(-2.4, -0.9, 2.5);
        const rollerR = rollerL.clone();
        rollerR.position.set(2.4, -0.9, 2.5);
        assemblyCell.add(rollerL, rollerR);

        // Product Cargo being transported
        const crateCargo = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), ironMat);
        crateCargo.position.set(0, -0.1, 2.5);
        crateCargo.name = "conveyor_crate_cargo";
        assemblyCell.add(crateCargo);

        eqGroup.add(assemblyCell);

      } else if (eqId === "eq-pump-02") {
        // SECTOR 3: GEOTHERMAL HEAT CHIMNEY DUCTS
        // Large-scale curved dual-stage thermal exchangers and copper steam collectors
        const geoDuctGroup = new THREE.Group();

        // 1. Heavy high-pressure chimney cylinders
        const chimney1 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 7.5, 16), ironMat);
        chimney1.position.set(-1.2, 2.55, 0);
        
        const chimney2 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 7.5, 16), ironMat);
        chimney2.position.set(1.2, 2.55, 0);
        geoDuctGroup.add(chimney1, chimney2);

        // 2. Copper cooling manifold bands wrapped around chimneys
        for (let tier = 1.2; tier <= 5.5; tier += 1.8) {
          const wrap1 = new THREE.Mesh(new THREE.TorusGeometry(1.24, 0.16, 10, 20), activeCopperMat);
          wrap1.rotation.x = Math.PI / 2;
          wrap1.position.set(-1.2, tier, 0);
          const wrap2 = wrap1.clone();
          wrap2.position.set(1.2, tier, 0);
          geoDuctGroup.add(wrap1, wrap2);
        }

        // 3. Huge steam pressure valve release wheels
        const valveWheel = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.12, 8, 16), activeCopperMat);
        valveWheel.position.set(0, 3.0, 1.45);
        valveWheel.name = "geothermal_valve_wheel";
        const spokes = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.4, 0.15), darkPlateMat);
        spokes.position.set(0, 3.0, 1.45);
        spokes.name = "geothermal_valve_spokes";
        geoDuctGroup.add(valveWheel, spokes);

        // 4. Glowing orange warning channels representing magma thermodynamic traps
        const hotPlate = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.25, 3.0), darkPlateMat);
        hotPlate.position.y = -0.9;
        const glowingCoreLine = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 2.6), new THREE.MeshBasicMaterial({ color: "#ea580c" }));
        glowingCoreLine.position.set(0, -0.76, 0);
        geoDuctGroup.add(hotPlate, glowingCoreLine);

        eqGroup.add(geoDuctGroup);

      } else if (eqId === "eq-compressor-03") {
        // SECTOR 4: SUBTERRANEAN STRESS & HYPERTHREAT LAB
        // Secure containment bunker framing and dynamic steel press piston shear testing materials upon anvil
        const stressBoothGroup = new THREE.Group();

        // Armored shock-proof shelter framing
        const shelterBunker = new THREE.Mesh(
          new THREE.BoxGeometry(4.8, 5.2, 4.4),
          new THREE.MeshStandardMaterial({ color: "#1c1e24", roughness: 0.8, metalness: 0.3 })
        );
        shelterBunker.position.y = 1.35;
        stressBoothGroup.add(shelterBunker);

        // Internal hollow testing cavern
        const hollowInterior = new THREE.Mesh(
          new THREE.BoxGeometry(4.0, 4.5, 3.6),
          new THREE.MeshBasicMaterial({ color: "#060709" })
        );
        hollowInterior.position.y = 1.35;
        stressBoothGroup.add(hollowInterior);

        // 1. High-cycle vertical piston press
        const pistonShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 4.2), brightMetalMat);
        pistonShaft.position.set(0, 3.0, 0);
        pistonShaft.name = "shear_piston_shaft";
        stressBoothGroup.add(pistonShaft);

        const pistonPressHead = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), ironMat);
        pistonPressHead.position.set(0, 1.1, 0);
        pistonPressHead.name = "shear_press_head";
        stressBoothGroup.add(pistonPressHead);

        // 2. Anvil block holding material target
        const structuralAnvil = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 2.0), darkPlateMat);
        structuralAnvil.position.set(0, -0.6, 0);
        stressBoothGroup.add(structuralAnvil);

        // Carbon fiber target sample
        const targetSample = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.8), new THREE.MeshBasicMaterial({ color: "#a855f7" }));
        targetSample.position.set(0, -0.15, 0);
        targetSample.name = "carbon_target_sample";
        stressBoothGroup.add(targetSample);

        // Red alert warning lamps representing Seismic / Hazard level triggers
        for (let xOff = -1.9; xOff <= 1.9; xOff += 3.8) {
          const warnBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshBasicMaterial({ color: "#eb5e55" }));
          warnBeacon.position.set(xOff, 3.2, 2.1);
          stressBoothGroup.add(warnBeacon);
        }

        eqGroup.add(stressBoothGroup);

      } else if (eqId === "eq-gen-04") {
        // SECTOR 5: SUPERCONDUCTING VOLTAGE GRID REACTOR
        // Large cylindrical stator, nested triple magnetic rings spinning in locked multi-axis orbits, levitating plasma core
        const reactorGroup = new THREE.Group();

        // 1. Heavy magnetic core base plinth
        const baseStator = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 1.3, 24), ironMat);
        baseStator.position.y = -0.55;
        reactorGroup.add(baseStator);

        // 2. Three concentric magnetic rotor core rings
        const ringCoil1 = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.18, 10, 30), new THREE.MeshStandardMaterial({ color: "#38bdf8", emissive: "#38bdf8", emissiveIntensity: 0.6 }));
        ringCoil1.name = "reactor_rotor_ring_outer";
        reactorGroup.add(ringCoil1);

        const ringCoil2 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.14, 8, 24), new THREE.MeshStandardMaterial({ color: "#312e81", roughness: 0.2 }));
        ringCoil2.name = "reactor_rotor_ring_middle";
        ringCoil2.rotation.y = Math.PI / 4;
        reactorGroup.add(ringCoil2);

        const ringCoil3 = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.11, 8, 20), activeCopperMat);
        ringCoil3.name = "reactor_rotor_ring_inner";
        ringCoil3.rotation.z = Math.PI / 3;
        reactorGroup.add(ringCoil3);

        // 3. Central levitating glowing plasma core ball
        const corePlasmBall = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), new THREE.MeshBasicMaterial({ color: "#00f0ff" }));
        corePlasmBall.name = "reactor_plasma_ball";
        corePlasmBall.position.set(0, 0, 0);
        reactorGroup.add(corePlasmBall);

        // 4. Electric ground masts feeding spark arcs
        const groundMastL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.4), darkPlateMat);
        groundMastL.position.set(-3.2, 1.1, -1.8);
        const groundMastR = groundMastL.clone();
        groundMastR.position.set(3.2, 1.1, -1.8);
        reactorGroup.add(groundMastL, groundMastR);

        // Plasma spark lines (Lightning electrical arcs)
        const sparkPositions = new Float32Array(15 * 3);
        const sparkGeo = new THREE.BufferGeometry();
        sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
        const sparkLineMat = new THREE.LineBasicMaterial({
          color: "#00f0ff",
          linewidth: 3,
          transparent: true,
          opacity: 0.92
        });
        const arcSparkLine = new THREE.Line(sparkGeo, sparkLineMat);
        arcSparkLine.name = "reactor_plasma_arc_spark";
        reactorGroup.add(arcSparkLine);

        eqGroup.add(reactorGroup);
      }

      // Add a dynamic Status beacon light above the item
      const beaconGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const beaconColor = alertStatusColor;
      const beaconMat = new THREE.MeshBasicMaterial({ color: beaconColor });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      // Position beacon right above the machinery
      beaconMesh.position.set(0, eqId === "eq-gen-04" ? 6.7 : 3.8, 0);
      beaconMesh.name = "beacon";
      eqGroup.add(beaconMesh);

      // Light glow simulation
      const pointLight = new THREE.PointLight(beaconColor, 1.4, 12);
      pointLight.name = "beacon_intensity_light";
      pointLight.position.set(0, eqId === "eq-gen-04" ? 6.7 : 3.8, 0);
      eqGroup.add(pointLight);

      meshesGroup.add(eqGroup);
      equipmentMeshesMap[eqId] = eqGroup;
    });

    // 5. Create Highly Realistic Walking Personnel Figures
    // Each worker is represented by a complete hierarchical skeletal geometry (legs swinging, neon vest, yellow helmet)
    const workerMeshes: Record<string, THREE.Group> = {};
    
    // Low-opacity dynamic cast shadows underneath the operators on the dark metallic floor plates
    const shadowGeo = new THREE.RingGeometry(0.01, 0.7, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.52 });

    FACTORY_WORKERS.forEach(w => {
      const workerGroup = new THREE.Group();
      workerGroup.userData = { id: w.id };

      // Base footprint shadow circle
      const baseShadow = new THREE.Mesh(shadowGeo, shadowMat);
      baseShadow.position.y = -0.45; // slightly above actual floor and hazard lines
      workerGroup.add(baseShadow);

      // Pants / legs
      const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.9, 8);
      const pantsMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.7 });

      const leftLeg = new THREE.Mesh(legGeo, pantsMat);
      leftLeg.position.set(-0.25, -0.4, 0);
      leftLeg.name = "left_leg";
      workerGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, pantsMat);
      rightLeg.position.set(0.25, -0.4, 0);
      rightLeg.name = "right_leg";
      workerGroup.add(rightLeg);

      // Torso clad in neon retro-reflective high-visibility safety vest
      const bodyMat = new THREE.MeshStandardMaterial({ color: w.id === "wrk-05" ? "#ea580c" : "#eab308", roughness: 0.8 }); // neon orange or yellow
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.45), bodyMat);
      torso.position.y = 0.5;
      workerGroup.add(torso);

      // Head skin
      const faceMat = new THREE.MeshStandardMaterial({ color: "#fbcfe8", roughness: 0.9 }); // clean soft aesthetic tan
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), faceMat);
      head.position.y = 1.25;
      workerGroup.add(head);

      // High-visibility structural hardhat / OSHA helmet with front protect brim
      const helmetMat = new THREE.MeshStandardMaterial({ color: "#f59e0b", roughness: 0.3 }); // yellow hardhat
      const hardhatCap = new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), helmetMat);
      hardhatCap.position.y = 1.35;
      hardhatCap.scale.set(1.1, 1, 1);
      workerGroup.add(hardhatCap);

      const hardhatBrim = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.04, 0.85), helmetMat);
      hardhatBrim.position.set(0, 1.34, 0.08);
      workerGroup.add(hardhatBrim);

      // Swinging active safety arms
      const armGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.9, 8);
      const vestSleeveMat = new THREE.MeshStandardMaterial({ color: "#1e1b4b", roughness: 0.8 }); // navy heavy fabric shirt
      
      const leftArm = new THREE.Mesh(armGeo, vestSleeveMat);
      leftArm.position.set(-0.52, 0.55, 0);
      leftArm.name = "left_arm";
      workerGroup.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, vestSleeveMat);
      rightArm.position.set(0.52, 0.55, 0);
      rightArm.name = "right_arm";
      workerGroup.add(rightArm);

      // Floating small diagnostic identity tags above the worker's head
      const initialDotGeo = new THREE.RingGeometry(0.2, 0.22, 16);
      const initialDotMat = new THREE.MeshBasicMaterial({ color: w.color, side: THREE.DoubleSide });
      const identifierTag = new THREE.Mesh(initialDotGeo, initialDotMat);
      identifierTag.position.set(0, 1.9, 0);
      identifierTag.name = "floating_worker_tracker_icon";
      workerGroup.add(identifierTag);

      scene.add(workerGroup);
      workerMeshes[w.id] = workerGroup;
    });

    // 6. Volumetric exhaust gas / steam clouds venting logic
    const steamGroup = new THREE.Group();
    scene.add(steamGroup);
    const steamParticles: { mesh: THREE.Mesh; lifeAge: number; speedX: number; speedY: number; speedZ: number }[] = [];

    // 7. Set up Drag-Orbit controls (Free Will) & Raycasting selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isDragging = false;
    let dragDistance = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;

    let theta = 0;
    let phi = 0;
    let radius = 60;

    const syncSphericalFromTarget = () => {
      const dx = cameraTarget.current.pos.x - cameraTarget.current.lookAt.x;
      const dy = cameraTarget.current.pos.y - cameraTarget.current.lookAt.y;
      const dz = cameraTarget.current.pos.z - cameraTarget.current.lookAt.z;
      radius = Math.max(10, Math.sqrt(dx * dx + dy * dy + dz * dz));
      phi = Math.acos(Math.max(-0.999, Math.min(0.999, dy / radius)));
      theta = Math.atan2(dx, dz);
    };

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      dragDistance = 0;
      prevMouseX = event.clientX;
      prevMouseY = event.clientY;
      syncSphericalFromTarget();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;
      const dx = event.clientX - prevMouseX;
      const dy = event.clientY - prevMouseY;
      prevMouseX = event.clientX;
      prevMouseY = event.clientY;

      dragDistance += Math.abs(dx) + Math.abs(dy);

      setIsRotating(false);

      theta -= dx * 0.007;
      phi = Math.max(0.08, Math.min(Math.PI / 2 - 0.05, phi - dy * 0.007));

      const sinPhi = Math.sin(phi);
      cameraTarget.current.pos.set(
        cameraTarget.current.lookAt.x + radius * sinPhi * Math.sin(theta),
        cameraTarget.current.lookAt.y + radius * Math.cos(phi),
        cameraTarget.current.lookAt.z + radius * sinPhi * Math.cos(theta)
      );
    };

    const onMouseUp = (event: MouseEvent) => {
      isDragging = false;
      
      // If minimal drag, perform clean selection Raycast
      if (dragDistance < 6) {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        mouse.set(x, y);

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(meshesGroup.children, true);
        if (intersects.length > 0) {
          let hitObj: THREE.Object3D | null = intersects[0].object;
          while (hitObj && hitObj.parent !== meshesGroup) {
            hitObj = hitObj.parent;
          }

          if (hitObj && hitObj.userData?.id) {
            setSelectedEquipmentId(hitObj.userData.id);
            setSelectedWorkerId(null);
          }
        }
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setIsRotating(false);
      syncSphericalFromTarget();

      // Zoom speed dampener
      radius = Math.max(12, Math.min(125, radius + event.deltaY * 0.05));

      const sinPhi = Math.sin(phi);
      cameraTarget.current.pos.set(
        cameraTarget.current.lookAt.x + radius * sinPhi * Math.sin(theta),
        cameraTarget.current.lookAt.y + radius * Math.cos(phi),
        cameraTarget.current.lookAt.z + radius * sinPhi * Math.cos(theta)
      );
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    // 8. Core render loop
    let animationFrameId: number;
    let localTicker = 0;

    const tick = () => {
      localTicker += 0.02;

      // Unpack real-time store variables safely
      const currentEqList = eqStateRef.current;

      // A. Dynamic machinery animations with highly realistic rotation, linkages & displacement
      Object.entries(equipmentMeshesMap).forEach(([eqId, group]) => {
        const eqItem = currentEqList.find(e => e.id === eqId);

        let pulseTempo = 1.0;
        let scalePulse = 1.0;
        let coreColorStr = "#10b981"; // healthy nominal emerald

        if (eqItem) {
          if (eqItem.status === "warning") {
            pulseTempo = 2.4;
            coreColorStr = "#fbbf24"; // golden warning
          } else if (eqItem.status === "critical" || eqItem.status === "emergency") {
            pulseTempo = 4.6;
            coreColorStr = "#eb5e55"; // threat danger red
            scalePulse = 1.0 + Math.sin(localTicker * pulseTempo * 1.5) * 0.045; // critical stress expansion pulse
          }
        }

        group.scale.set(scalePulse, scalePulse, scalePulse);

        if (eqId === "eq-turbine-01") {
          // SECTOR 2: COGNITIVE ROBOTIC ASSEMBLY SWARM
          // Articulate the 6-axis mechatronic orange arm kinematic angles smoothly
          const plinth = group.getObjectByName("kuka_rotating_plinth");
          const j1 = group.getObjectByName("kuka_joint_1");
          const j2 = group.getObjectByName("kuka_joint_2");
          const tool = group.getObjectByName("kuka_tool");

          if (plinth) plinth.rotation.y = Math.sin(localTicker * 0.8) * 0.45 * pulseTempo;
          if (j1) j1.rotation.z = Math.sin(localTicker * 1.2) * 0.25;
          if (j2) j2.rotation.x = -0.1 + Math.cos(localTicker * 1.5) * 0.3;
          if (tool) tool.rotation.y = localTicker * 2.5 * pulseTempo;

          // Slide product cargo seamlessly along conveyor belt
          const cargo = group.getObjectByName("conveyor_crate_cargo");
          if (cargo) {
            cargo.position.x = -2.2 + ((localTicker * 0.6 * pulseTempo) % 4.4);
            // Bob slightly representing rolling vibrations
            cargo.position.y = -0.1 + Math.abs(Math.sin(localTicker * 12)) * 0.02 * pulseTempo;
          }

        } else if (eqId === "eq-pump-02") {
          // SECTOR 3: GEOTHERMAL HEAT CHIMNEY DUCTS
          // Spin release valve wheels and thermodynamic coils
          const wheel = group.getObjectByName("geothermal_valve_wheel");
          const spokes = group.getObjectByName("geothermal_valve_spokes");
          if (wheel && spokes) {
            wheel.rotation.z += 0.025 * pulseTempo;
            spokes.rotation.z += 0.025 * pulseTempo;
          }

        } else if (eqId === "eq-compressor-03") {
          // SECTOR 4: SUBTERRANEAN STRESS & HYPERTHREAT LAB
          // Hydraulic stress piston stroke downward onto anvil, generating sudden spark impact
          const shaft = group.getObjectByName("shear_piston_shaft");
          const head = group.getObjectByName("shear_press_head");
          if (shaft && head) {
            // High-velocity strike, slow recovery
            const strokeRatio = Math.abs(Math.sin(localTicker * 1.4));
            const yOffset = strokeRatio * 1.8;
            shaft.position.y = 3.0 - yOffset;
            head.position.y = 1.1 - yOffset;

            // Generate spark light flashes inside containment unit upon impact coordinates
            const targetSample = group.getObjectByName("carbon_target_sample") as THREE.Mesh;
            if (targetSample) {
              if (strokeRatio > 0.94) {
                targetSample.scale.set(1.15, 0.8, 1.15); // hammer compression deformation
                (targetSample.material as THREE.MeshBasicMaterial).color.set("#eab308"); // glow on pressure impact
              } else {
                targetSample.scale.set(1, 1, 1);
                (targetSample.material as THREE.MeshBasicMaterial).color.set("#a855f7");
              }
            }
          }

        } else if (eqId === "eq-gen-04") {
          // SECTOR 5: SUPERCONDUCTING VOLTAGE GRID REACTOR
          // Rotate interlocking concentric magnetic rotor rings on separate orthogonal axes
          const rOuter = group.getObjectByName("reactor_rotor_ring_outer");
          const rMiddle = group.getObjectByName("reactor_rotor_ring_middle");
          const rInner = group.getObjectByName("reactor_rotor_ring_inner");
          const plasmBall = group.getObjectByName("reactor_plasma_ball");

          if (rOuter) {
            rOuter.rotation.y += 0.015 * pulseTempo;
            rOuter.rotation.x += 0.005;
          }
          if (rMiddle) {
            rMiddle.rotation.z -= 0.022 * pulseTempo;
            rMiddle.rotation.y += 0.008;
          }
          if (rInner) {
            rInner.rotation.x += 0.035 * pulseTempo;
            rInner.rotation.z -= 0.012;
          }

          // Pulsate central confinement plasma core
          if (plasmBall) {
            const glowScalar = 1.0 + Math.sin(localTicker * 12) * 0.15 * pulseTempo;
            plasmBall.scale.set(glowScalar, glowScalar, glowScalar);
          }

          // Generate dynamic physics electric arcs discharging towards grounded masts
          const spark = group.getObjectByName("reactor_plasma_arc_spark") as THREE.Line;
          if (spark) {
            if (eqItem && (eqItem.status === "warning" || eqItem.status === "critical" || eqItem.status === "emergency" || Math.random() > 0.72)) {
              const pts = [];
              const startPos = new THREE.Vector3(-3.2, 3.2, -1.8);
              const endPos = new THREE.Vector3(0, 0, 0); // reactor core center
              const segments = 12;
              for (let s = 0; s <= segments; s++) {
                const ratio = s / segments;
                const pt = new THREE.Vector3().lerpVectors(startPos, endPos, ratio);
                if (s > 0 && s < segments) {
                  pt.x += (Math.random() - 0.5) * 0.55 * pulseTempo;
                  pt.y += (Math.random() - 0.5) * 0.55 * pulseTempo;
                  pt.z += (Math.random() - 0.5) * 0.55 * pulseTempo;
                }
                pts.push(pt);
              }
              spark.geometry.setFromPoints(pts);
              spark.visible = true;
            } else {
              spark.visible = false;
            }
          }
        }

        // Pulse the system state status beacon glowing lights above
        const beacon = group.getObjectByName("beacon") as THREE.Mesh;
        const beaconLight = group.getObjectByName("beacon_intensity_light") as THREE.PointLight;
        if (beacon && beaconLight) {
          const glowLevel = 0.5 + Math.sin(localTicker * pulseTempo * 2.5) * 0.5;
          (beacon.material as THREE.MeshBasicMaterial).color.set(coreColorStr);
          beaconLight.color.set(coreColorStr);
          beaconLight.intensity = 1.0 + glowLevel * 1.5;
        }
      });

      // A_1. CENTRAL AI BRAIN CORE DATA FLUX AND HOLOGRAPHIC SCENE ROTATIONS
      const neuralGlobe = scene.getObjectByName("holo_neural_globe");
      if (neuralGlobe) {
        neuralGlobe.rotation.y += 0.015;
        neuralGlobe.rotation.z += 0.006;
        const pulseScalar = 1.0 + Math.sin(localTicker * 4) * 0.08;
        neuralGlobe.scale.set(pulseScalar, pulseScalar, pulseScalar);
      }

      // Symmetrically flicker diagnostic server lights
      scene.traverse((obj) => {
        if (obj.name === "blinking_indicator") {
          obj.visible = Math.random() > 0.35;
        }
      });

      // Hover and float screen holographic projection displays
      const hoveringScreens = scene.getObjectByName("hovering_holo_screens");
      if (hoveringScreens) {
        hoveringScreens.position.y = 8.0 + Math.sin(localTicker * 1.5) * 0.35;
        hoveringScreens.rotation.y = Math.cos(localTicker * 0.6) * 0.08;
      }

      // A_2. CONDUIT PIPELINE ACTIVE FLOW PULSES
      conduitGroup.children.forEach((pulse) => {
        if (pulse.name.startsWith("pulse_conduit_")) {
          const uData = pulse.userData;
          if (uData) {
            uData.progress += uData.speed;
            if (uData.progress > 1.0) uData.progress = 0.0;

            const px = uData.start.x + (uData.end.x - uData.start.x) * uData.progress;
            const pz = uData.start.z + (uData.end.z - uData.start.z) * uData.progress;
            // Elevate slightly so it travels right on the pipe surface
            pulse.position.set(px, 0.36, pz);
          }
        }
      });

      // B. Walk and swing realistic limbs of technicians based on speed & direction
      FACTORY_WORKERS.forEach(worker => {
        const listPath = worker.path;
        const numPts = listPath.length;
        const speedMultiplier = 280;
        const pathProgression = (localTicker * 18 * worker.speed * 4) % (speedMultiplier * numPts);
        const currentIndex = Math.floor(pathProgression / speedMultiplier) % numPts;
        const nextIndex = (currentIndex + 1) % numPts;
        const alphaFraction = (pathProgression % speedMultiplier) / speedMultiplier;

        const pA = listPath[currentIndex];
        const pB = listPath[nextIndex];

        // Linear interpolation step
        const interpX = pA.x + (pB.x - pA.x) * alphaFraction;
        const interpZ = pA.z + (pB.z - pA.z) * alphaFraction;

        const wGroup = workerMeshes[worker.id];
        if (wGroup) {
          // Bobbing slightly while pacing
          const speedStep = Math.sin(localTicker * 14 * worker.speed);
          wGroup.position.set(interpX, 0.45 + Math.abs(speedStep) * 0.08, interpZ);

          // Rotate worker towards walk orientation vector
          const directionX = pB.x - pA.x;
          const directionZ = pB.z - pA.z;
          const angleHeading = Math.atan2(directionX, directionZ);
          wGroup.rotation.y = angleHeading;

          // Swing left/right leg & arm joints out of phase
          const lLeg = wGroup.getObjectByName("left_leg");
          const rLeg = wGroup.getObjectByName("right_leg");
          const lArm = wGroup.getObjectByName("left_arm");
          const rArm = wGroup.getObjectByName("right_arm");

          if (lLeg && rLeg && lArm && rArm) {
            const swingScale = speedStep * 0.44;
            lLeg.rotation.x = swingScale;
            rLeg.rotation.x = -swingScale;
            lArm.rotation.x = -swingScale * 0.8;
            rArm.rotation.x = swingScale * 0.8;
          }

          // Slow slow rotation of floating identification ring indicators pointing to camera
          const idRingTag = wGroup.getObjectByName("floating_worker_tracker_icon");
          if (idRingTag) {
            idRingTag.rotation.y += 0.015;
          }
        }
      });

      // C. Volumetric exhaust gas steam releasing from turbine or compressor
      if (localTicker % 0.12 < 0.03 && steamParticles.length < 35) {
        const greyVaporGeo = new THREE.SphereGeometry(0.35, 6, 6);
        const vaporMat = new THREE.MeshBasicMaterial({
          color: "#94a3b8",
          transparent: true,
          opacity: 0.32
        });
        const puffMesh = new THREE.Mesh(greyVaporGeo, vaporMat);
        
        // Steam source location
        const ventEquip = Math.random() > 0.5 ? "eq-turbine-01" : "eq-compressor-03";
        const eqPos = EQUIPMENT_POSITIONS[ventEquip];
        if (eqPos) {
          puffMesh.position.set(
            eqPos.x + (Math.random() - 0.5) * 1.6,
            eqPos.y + 1.2,
            eqPos.z + (Math.random() - 0.5) * 1.6
          );
          steamGroup.add(puffMesh);
          steamParticles.push({
            mesh: puffMesh,
            lifeAge: 1.0,
            speedX: (Math.random() - 0.5) * 0.03,
            speedY: 0.065 + Math.random() * 0.03,
            speedZ: (Math.random() - 0.5) * 0.03
          });
        }
      }

      // Process and expand moving steam clouds
      for (let s = steamParticles.length - 1; s >= 0; s--) {
        const particle = steamParticles[s];
        particle.lifeAge -= 0.016;
        particle.mesh.position.x += particle.speedX;
        particle.mesh.position.y += particle.speedY;
        particle.mesh.position.z += particle.speedZ;
        
        // Puff expanding representation
        const scaleVal = 1.0 + (1.0 - particle.lifeAge) * 3.2;
        particle.mesh.scale.set(scaleVal, scaleVal, scaleVal);
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = particle.lifeAge * 0.28;

        if (particle.lifeAge <= 0) {
          steamGroup.remove(particle.mesh);
          steamParticles.splice(s, 1);
        }
      }

      // D. Smooth Camera slerping and panning
      const cPos = cameraCurrent.current.pos;
      const cLook = cameraCurrent.current.lookAt;

      const tPos = cameraTarget.current.pos;
      const tLook = cameraTarget.current.lookAt;

      // Gentle orbital rotative drifting when in neutral mode
      if (selectedEquipmentId === null && selectedWorkerId === null && isRotating) {
        const angleRadius = 60;
        const rotTempo = localTicker * 0.07;
        tPos.set(
          Math.sin(rotTempo) * angleRadius,
          32,
          Math.cos(rotTempo) * angleRadius
        );
        tLook.set(0, 2, 0);
      }

      // Beautiful fluid cinematic camera easing
      cPos.lerp(tPos, 0.048);
      cLook.lerp(tLook, 0.048);

      camera.position.copy(cPos);
      camera.lookAt(cLook);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // Responsive Canvas Resizer
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth || 600;
      const h = isFullscreenSafetyPortal ? (containerRef.current.clientHeight || 550) : 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Escape listener to discharge/exit Safety Portal Fullscreen mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreenSafetyPortal) {
        setIsFullscreenSafetyPortal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      if (renderer.domElement) {
         renderer.domElement.removeEventListener("mousedown", onMouseDown);
         renderer.domElement.removeEventListener("mousemove", onMouseMove);
         renderer.domElement.removeEventListener("mouseup", onMouseUp);
         renderer.domElement.removeEventListener("wheel", onWheel);
      }
    };
  }, [selectedEquipmentId, selectedWorkerId, isRotating, isFullscreenSafetyPortal]);

  // Selected details calculations
  const selectedEquipment = equipment.find(e => e.id === selectedEquipmentId);
  const selectedWorker = FACTORY_WORKERS.find(w => w.id === selectedWorkerId);

  // Computed positions of the current ticker for text fields
  const getWPos = (worker: typeof FACTORY_WORKERS[0], t: number) => {
    const pts = worker.path;
    const numSegments = pts.length;
    const stepsPerSegment = 280;
    const progress = (t * worker.speed * 4) % (stepsPerSegment * numSegments);
    const segmentIndex = Math.floor(progress / stepsPerSegment) % numSegments;
    const nextIndex = (segmentIndex + 1) % numSegments;
    const interpolation = (progress % stepsPerSegment) / stepsPerSegment;
    const startPt = pts[segmentIndex];
    const endPt = pts[nextIndex];
    return {
      x: (startPt.x + (endPt.x - startPt.x) * interpolation).toFixed(1),
      z: (startPt.z + (endPt.z - startPt.z) * interpolation).toFixed(1)
    };
  };

  return (
    <div id="factory-3d-floor-container" className={`bg-card-machina border border-border-machina rounded-[4px] p-5 font-mono relative text-left mb-6 transition-all ${
      isFullscreenSafetyPortal
        ? "fixed inset-0 z-50 bg-[#0a0a0c] p-6 lg:p-8 overflow-y-auto flex flex-col justify-between"
        : "overflow-hidden"
    }`}>
      {/* Structural Screw Highlights */}
      <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-border-machina/60 rounded-full"></div>
      <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-border-machina/60 rounded-full"></div>
      <div className="absolute bottom-1.5 left-1.5 w-1 h-1 bg-border-machina/60 rounded-full"></div>
      <div className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-border-machina/60 rounded-full"></div>

      {/* Header section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-border-machina pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-machina opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-machina"></span>
            </span>
            <Move3d size={14} className="text-accent-machina animate-pulse" />
            <span className="font-sans font-black text-xs tracking-[0.2em] text-text-primary uppercase">
              {isFullscreenSafetyPortal ? "🚨 FULLSCREEN SAFETY PORTAL — LIVE FACTORY MONITOR" : "🏭 LIVE 3D FACTORY MAP & SAFETY MONITOR"}
            </span>
          </div>
          <span className="text-[9px] text-text-secondary mt-1 block uppercase tracking-wide">
            {isFullscreenSafetyPortal 
              ? "Full-screen immersive safety overwatch. Use your mouse to rotate, scroll wheel to zoom, and track machines or workers in real-time."
              : "A real-time 3D twin of our active workspaces. Click on any machine or worker below to track safety, monitor vital signs, and check status instantly."}
          </span>
        </div>

        {/* Diagnostic camera switches */}
        <div className="flex items-center gap-2 mt-2 lg:mt-0 select-none">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`px-2.5 py-1 border text-[7.5px] font-black uppercase rounded-[1px] cursor-pointer flex items-center gap-1.5 transition-all ${
              isRotating ? "bg-accent-machina/10 border-accent-machina text-accent-machina animate-pulse" : "bg-bg-machina border-border-machina text-text-secondary hover:text-text-primary hover:border-zinc-700"
            }`}
          >
            {isRotating ? <Pause size={9} /> : <Play size={9} />}
            {isRotating ? "⏸️ PAUSE AUTOMATIC ROTATION" : "▶️ AUTO-ROTATE MAP"}
          </button>
          
          <button
            onClick={resetCameraView}
            className="px-2.5 py-1 border border-border-machina bg-bg-machina text-text-primary hover:bg-zinc-800 hover:border-accent-machina transition-all text-[7.5px] font-black uppercase rounded-[1px] cursor-pointer"
          >
            🔄 RESET ZOOM & VIEW
          </button>

          <button
            onClick={toggleSafetyPortal}
            className={`px-2.5 py-1 border text-[7.5px] font-black uppercase rounded-[1px] cursor-pointer flex items-center gap-1.5 transition-all ${
              isFullscreenSafetyPortal 
                ? "bg-danger-machina/15 border-danger-machina text-danger-machina hover:bg-danger-machina hover:text-white"
                : "bg-amber-500/10 border-amber-500/40 text-amber-500 hover:bg-amber-500 hover:text-black hover:border-amber-500"
            }`}
          >
            {isFullscreenSafetyPortal ? (
              <>
                <Minimize2 size={10} />
                🚪 EXIT INTERACTIVE SCREEN
              </>
            ) : (
              <>
                <Maximize2 size={10} className="animate-bounce" />
                🖥️ GO FULLSCREEN (SAFETY OVERWATCH)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Map Interactive Content Shell */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-5 ${
        isFullscreenSafetyPortal ? "flex-1 h-[calc(100vh-140px)] my-3" : "h-[495px]"
      }`}>
        {/* Left Column: Side list of locations & quick jump vectors */}
        <div className="lg:col-span-3 border border-border-machina/60 bg-bg-machina flex flex-col justify-between p-3 select-none">
          <div className="space-y-4">
            <div>
              <span className="text-[8px] font-black text-accent-machina tracking-wider block uppercase mb-1.5 animate-pulse">
                🏭 ACTIVE MACHINES (Select to Inspect):
              </span>
              <div className="space-y-1">
                {equipment.map((eq) => {
                  const isSelected = selectedEquipmentId === eq.id;
                  
                  let statusGlow = "bg-emerald-500";
                  let borderGlow = "border-zinc-800";
                  if (eq.status === "warning") {
                    statusGlow = "bg-amber-500";
                    if (isSelected) borderGlow = "border-amber-500";
                  } else if (eq.status === "critical" || eq.status === "emergency") {
                    statusGlow = "bg-danger-machina animate-pulse";
                    if (isSelected) borderGlow = "border-danger-machina";
                  } else if (isSelected) {
                    borderGlow = "border-accent-machina";
                  }

                  return (
                    <button
                      key={eq.id}
                      onClick={() => {
                        setSelectedEquipmentId(eq.id);
                        setSelectedWorkerId(null);
                      }}
                      className={`w-full p-2 border ${borderGlow} text-left flex items-center justify-between text-[10px] font-bold rounded-[1px] cursor-pointer transition-all ${
                        isSelected ? "bg-accent-machina/10 text-white" : "bg-card-machina/40 text-text-secondary hover:text-text-primary hover:border-zinc-700"
                      }`}
                    >
                      <div className="truncate flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 ${statusGlow}`}></span>
                        <span>{eq.name}</span>
                      </div>
                      <ChevronRight size={10} className="text-zinc-500" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="text-[8px] font-black text-sky-400 tracking-wider block uppercase mb-1.5 animate-pulse">
                👷 LIVE WORKERS (Select to Track Location):
              </span>
              <div className="space-y-1">
                {FACTORY_WORKERS.map((worker) => {
                  const isSelected = selectedWorkerId === worker.id;
                  const currentLoc = getWPos(worker, ticker);

                  return (
                    <button
                      key={worker.id}
                      onClick={() => {
                        setSelectedWorkerId(worker.id);
                        setSelectedEquipmentId(null);
                      }}
                      className={`w-full p-2 border text-left flex flex-col text-[10px] rounded-[1px] cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-sky-500/10 border-sky-500 text-white font-extrabold" 
                          : "bg-card-machina/40 border-zinc-800 text-text-secondary hover:text-text-primary hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold font-sans">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: worker.color }}
                          ></span>
                          <span>{worker.name}</span>
                        </div>
                        <span className="text-[7.5px] text-zinc-500 font-mono font-normal">
                          Floor Location: {currentLoc.x}, {currentLoc.z}
                        </span>
                      </div>
                      <span className="text-[7.5px] text-zinc-500 uppercase mt-1 block tracking-wider font-mono font-medium">📍 {worker.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-[8px] text-cyan-400 font-sans border-t border-[#00f0ff]/20 pt-2.5 flex items-center gap-1.5 animate-pulse uppercase tracking-wide">
            <Radio size={12} className="text-cyan-400" />
            <span>💡 Click any item below or in 3D to zoom-in</span>
          </div>
        </div>

        {/* Target 3D Map canvas */}
        <div ref={containerRef} className={`lg:col-span-6 bg-[#0a0a0c] border border-border-machina/60 relative overflow-hidden flex items-center justify-center ${isFullscreenSafetyPortal ? "h-full min-h-0" : ""}`}>
          <canvas ref={canvasRef} className="block w-full h-full" />
          
          {/* Real-time CRT Lens Vignette and Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.45)_100%)] z-10" />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-[0.22] z-10" />

          {/* Grid Corner HUD Bounding Accents */}
          <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-[#00f0ff]/40 pointer-events-none z-10" />
          <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-[#00f0ff]/40 pointer-events-none z-10" />
          <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-[#00f0ff]/40 pointer-events-none z-10" />
          <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-[#00f0ff]/40 pointer-events-none z-10" />

          {/* Precision Crosshair centering guide */}
          <div className="absolute w-6 h-6 border border-zinc-700/30 rounded-full pointer-events-none z-10 flex items-center justify-center">
            <div className="w-1 h-1 bg-[#00f0ff]/50 rounded-full" />
          </div>

          {/* TARGET ENGAGEMENT SELECT RADAR ANCHOR (DYNAMIC TARGET FOCUS DESIGN) */}
          {(selectedWorkerId || selectedEquipmentId) && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 select-none">
              <div className="relative w-28 h-28 border border-[#00f0ff]/10 rounded-[2px] flex items-center justify-center animate-pulse">
                {/* Tactical crosshair bracket corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00f0ff]" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f0ff]" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f0ff]" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00f0ff]" />
                
                {/* Anchor status headers */}
                <div className="absolute -top-7 text-center text-[7px] text-[#00f0ff] font-sans font-black uppercase tracking-widest bg-black/85 px-1.5 border border-[#00f0ff]/40 py-0.5 whitespace-nowrap shadow-md">
                  TARGET LOCK: {selectedWorkerId ? "OPERATOR" : "SUB-SYSTEM"}
                </div>
                
                {/* Continuous radar coordinate readings */}
                <div className="absolute -bottom-9 text-center text-[6px] text-zinc-400 font-mono tracking-wider bg-black/85 p-1 border border-zinc-800/80 flex flex-col items-center shadow-md">
                  <span>RANGE: {(24.8 + Math.sin(ticker / 4) * 1.5).toFixed(1)}M</span>
                  <span>ORIENTATION: {((ticker * 1.62) % 360).toFixed(1)}°AZ</span>
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 bg-black/85 backdrop-blur-sm px-2.5 py-1 text-[8px] tracking-widest uppercase border border-border-machina/60 z-15 flex items-center gap-2 font-sans font-black">
            {selectedWorkerId ? (
              <span className="text-sky-400 flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping"></span>
                <Users size={10} /> TRACKING {selectedWorker?.name.toUpperCase()}
              </span>
            ) : selectedEquipmentId ? (
              <span className="text-accent-machina flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 bg-accent-machina rounded-full animate-ping"></span>
                <Cpu size={10} /> ANALYZING {selectedEquipment?.name.toUpperCase()}
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <Navigation size={10} className="animate-spin text-emerald-400" /> SECURE FACTORY RUNNING
              </span>
            )}
          </div>

          {/* Interactive Navigation Quick-Guide Bar */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/90 backdrop-blur-md border border-[#00f0ff]/30 px-3 py-2 rounded-[2px] flex flex-col sm:flex-row items-center justify-between text-[7.5px] text-zinc-300 font-sans tracking-widest z-15 select-none animate-pulse uppercase shadow-[0_0_15px_rgba(0,0,0,0.8)] border-l-2 border-l-[#00f0ff]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-ping"></span>
              <span className="text-[#00f0ff] font-extrabold font-sans">🖱️ HOW TO CONTROL MAP:</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1 sm:mt-0 font-mono text-zinc-300 font-bold">
              <span className="flex items-center gap-1 text-white">🖱️ HOLD MOUSE + DRAG = LOOK AROUND</span>
              <span className="flex items-center gap-1 text-white">🔄 SCROLL WHEEL = ZOOM IN / OUT</span>
              <span className="flex items-center gap-1 text-white">🎯 CLICK ANY MACHINE = VIEW DETAILS</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Context telemetry readout */}
        <div className="lg:col-span-3 border border-border-machina/60 bg-bg-machina p-3 flex flex-col justify-between">
          {selectedEquipment ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-border-machina pb-2 mb-2">
                  <div>
                    <span className="text-[9px] font-black text-text-primary uppercase tracking-wider block">
                      {selectedEquipment.name}
                    </span>
                    <span className="text-[7.5px] text-zinc-500 font-mono">
                      SER: {selectedEquipment.serial_number}
                    </span>
                  </div>
                  <span className={`text-[7px] px-1 font-mono uppercase bg-zinc-800 ${
                    selectedEquipment.status === "nominal" ? "text-emerald-400" :
                    selectedEquipment.status === "warning" ? "text-amber-400" : "text-danger-machina animate-pulse"
                  }`}>
                    {selectedEquipment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px] text-text-secondary">
                  <div className="bg-card-machina p-1.5 border border-border-machina/50">
                    <span className="text-[6.5px] text-zinc-500 block">TEMPERATURE</span>
                    <span className="text-text-primary font-black flex items-center gap-0.5">
                      <Thermometer size={10} className="text-zinc-500" />
                      {(readings[selectedEquipment.id]?.[readings[selectedEquipment.id].length - 1]?.temperature || 55).toFixed(1)}°C
                    </span>
                  </div>
                  
                  <div className="bg-card-machina p-1.5 border border-border-machina/50">
                    <span className="text-[6.5px] text-zinc-500 block">VIBRATION</span>
                    <span className="text-text-primary font-black">
                      {(readings[selectedEquipment.id]?.[readings[selectedEquipment.id].length - 1]?.vibration || 1.2).toFixed(2)} mm/s
                    </span>
                  </div>

                  <div className="bg-card-machina p-1.5 border border-border-machina/50">
                    <span className="text-[6.5px] text-zinc-500 block">PRESSURE</span>
                    <span className="text-text-primary font-black">
                      {(readings[selectedEquipment.id]?.[readings[selectedEquipment.id].length - 1]?.pressure || 4.5).toFixed(2)} bar
                    </span>
                  </div>

                  <div className="bg-card-machina p-1.5 border border-border-machina/50">
                    <span className="text-[6.5px] text-zinc-500 block">MODEL TYPE</span>
                    <span className="text-text-primary font-black uppercase">
                      {selectedEquipment.model_type}
                    </span>
                  </div>
                </div>

                {/* XGBoost Analytics integration */}
                <div className="mt-3 p-2 border border-accent-machina/20 bg-accent-machina/5 font-mono rounded-[1px]">
                  <span className="text-[8px] font-black text-accent-machina tracking-wide block uppercase mb-1">
                    [XGBOOST PREDICTIVE MODEL]
                  </span>
                  
                  <div className="flex justify-between text-[8px] text-text-secondary mt-1">
                    <span>FAILURE PROBABILITY:</span>
                    <span className="font-extrabold text-white">
                      {((predictions[selectedEquipment.id]?.[predictions[selectedEquipment.id].length - 1]?.failure_probability || 0.12) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between text-[8px] text-text-secondary mt-0.5">
                    <span>ESTIMATED RUL:</span>
                    <span className="font-extrabold text-white">
                      {(predictions[selectedEquipment.id]?.[predictions[selectedEquipment.id].length - 1]?.predicted_remaining_useful_life_hours || 450).toFixed(0)} HOURS
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[7.5px] text-zinc-600 border-t border-border-machina/60 pt-2 block">
                <span>FOCUS CALIBRATION: ON TARGET ZONE COUPLER.</span>
              </div>
            </div>
          ) : selectedWorker ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-border-machina pb-2 mb-2">
                  <div>
                    <span className="text-[9px] font-black text-sky-400 uppercase tracking-wider block">
                      {selectedWorker.name}
                    </span>
                    <span className="text-[7.5px] text-zinc-500 uppercase font-mono">
                      {selectedWorker.team}
                    </span>
                  </div>
                  <span className="text-[7px] font-mono px-1 bg-sky-950 text-sky-400 border border-sky-800">
                    ONLINE
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-[9px] text-text-secondary">
                  <div className="bg-card-machina p-1.5 border border-border-machina/50">
                    <span className="text-[6.5px] text-zinc-500 block uppercase">Operational Role</span>
                    <span className="text-text-primary font-black uppercase text-[8.5px]">
                      {selectedWorker.role}
                    </span>
                  </div>

                  <div className="bg-card-machina p-1.5 border border-border-machina/50">
                    <span className="text-[6.5px] text-zinc-500 block uppercase">Telemetry Status</span>
                    <p className="text-text-primary text-[8px] leading-relaxed italic mt-0.5">
                      "{selectedWorker.statusText}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <div className="bg-card-machina p-1.5 border border-border-machina/50">
                      <span className="text-[6px] text-zinc-500 block">HEART RATE</span>
                      <span className="text-text-primary font-bold">{selectedWorker.vitalHeartRate} BPM</span>
                    </div>
                    
                    <div className="bg-card-machina p-1.5 border border-border-machina/50">
                      <span className="text-[6px] text-zinc-500 block">OXYGEN SAT</span>
                      <span className="text-text-primary font-bold">{selectedWorker.vitalOxygen}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[7.5px] text-zinc-600 border-t border-border-machina/60 pt-2 block">
                <span>VITAL SENSING SYNCHRONIZED RETRIEVAL SYSTEM.</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between font-mono text-[9px] text-text-secondary select-none">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border-machina pb-2 mb-1.5 font-sans">
                  <span className="text-[9px] font-black text-text-primary uppercase tracking-wider block flex items-center gap-1.5">
                    📊 LIVE FACTORY METRICS (SUMMARY)
                  </span>
                  <span className="text-[7.5px] font-sans font-bold px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 flex items-center gap-1 uppercase rounded-[1px]">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping inline-block"></span>
                    <span>ONLINE</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  <div className="bg-[#0b0c0e] p-2 border border-border-machina/60 hover:border-sky-500/20 transition-all">
                    <span className="text-[6.5px] text-zinc-400 block uppercase font-bold pb-0.5">💨 VENT FLOW LEVEL</span>
                    <span className="text-text-primary font-black flex items-center gap-1 text-[9px]">
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full inline-block animate-pulse"></span>
                      {(2.32 + Math.sin(ticker / 20) * 0.08).toFixed(2)} KG/S
                    </span>
                  </div>

                  <div className="bg-[#0b0c0e] p-2 border border-border-machina/60 hover:border-emerald-500/20 transition-all">
                    <span className="text-[6.5px] text-zinc-400 block uppercase font-bold pb-0.5">⚠️ ACCIDENT RISK LEVEL</span>
                    <span className="text-emerald-400 font-extrabold text-[9px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse"></span>
                      0.02% (EXCELLENT)
                    </span>
                  </div>

                  <div className="bg-[#0b0c0e] p-2 border border-border-machina/60 hover:border-blue-500/20 transition-all">
                    <span className="text-[6.5px] text-zinc-400 block uppercase font-bold pb-0.5">❄️ COOLANT FUEL LEVEL</span>
                    <span className="text-text-primary font-black text-[9px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block"></span>
                      98.9% CAPACITY
                    </span>
                  </div>

                  <div className="bg-[#0b0c0e] p-2 border border-border-machina/60 hover:border-emerald-500/20 transition-all">
                    <span className="text-[6.5px] text-zinc-400 block uppercase font-bold pb-0.5">🛡️ SAFETY INDEX (OSHA)</span>
                    <span className="text-emerald-400 font-black text-[9px] flex items-center gap-1">
                      💯 100.0% SECURE
                    </span>
                  </div>
                </div>

                {/* Subsystem load sweeps */}
                <div className="bg-[#0b0c0e] border border-border-machina/60 p-2.5 rounded-[1.5px] space-y-2.5 font-sans">
                  <span className="text-[7.5px] text-zinc-400 block uppercase font-black tracking-wider animate-pulse">
                    💡 AUTOMATION SYSTEM GAUGES:
                  </span>
                  
                  <div className="space-y-1 text-[7.5px]">
                    <div className="flex justify-between font-medium">
                      <span className="text-zinc-400">🔥 AREA HEAT INTENSITY LEVEL</span>
                      <span className="text-text-primary font-bold">{(42.8 + Math.cos(ticker / 10) * 0.4).toFixed(1)}°C NOMINAL</span>
                    </div>
                    <div className="bg-zinc-800/60 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-accent-machina h-full" style={{ width: `${(42 + Math.cos(ticker/10)*2)}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1 text-[7.5px]">
                    <div className="flex justify-between font-medium">
                      <span className="text-zinc-400">🧠 AI PROCESS SPEED</span>
                      <span className="text-text-primary font-bold">410.8 TFLOPS (HEAVY TASK)</span>
                    </div>
                    <div className="bg-zinc-800/60 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-accent-machina h-full animate-pulse" style={{ width: "81%" }}></div>
                    </div>
                  </div>

                  <div className="space-y-1 text-[7.5px]">
                    <div className="flex justify-between font-medium">
                      <span className="text-zinc-400">📶 ACTIVE SENSOR STRETCH</span>
                      <span className="text-text-primary font-bold">98.42% STABLE SIGNAL</span>
                    </div>
                    <div className="bg-zinc-800/60 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full animate-pulse" style={{ width: "98.4%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#050608] border border-amber-500/15 p-2 rounded-[1.5px] space-y-1.5">
                  <span className="text-[7.2px] font-black text-amber-500 uppercase tracking-widest block">
                    ⚡ TWIN ENGINE SPECIFICATION (FACTORYGPT)
                  </span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[6.8px] leading-relaxed uppercase text-zinc-400 font-mono">
                    <div>RENDER AGENT:</div>
                    <div className="text-white font-black text-right">UNREAL / OMNIVERSE</div>
                    
                    <div>PBR TEXTURES:</div>
                    <div className="text-white font-black text-right">8K PHOTOGRAMMETRY</div>
                    
                    <div>RAY TRACING:</div>
                    <div className="text-white font-black text-right">GLOBAL ILLUMINATION</div>
                    
                    <div>OSHA COMPLIANCE:</div>
                    <div className="text-emerald-400 font-black text-right">ISO 9001/14001 SECURE</div>

                    <div>INTEGRATIONS:</div>
                    <div className="text-white font-black text-right">SIEMENS &amp; ABB CORE</div>

                    <div>ATMOSPHERE:</div>
                    <div className="text-white font-black text-right">VOLUMETRIC STEAM FOG</div>
                  </div>
                </div>

                <div className="bg-black/20 p-2 border border-border-machina/50 rounded-[1.5px] space-y-1 font-sans">
                  <span className="text-[7.5px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-sky-400 rounded-full inline-block animate-ping"></span>
                    📶 WIRELESS FEEDBACK TRACKING
                  </span>
                  <p className="text-[7px] text-zinc-500 leading-normal uppercase font-medium">
                    Continuous feedback: 18 nodes synchronized to FactoryGPT twin criteria.
                  </p>
                </div>
              </div>

              <div className="text-[7.5px] text-zinc-500 border-t border-border-machina/60 pt-2 block font-sans">
                <span>🛡️ SAFETY OVERWATCH LEVEL: LIVE & SECURE.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
