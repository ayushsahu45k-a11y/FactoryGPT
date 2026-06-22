import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import IndustrialWidget from "./IndustrialWidget";
import { 
  Cpu, 
  Info, 
  Zap, 
  Activity, 
  Settings, 
  Thermometer, 
  Wrench, 
  Gauge, 
  Map, 
  Layers, 
  Radio,
  Play,
  RotateCcw,
  ShieldAlert,
  Train,
  CheckCircle2,
  Wind,
  Flame,
  Binary,
  Maximize2,
  Shield,
  Eye,
  Minimize2
} from "lucide-react";

interface ComponentNode {
  id: string;
  name: string;
  operationalBounds: string;
  normalTemp: string;
  normalVib: string;
  description: string;
}

// Famous Industrial Theme Skin definition type
type ThemeKey = "CYBERPUNK" | "TESLA_AUTOMATION" | "ERANGEL" | "FREE_FIRE";

interface ThemeStyle {
  accent: string;       // Primary glowing highlight colour
  secondary: string;    // Secondary support highlight
  baseGrid: string;     // Color of ground floor grids
  structureStroke: string; // Color of 3D lines
  structureFill: string;   // Semi-transparent surface fill
  floorBg: string;       // Background of the canvas frame
  cargoColor: string;    // Color of moving cargo parts
}

const THEME_PRESETS: Record<ThemeKey, ThemeStyle> = {
  CYBERPUNK: {
    accent: "#00f0ff",        // Cyber Blue
    secondary: "#ff007f",     // Magenta neon
    baseGrid: "rgba(0, 240, 255, 0.08)",
    structureStroke: "rgba(0, 240, 255, 0.65)",
    structureFill: "rgba(0, 240, 255, 0.04)",
    floorBg: "#06070a",
    cargoColor: "#e0f2fe"
  },
  TESLA_AUTOMATION: {
    accent: "#ff6b00",        // Safety Orange
    secondary: "#ffffff",     // Clean White
    baseGrid: "rgba(255, 107, 0, 0.06)",
    structureStroke: "rgba(255, 107, 0, 0.65)",
    structureFill: "rgba(255, 107, 0, 0.03)",
    floorBg: "#080808",
    cargoColor: "#ffedd5"
  },
  ERANGEL: {
    accent: "#cda45e",        // Military gold-brass
    secondary: "#829c62",     // Tank Olive Drag
    baseGrid: "rgba(205, 164, 94, 0.06)",
    structureStroke: "rgba(205, 164, 94, 0.55)",
    structureFill: "rgba(205, 164, 94, 0.03)",
    floorBg: "#111416",
    cargoColor: "#fef3c7"
  },
  FREE_FIRE: {
    accent: "#facc15",        // Radiation yellow
    secondary: "#e01a4f",     // High flash red
    baseGrid: "rgba(250, 204, 21, 0.08)",
    structureStroke: "rgba(250, 204, 21, 0.65)",
    structureFill: "rgba(250, 204, 21, 0.04)",
    floorBg: "#0a0b0d",
    cargoColor: "#fef9c3"
  }
};

const SECTOR_DATA: Record<string, {
  name: string;
  sector: string;
  unrealRef: string;
  visitor: {
    theme: string;
    description: string;
    funFact: string;
  };
  worker: {
    tasks: string[];
    duty: string;
    bounds: { label: string; value: string }[];
  };
  manager: {
    oee: string;
    headcount: number;
    tasks: string[];
    throughput: string;
  };
  admin: {
    specs: string[];
    risk: string;
    hazardClass: string;
  };
}> = {
  "gpt-core": {
    name: "CENTRAL FACTORYGPT AI BRAIN CORE",
    sector: "SECTOR DELTA-01",
    unrealRef: "CORE CELL CELLULAR PROTOCOLS",
    visitor: {
      theme: "The Neural Nervous Mind",
      description: "Supercomputer neural array command cell. Orchestrates robot axes, conveyor tracks, geothermic exhaust valves, and predictive model telemetry on a single co-acting grid.",
      funFact: "FactoryGPT processes over 5,200 telemetry channels synchronously to auto-adjust thermal and kinetic parameters."
    },
    worker: {
      duty: "Verify optical transceivers, check liquid coolant supply pipe lines, and ensure ESD earthing connections are clamped.",
      tasks: [
        "Inspect liquid coolant loop reservoir pressure (Target: 2.3 bar)",
        "Degauss central optical interface card slot #F09",
        "Clear accumulated sector transaction query buffer"
      ],
      bounds: [
        { label: "CORES HEAT", value: "38.5°C" },
        { label: "COOLING SYSTEM", value: "LIQUID L-N2" },
        { label: "AI COMPUTE RATE", value: "410 TFLOPS" }
      ]
    },
    manager: {
      oee: "99.85%",
      headcount: 2,
      throughput: "12.4 Gbps",
      tasks: [
        "Audit neural drift logs from last evening's shift run",
        "Confirm CPU/GPU cluster balance ratios before weekly restart"
      ]
    },
    admin: {
      specs: [
        "128x Tensor Core Processing Hubs",
        "Direct fiber-channel link-state mapping",
        "Isolated secondary battery power grid"
      ],
      risk: "Stable AI prediction state bounds. Zero logical drift detected.",
      hazardClass: "Class 1 Division 1 Safezone"
    }
  },
  "robo-arms": {
    name: "COGNITIVE ROBOTIC ASSEMBLY SWARM",
    sector: "ASSEMBLY HALL BE-4",
    unrealRef: "HIGH-POLY MECHANICAL ROTATORS",
    visitor: {
      theme: "The Articulated Giants",
      description: "6-Axis heavy duty articulating mechanical cells synchronized on automated high-speed logistics conveyor systems to assemble heavy carbon components.",
      funFact: "Articulated weld heads adjust coordinate trajectories dynamically within 0.05mm precision based on thermal material shifts."
    },
    worker: {
      duty: "Audit joint torque load thresholds, calibrate photoelectric camera bounds, and manually oil conveyer drive chain linkage gears.",
      tasks: [
        "Pre-grease hydraulic joint manifold gaskets",
        "Ensure red safety-line laser boundaries are active",
        "Clear scrap weld debris from component tray guide rails"
      ],
      bounds: [
        { label: "WELD TEMP", value: "1,420°C" },
        { label: "BELT CURRENT", value: "18.5 Amps" },
        { label: "AXIS LOAD", value: "0.22 mm/sec" }
      ]
    },
    manager: {
      oee: "94.20%",
      headcount: 4,
      throughput: "48 Units / Hr",
      tasks: [
        "Investigate conveyor tray photo-eye sensor timing lag",
        "Audit weld tip degradation rate for assembly arm-02"
      ]
    },
    admin: {
      specs: [
        "Tesla-Automation Class-6 robotic arms",
        "Independent laser interlocked safety zone",
        "Variable speed belt motors with regenerative braking"
      ],
      risk: "Heavy machinery active kinetics load hazards.",
      hazardClass: "Class 1 Division 2 Active Area"
    }
  },
  "steam-vent": {
    name: "GEOTHERMAL HEAT CHIMNEY DUCTS",
    sector: "VENT COMPLEX C-3",
    unrealRef: "VOLUMETRIC FLUID ACCUMULATORS",
    visitor: {
      theme: "The Thermal Regenerator",
      description: "Towering ventilation towers designed to safely vent thermal energy build-ups, recycling excess steam back into clean mechanical generator cycles.",
      funFact: "Recycler captures up to 45% of redundant thermal exhaust gas, returning it directly back to the cooling matrix."
    },
    worker: {
      duty: "Clean condensation nozzle filters, clear ash sediments from emergency exhaust ports, and test high-pressure check valves.",
      tasks: [
        "Drain geodermic water condensation trap #2",
        "Audit thermal imaging camera alignment angles",
        "Clean nozzle exits from microscopic carbon deposits"
      ],
      bounds: [
        { label: "GAS TEMP", value: "184.2°C" },
        { label: "FLOW INDEX", value: "1,850 m³/h" },
        { label: "COMPRESS LIMIT", value: "6.5 Bar" }
      ]
    },
    manager: {
      oee: "91.50%",
      headcount: 2,
      throughput: "1.12 MW Regen",
      tasks: [
        "Submit emissions review report for environmental compliance",
        "Assign pipe-descaling shift duties for tomorrow morning"
      ]
    },
    admin: {
      specs: [
        "Dual-regenerative thermal cycle cooling towers",
        "High-volume emergency bypass pneumatic vent valves",
        "Scrubber filters with real-time carbon telemetry"
      ],
      risk: "Extreme thermodynamic gas flow pressure thresholds.",
      hazardClass: "Class 2 Division 2 Thermodynamic Zone"
    }
  },
  "secret-lab": {
    name: "HYPERTHREAT SUBTERRANEAN ANALYSIS LAB",
    sector: "LAB SANCTUARY X-09",
    unrealRef: "RAYTRACED DEFENSE SECTOR",
    visitor: {
      theme: "Material Rupture Sandbox",
      description: "Deep underground secure facility where high-strain hydraulic pistons crush, bend, and rupture materials to study extreme stress tolerances in real time.",
      funFact: "Material failures here are recorded at 50,000 frames per second to train stress failure prediction models."
    },
    worker: {
      duty: "Operate high-strain compression pistons, secure the acoustic shielding panels, and audit bio-hazard leak detectors.",
      tasks: [
        "Load test specimen and lock physical piston clamp jaws",
        "Verify subterranean ventilation negative pressure cycle",
        "Mute active ultrasonic telemetry calibration warnings"
      ],
      bounds: [
        { label: "VAC PRESSURE", value: "-0.2 Bar" },
        { label: "PUMP FORCE", value: "240 Kilonewtons" },
        { label: "STRUCT STRAIN", value: "0.04 μst" }
      ]
    },
    manager: {
      oee: "88.75%",
      headcount: 3,
      throughput: "18 Tests / Day",
      tasks: [
        "Verify dataset export to Cloud AI Training buckets",
        "Authorize titanium alloy fatigue trial protocol"
      ]
    },
    admin: {
      specs: [
        "Acoustically-isolated underground concrete sandbox",
        "Triple redundant vacuum containment filters",
        "100-ton computer-controlled hydraulic force generators"
      ],
      risk: "Fracturing fragments and extreme shock stress risks.",
      hazardClass: "Strict Class 1 Div 1 Isolated Sanctuary"
    }
  },
  "reactor-grid": {
    name: "SUPERCONDUCTING VOLTAGE GRID REACTOR",
    sector: "REACTOR CORE GA-2",
    unrealRef: "CONTAINED PLASMA INJECTORS",
    visitor: {
      theme: "The Zero-Loss Power Hub",
      description: "High-voltage superconductor matrix that isolates incoming megawatts and balances loads using computer-controlled helium cooling elements.",
      funFact: "Liquid cooling keeps the reactor windings at -196.2°C, which eliminates electrical resistance to distribute power with near 100% efficiency!"
    },
    worker: {
      duty: "Adjust cryogen flow rates, audit main containment transformer nitrogen levels, and test high-voltage high-current breakers.",
      tasks: [
        "Replenish liquid nitrogen cryogenic tanks",
        "Audit high-voltage secondary isolator breaker contact wear",
        "Clean power line interface with anhydrous safe solvent"
      ],
      bounds: [
        { label: "CRYOGENIC TEMP", value: "-196.2°C" },
        { label: "GRID VOLTS", value: "13.8 KV Nominal" },
        { label: "FIELD STRENGTH", value: "2.4 Tesla" }
      ]
    },
    manager: {
      oee: "98.90%",
      headcount: 3,
      throughput: "8.84 MW Total",
      tasks: [
        "Audit high-current breaker thermography thermal images",
        "Submit grid synchronization efficiency balance checklist"
      ]
    },
    admin: {
      specs: [
        "Cryogenically-contained copper superconductor coil",
        "High-voltage gas-insulated SF6 circuit breakers",
        "Solid-state digital subgrid voltage balancer modules"
      ],
      risk: "Fatal high-voltage discharge and intense magnetic fields.",
      hazardClass: "Strict High-Voltage Restrict Entry Zone"
    }
  }
};

interface TourStep {
  id: string;
  name: string;
  sector: string;
  camera: { yaw: number; pitch: number; zoom: number };
  duration: number; // seconds
  safetySensors: { label: string; value: string; status: "nominal" | "warning" | "critical" }[];
  operationalStatus: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "gpt-core",
    name: "CENTRAL FACTORYGPT AI BRAIN CORE",
    sector: "SECTOR DELTA-01",
    camera: { yaw: 320, pitch: 45, zoom: 1.95 },
    duration: 6,
    operationalStatus: "COMPUTATIONAL RATE EXCEEDS 410 TFLOPS - FULL INFERENCE EQUILIBRIUM",
    safetySensors: [
      { label: "CORES THERMAL LEVEL", value: "38.5°C", status: "nominal" },
      { label: "COOLING NITROGEN LOOP", value: "ACTIVE (L-N2)", status: "nominal" },
      { label: "MODEL TELEMETRY DRIFT", value: "0.02% STABLE", status: "nominal" }
    ]
  },
  {
    id: "robo-arms",
    name: "COGNITIVE ROBOTIC ASSEMBLY SWARM",
    sector: "ASSEMBLY HALL BE-4",
    camera: { yaw: 45, pitch: 50, zoom: 2.1 },
    duration: 6,
    operationalStatus: "SYNCHRONIZED 6-AXIS KINETIC PATHS RUNNING AT 85% VELOCITY LIMIT",
    safetySensors: [
      { label: "WELD POINT TEMPERATURE", value: "1,420°C", status: "warning" },
      { label: "INTERLOCK REFLECTIVE LASERS", value: "SECURE / STANDBY", status: "nominal" },
      { label: "ROTATIONAL FEED SPEED", value: "418 HZ", status: "nominal" }
    ]
  },
  {
    id: "steam-vent",
    name: "GEOTHERMAL HEAT CHIMNEY DUCTS",
    sector: "VENT COMPLEX C-3",
    camera: { yaw: 135, pitch: 40, zoom: 1.85 },
    duration: 6,
    operationalStatus: "PNEUMATIC CHECK-VALVE REGULATING 1,850 m³/h REGENERATED GAS FLOW",
    safetySensors: [
      { label: "EMISSION TEMPERATURE", value: "184.2°C", status: "warning" },
      { label: "RECYCLER PRESSURE LIMIT", value: "4.82 BAR", status: "nominal" },
      { label: "PARTICULATE DENSITY RADAR", value: "F9 NOMINAL", status: "nominal" }
    ]
  },
  {
    id: "secret-lab",
    name: "HYPERTHREAT SUBTERRANEAN ANALYSIS LAB",
    sector: "LAB SANCTUARY X-09",
    camera: { yaw: 220, pitch: 55, zoom: 2.2 },
    duration: 6,
    operationalStatus: "MATERIAL FATIGUE SANDBOX SIMULATION UNDER HIGH ATMOSPHERIC SEAL",
    safetySensors: [
      { label: "HYDRAULIC FORCE VALUE", value: "240 KN", status: "nominal" },
      { label: "SUB-VACUUM PRESSURE GATE", value: "-0.2 BAR", status: "nominal" },
      { label: "STRUCTURAL SHEAR STRAIN", value: "0.04 μst", status: "nominal" }
    ]
  },
  {
    id: "reactor-grid",
    name: "SUPERCONDUCTING VOLTAGE GRID REACTOR",
    sector: "REACTOR CORE GA-2",
    camera: { yaw: 280, pitch: 35, zoom: 2.0 },
    duration: 6,
    operationalStatus: "MEGAWATT SUBGRID BALANCER ENGAGED - CRYOGENIC WINDS ACTIVE",
    safetySensors: [
      { label: "TRANSFORMER INDUCTION FIELD", value: "2.4 TESLA", status: "critical" },
      { label: "CRYOGEN WIND TEMPERATURE", value: "-196.2°C", status: "nominal" },
      { label: "NOMINAL GRID SYNCHRONICITY", value: "13.8 KV", status: "nominal" }
    ]
  }
];

export default function DigitalTwinView() {
  const { equipment, addHistory, user, incidents, history } = useStore();
  const [selectedEqId, setSelectedEqId] = useState<string>("eq-turbine-01");
  const [activeNodeId, setActiveNodeId] = useState<string>("bearing-inner");
  
  // Tactical unified display layout inside a single workspace
  // '3d' - Full-scale rotating tactical projection
  // '2d' - Standard detailed orthographic floor plan blueprint
  // 'split' - Connected HUD panel: interactive 3D map synchronized with flat 2D blueprint radar 
  const [layoutMode, setLayoutMode] = useState<"3d" | "2d" | "split">("split");
  
  // Selected themepreset for styling
  const [themeKey, setThemeKey] = useState<ThemeKey>("ERANGEL");
  const currentTheme = THEME_PRESETS[themeKey];

  const [hoveredHotspot, setHoveredHotspot] = useState<string>("gpt-core");

  // Real-time rotatable camera angles/vectors
  const [yaw, setYaw] = useState<number>(315); // angle around Z (yaw)
  const [pitch, setPitch] = useState<number>(45); // angle around X (camera tilt)
  const [zoom, setZoom] = useState<number>(1.55);
  const [isRotating, setIsRotating] = useState<boolean>(true);

  // Targets for camera smooth glide / interpolation
  const targetYawRef = useRef<number | null>(null);
  const targetPitchRef = useRef<number | null>(null);
  const targetZoomRef = useRef<number | null>(null);

  // Automated Inspection Tour States
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);
  const [tourSecondsElapsed, setTourSecondsElapsed] = useState<number>(0);

  // Drag interaction states on the map canvas
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startYawRef = useRef<number>(yaw);
  const startPitchRef = useRef<number>(pitch);

  // High-fidelity active steam chimney gas particle coordinates
  // Updates in real-time
  const [smokeParticles, setSmokeParticles] = useState<Array<{ id: number; x: number; y: number; z: number; r: number; alpha: number }>>([]);
  const particleIdCounterRef = useRef<number>(0);

  // Blueprints grid scanners overlay toggle
  const [showBlueprintsOverlay, setShowBlueprintsOverlay] = useState<boolean>(true);

  // New advanced FactoryGPT Map layers & overlay controls
  const [showWorkers, setShowWorkers] = useState<boolean>(true);
  const [showPipelines, setShowPipelines] = useState<boolean>(true);
  const [showThermalHeatmap, setShowThermalHeatmap] = useState<boolean>(false);
  const [hoveredWorkerId, setHoveredWorkerId] = useState<string | null>(null);

  // STATIC CONFIG: 5 real-time wandering factory workers synced across 3D/2D views
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
        { x: -5, y: -5, z: 0 },
        { x: 15, y: -5, z: 0 },
        { x: 15, y: 15, z: 0 },
        { x: -5, y: 15, z: 0 }
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
        { x: -55, y: 30, z: 0 },
        { x: -30, y: 30, z: 0 },
        { x: -30, y: 55, z: 0 },
        { x: -55, y: 55, z: 0 }
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
        { x: 40, y: -55, z: 0 },
        { x: 68, y: -55, z: 0 },
        { x: 68, y: -30, z: 0 },
        { x: 40, y: -30, z: 0 }
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
        { x: 35, y: 40, z: -10 },
        { x: 58, y: 40, z: -10 },
        { x: 58, y: 65, z: -10 },
        { x: 35, y: 65, z: -10 }
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
        { x: -75, y: -55, z: 0 },
        { x: -50, y: -55, z: 0 },
        { x: -50, y: -30, z: 0 },
        { x: -75, y: -30, z: 0 }
      ],
      speed: 0.16,
      statusText: "Aligning cryogen valves"
    }
  ];

  // STATIC CONFIG: Fluid pipelines drawing and flowing particles
  const FACTORY_PIPELINES = [
    {
      id: "pipe-nitrogen",
      name: "Liquid Helium Cryo Pipeline",
      color: "#00f0ff",
      points: [
        { x: -65, y: -45, z: 3 },
        { x: -20, y: -45, z: 3 },
        { x: 0, y: 0, z: 3 }
      ],
      speed: 0.25
    },
    {
      id: "pipe-steam",
      name: "High Pressure Recycled Steam Duct",
      color: "#fda4af",
      points: [
        { x: 55, y: -45, z: 5 },
        { x: 25, y: -20, z: 5 },
        { x: 0, y: 0, z: 5 }
      ],
      speed: 0.35
    },
    {
      id: "pipe-data",
      name: "Optic Nerve Command Bus",
      color: "#a855f7",
      points: [
        { x: 0, y: 0, z: 12 },
        { x: -20, y: 20, z: 5 },
        { x: -45, y: 40, z: 5 }
      ],
      speed: 0.45
    }
  ];

  // Deterministic FPS-correct walking waypoint engine
  const getWorkerPosition = (worker: typeof FACTORY_WORKERS[0], ticker: number) => {
    const pts = worker.path;
    const numSegments = pts.length;
    const stepsPerSegment = 240; // larger means slower transit
    const progress = (ticker * worker.speed * 4) % (stepsPerSegment * numSegments);
    const segmentIndex = Math.floor(progress / stepsPerSegment) % numSegments;
    const nextIndex = (segmentIndex + 1) % numSegments;
    const interpolation = (progress % stepsPerSegment) / stepsPerSegment;

    const startPt = pts[segmentIndex];
    const endPt = pts[nextIndex];

    return {
      x: startPt.x + (endPt.x - startPt.x) * interpolation,
      y: startPt.y + (endPt.y - startPt.y) * interpolation,
      z: startPt.z + (endPt.z - startPt.z) * interpolation
    };
  };

  // Affine custom calibration mapping for 3D coordinates system translates into the 2D SVG canvas 
  const getWorkerCoords2D = (pos3d: { x: number; y: number }) => {
    let kx = 2.6;
    let ky = 2.0;
    if (pos3d.x < 0 && pos3d.y < 0) {
      kx = 2.62;
      ky = 2.0;
    } else if (pos3d.x > 0 && pos3d.y < 0) {
      kx = 2.73;
      ky = 2.0;
    } else if (pos3d.x < 0 && pos3d.y > 0) {
      kx = 3.11;
      ky = 2.25;
    } else if (pos3d.x > 0 && pos3d.y > 0) {
      kx = 2.89;
      ky = 2.0;
    }
    return {
      x: 400 + pos3d.x * kx,
      y: 220 + pos3d.y * ky
    };
  };

  // Dynamic system parameters
  const [activeSteamVent, setActiveSteamVent] = useState<boolean>(false);
  const [assemblyCycleSpeed, setAssemblyCycleSpeed] = useState<"normal" | "boost" | "hyper">("normal");
  const [activeEmergencyAlarms, setActiveEmergencyAlarms] = useState<boolean>(false);

  // Secondary fine-fidelity ticker
  const [timeTicker, setTimeTicker] = useState<number>(0);

  // Deep multi-role parameters for interactive factory buildings click walkthrough
  const userRoleLower = (user?.role?.toLowerCase() as "viewer" | "worker" | "manager" | "admin") || "viewer";
  const [selectedRole, setSelectedRole] = useState<"viewer" | "worker" | "manager" | "admin">(userRoleLower);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  // Map layers states
  const [showEfficiencyKPIs, setShowEfficiencyKPIs] = useState<boolean>(false);
  const [showMaintenanceTasks, setShowMaintenanceTasks] = useState<boolean>(false);
  const [showSafetyZones, setShowSafetyZones] = useState<boolean>(false);

  // Selected building to display a detailed inspection modal breakdown
  const [selectedBuildingForModal, setSelectedBuildingForModal] = useState<string | null>(null);

  // Sync selectedRole on logged-in user changes
  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role.toLowerCase() as any);
    }
  }, [user]);

  // Listen for global voice commands to update current active hotspot (sector) focus and camera coordinates
  useEffect(() => {
    const handleVoiceSector = (e: Event) => {
      const customEvent = e as CustomEvent<{ sectorId: string; yaw?: number; pitch?: number; zoom?: number }>;
      if (customEvent.detail && customEvent.detail.sectorId) {
        setHoveredHotspot(customEvent.detail.sectorId);
        if (customEvent.detail.yaw !== undefined) {
          targetYawRef.current = customEvent.detail.yaw;
        }
        if (customEvent.detail.pitch !== undefined) {
          targetPitchRef.current = customEvent.detail.pitch;
        }
        if (customEvent.detail.zoom !== undefined) {
          targetZoomRef.current = customEvent.detail.zoom;
        }
      }
    };
    window.addEventListener("voice-select-sector", handleVoiceSector);
    return () => window.removeEventListener("voice-select-sector", handleVoiceSector);
  }, []);

  // Sync layers automatically when selectedRole changes
  useEffect(() => {
    if (selectedRole === "manager") {
      setShowEfficiencyKPIs(true);
      setShowMaintenanceTasks(false);
      setShowSafetyZones(false);
    } else if (selectedRole === "worker") {
      setShowEfficiencyKPIs(false);
      setShowMaintenanceTasks(true);
      setShowSafetyZones(true);
    } else if (selectedRole === "admin") {
      setShowEfficiencyKPIs(true);
      setShowMaintenanceTasks(true);
      setShowSafetyZones(true);
    } else {
      setShowEfficiencyKPIs(false);
      setShowMaintenanceTasks(false);
      setShowSafetyZones(false);
    }
  }, [selectedRole]);

  // Checklists interactive state (3 tasks per building)
  const [checklistState, setChecklistState] = useState<Record<string, boolean[]>>({
    "gpt-core": [false, false, false],
    "robo-arms": [false, false, false],
    "steam-vent": [false, false, false],
    "secret-lab": [false, false, false],
    "reactor-grid": [false, false, false]
  });

  // Admin simulation custom state overrides
  const [isNeuralCalibrating, setIsNeuralCalibrating] = useState<boolean>(false);
  const [customModelAcc, setCustomModelAcc] = useState<string>("99.9%");
  const [conveyorStopped, setConveyorStopped] = useState<boolean>(false);
  const [labStressActive, setLabStressActive] = useState<boolean>(false);
  const [cryoCoolantBypassActive, setCryoCoolantBypassActive] = useState<boolean>(false);

  // 1. Particle generator: real 3D smoke rising out of coordinates
  useEffect(() => {
    const interval = setInterval(() => {
      // Chimney position is rough (60, -50)
      setSmokeParticles((prev) => {
        // Filter out dead particles
        const active = prev
          .map((p) => ({
            ...p,
            z: p.z + (activeSteamVent ? 3.0 : 1.2), // Rising rate
            x: p.x + Math.sin(p.z * 0.15) * 0.7,   // Slight wobble
            alpha: Math.max(0, p.alpha - 0.015),    // Dissipation decay
            r: p.r + 0.18                           // Spreading
          }))
          .filter((p) => p.alpha > 0 && p.z < 100);

        // Inject new birth particles if steam is active or nominal drift
        const spawnCount = activeSteamVent ? 3 : 1;
        const spawned: typeof active = [];
        for (let i = 0; i < spawnCount; i++) {
          particleIdCounterRef.current += 1;
          spawned.push({
            id: particleIdCounterRef.current,
            // Drifts localized near Erangel chimney towers (60, -50), heights start from 35
            x: 60 + (Math.random() * 8 - 4),
            y: -50 + (Math.random() * 8 - 4),
            z: 35,
            r: 3 + Math.random() * 2,
            alpha: 0.75 + Math.random() * 0.2
          });
        }
        return [...active, ...spawned];
      });
    }, 60);

    return () => clearInterval(interval);
  }, [activeSteamVent]);

  // Automated Inspection Tour controller
  useEffect(() => {
    if (!isTourActive) {
      setTourSecondsElapsed(0);
      return;
    }

    // Set targets for initial/updated step
    const currentStepData = TOUR_STEPS[tourStep];
    if (currentStepData) {
      targetYawRef.current = currentStepData.camera.yaw;
      targetPitchRef.current = currentStepData.camera.pitch;
      targetZoomRef.current = currentStepData.camera.zoom;
      setHoveredHotspot(currentStepData.id);
      
      if (addHistory) {
        addHistory(
          "SAFETY_SCAN",
          "INSPECT SWEEP",
          `Automated inspection sweep focused on: ${currentStepData.name}. Checking real-time zone metrics.`
        );
      }
    }

    const secInterval = setInterval(() => {
      setTourSecondsElapsed((prev) => {
        const threshold = TOUR_STEPS[tourStep]?.duration || 6;
        if (prev >= threshold - 1) {
          // Go to next step
          setTourStep((s) => (s + 1) % TOUR_STEPS.length);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(secInterval);
  }, [isTourActive, tourStep, addHistory]);

  // 2. Real-time projection engine loop
  useEffect(() => {
    let frameId: number;
    const loop = () => {
      setTimeTicker((prev) => (prev + 1) % 7200);

      // Smooth camera interpolation towards targets
      if (targetYawRef.current !== null && !isDragging) {
        setYaw((prev) => {
          let diff = targetYawRef.current! - prev;
          while (diff < -180) diff += 360;
          while (diff > 180) diff -= 360;
          if (Math.abs(diff) < 0.2) {
            return targetYawRef.current!;
          }
          return (prev + diff * 0.08 + 360) % 360;
        });
      } else if (isRotating && !isDragging) {
        setYaw((y) => (y + 0.15) % 360);
      }

      if (targetPitchRef.current !== null && !isDragging) {
        setPitch((prev) => {
          const diff = targetPitchRef.current! - prev;
          if (Math.abs(diff) < 0.2) return targetPitchRef.current!;
          return prev + diff * 0.08;
        });
      }

      if (targetZoomRef.current !== null) {
        setZoom((prev) => {
          const diff = targetZoomRef.current! - prev;
          if (Math.abs(diff) < 0.005) return targetZoomRef.current!;
          return prev + diff * 0.08;
        });
      }

      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isRotating, isDragging]);

  const componentsList: ComponentNode[] = [
    {
      id: "bearing-inner",
      name: "HIGH-TOLERANCE INNER DUAL THRUST BEARING",
      operationalBounds: "MAX LIMIT: 85 C | 3.5 MM/S VIBRATION LIMITS",
      normalTemp: "62.4",
      normalVib: "1.25",
      description: "Primary rotor thrust coupling. Susceptible to structural heat build-up under high dynamic loads."
    },
    {
      id: "stator-coil",
      name: "ELECTROMAGNETIC STATOR INDUCTION CORE",
      operationalBounds: "MAX LIMIT: 75 C | 0.8 MM/S VIBRATION LIMITS",
      normalTemp: "54.1",
      normalVib: "0.22",
      description: "Direct electrical kinetic transition core. Monitored for heat dissipation and short risks."
    },
    {
      id: "intake-valve",
      name: "AUTOMATIC COMPRESSED INTAKE VALVE REGULATE GATE",
      operationalBounds: "MAX LIMIT: 6.5 BAR | 4.0 MM/S VIBRATION LIMITS",
      normalTemp: "42.8",
      normalVib: "2.10",
      description: "System compressor intake bypass gate control unit. Heavy mechanical fatigue profile."
    },
    {
      id: "rotor-blade",
      name: "AERODYNAMIC COMPRESSION ROTOR IMPELLER BLADES",
      operationalBounds: "MAX LIMIT: 110 C | 6.0 MM/S VIBRATION LIMITS",
      normalTemp: "91.2",
      normalVib: "3.85",
      description: "Primary spinning aerodynamic compression blade stage. Heavy focus for XGBoost RUL models."
    }
  ];

  // Hotspots definitions with actual 3D center coordinate matrices
  const mapHotspots = [
    {
      id: "gpt-core",
      name: "CENTRAL FACTORYGPT AI BRAIN CORE",
      pos3d: { x: 0, y: 0, z: 20 },
      coords2d: { x: 400, y: 220 },
      desc: "Supercomputing server array command cell. Orchestrates robot axes, pipeline safety bounds, and neural prediction telemetry. Features floating electromagnetic projection vectors.",
      stat: "COMPUTE RATIO: 99.98% CYBER STABILITY INDEX",
      metricName: "MODEL ACCURACY",
      metricValue: "99.9% ACC",
      sector: "SECTOR DELTA-01",
      unrealRef: "CORE CELL CELLULAR PROTOCOLS"
    },
    {
      id: "robo-arms",
      name: "COGNITIVE ROBOTIC ASSEMBLY SWARM",
      pos3d: { x: -45, y: 40, z: 12 },
      coords2d: { x: 260, y: 310 },
      desc: "Tesla-style automation suite. Features heavy-duty articulating mechanical assembly cells fabricating high-stress carbon components. Responsive welding sparks and conveyer belt streams.",
      stat: assemblyCycleSpeed === "hyper" ? "WELD VOLTS: 820Hz PULSED VOLTAGE HYPER SPEED" : assemblyCycleSpeed === "boost" ? "WELD VOLTS: 540Hz BOOST SPEED CYCLE" : "WELD VOLTS: 418Hz NOMINAL OPERATION",
      metricName: "ROBO FEED SPEED",
      metricValue: assemblyCycleSpeed === "hyper" ? "820 HZ" : assemblyCycleSpeed === "boost" ? "540 HZ" : "418 HZ",
      sector: "ASSEMBLY HALL BE-4",
      unrealRef: "HIGH-POLY MECHANICAL ROTATORS"
    },
    {
      id: "steam-vent",
      name: "GEOTHERMAL HEAT CHIMNEY DUCTS",
      pos3d: { x: 55, y: -45, z: 15 },
      coords2d: { x: 550, y: 130 },
      desc: "Towering exhaust cooling shafts modeled on PUBG Erangel industrial yards. Safely vents internal thermodynamic heat accumulations in continuous hot-gas plumes.",
      stat: activeSteamVent ? "MITIGATION MODE: EMISSION REDUCED TO 1.84 BAR" : "MITIGATION MODE: EXHAUST BALANCE 4.82 BAR",
      metricName: "PRESSURE INDEX",
      metricValue: activeSteamVent ? "1.84 BAR" : "4.82 BAR",
      sector: "VENT COMPLEX C-3",
      unrealRef: "VOLUMETRIC FLUID ACCUMULATORS"
    },
    {
      id: "secret-lab",
      name: "HYPERTHREAT SUBTERRANEAN ANALYSIS LAB",
      pos3d: { x: 45, y: 55, z: -10 },
      coords2d: { x: 530, y: 330 },
      desc: "Sub-level research cells hidden below the mechanical deck. Audits physical edge failure cases to train adversarial hazard models under deep security seals.",
      stat: "SYNAPSE RESPONSE: 4.09ms PIPELINE SYNCHRONICITY",
      metricName: "LAB SYNC DELAY",
      metricValue: "4.09 ms",
      sector: "LAB SANCTUARY X-09",
      unrealRef: "RAYTRACED DEFENSE SECTOR"
    },
    {
      id: "reactor-grid",
      name: "SUPERCONDUCTING VOLTAGE GRID REACTOR",
      pos3d: { x: -65, y: -45, z: 15 },
      coords2d: { x: 230, y: 130 },
      desc: "High-voltage containment matrix distributing raw kilowatt balancing. High-current circuit breakers protect sub-sectors from thermal cascades. Triggers warning lightning under load spikes.",
      stat: activeEmergencyAlarms ? "BREAKER SYSTEM: ENGAGED AUXILIARY SIREN PATHS" : "BREAKER SYSTEM: NOMINAL SYNCED CONTINUUM",
      metricName: "POWER CAPACITANCE",
      metricValue: "13.8 KV",
      sector: "REACTOR CORE GA-2",
      unrealRef: "CONTAINED PLASMA INJECTORS"
    }
  ];

  const currentHotspot = mapHotspots.find((h) => h.id === hoveredHotspot) || mapHotspots[0];

  // Drag Handlers for 3D Camera Rotation
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    setIsDragging(true);
    setIsRotating(false);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startYawRef.current = yaw;
    startPitchRef.current = pitch;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    // Rotate Yaw around standard Z bounds (360) and keep Pitch camera looking from reasonable tilt heights
    setYaw((startYawRef.current - dx * 0.5 + 360) % 360);
    setPitch(Math.max(15, Math.min(85, startPitchRef.current + dy * 0.4)));
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // 3D Isometric Orthographic projection math engine
  const project3D = (x: number, y: number, z: number) => {
    const radYaw = (yaw * Math.PI) / 180;
    const radPitch = (pitch * Math.PI) / 180;

    // Apply rotation around Z-axis (Yaw)
    const rx = x * Math.cos(radYaw) - y * Math.sin(radYaw);
    const ry = x * Math.sin(radYaw) + y * Math.cos(radYaw);
    const rz = z;

    // Adjust perspective center and isometric tilt
    const px = rx;
    const py = ry * Math.cos(radPitch) - rz * Math.sin(radPitch);

    // Coordinate translation to SVG Canvas coordinates (Canvas center is 400x200)
    return {
      x: 390 + px * zoom,
      y: 190 + py * zoom,
      // For depth sorting (larger value means closer to screen)
      depth: ry * Math.sin(radPitch) + rz * Math.cos(radPitch)
    };
  };

  // Helper to resolve interactive color skins based on selection or hover
  const getBuildingColors = (sectorId: string) => {
    const isHovered = hoveredBuilding === sectorId;
    const isSelected = hoveredHotspot === sectorId;
    
    let baseStroke = currentTheme.structureStroke;
    let baseFill = currentTheme.structureFill;
    
    if (isSelected) {
      return {
        stroke: currentTheme.accent,
        fill: themeKey === "CYBERPUNK" ? "rgba(0, 240, 255, 0.22)" : "rgba(255, 107, 0, 0.16)",
        strokeWidth: 2.0
      };
    } else if (isHovered) {
      return {
        stroke: currentTheme.secondary,
        fill: themeKey === "CYBERPUNK" ? "rgba(255, 0, 127, 0.15)" : "rgba(255, 255, 255, 0.1)",
        strokeWidth: 1.5
      };
    }
    
    return {
      stroke: baseStroke,
      fill: baseFill,
      strokeWidth: 1.0
    };
  };

  // Helper function to render a solid or wireframe cuboid in 3D perspective
  const renderCuboid = (
    centerX: number,
    centerY: number,
    centerZ: number,
    dx: number,
    dy: number,
    dz: number,
    strokeColor: string,
    fillColor: string,
    strokeWidth = 1,
    extraStyles = "",
    onClick?: () => void,
    onMouseEnter?: () => void,
    onMouseLeave?: () => void
  ) => {
    // 8 vertices of the box
    const hx = dx / 2;
    const hy = dy / 2;
    const hz = dz / 2;

    const verticesOrig = [
      { x: centerX - hx, y: centerY - hy, z: centerZ - hz }, // 0
      { x: centerX + hx, y: centerY - hy, z: centerZ - hz }, // 1
      { x: centerX + hx, y: centerY + hy, z: centerZ - hz }, // 2
      { x: centerX - hx, y: centerY + hy, z: centerZ - hz }, // 3
      { x: centerX - hx, y: centerY - hy, z: centerZ + hz }, // 4
      { x: centerX + hx, y: centerY - hy, z: centerZ + hz }, // 5
      { x: centerX + hx, y: centerY + hy, z: centerZ + hz }, // 6
      { x: centerX - hx, y: centerY + hy, z: centerZ + hz }  // 7
    ];

    const projected = verticesOrig.map((v) => project3D(v.x, v.y, v.z));

    // Faces definitions (vertices indices) and depth coordinates
    const faces = [
      { indices: [0, 1, 2, 3], name: "bottom", d: (projected[0].depth + projected[1].depth + projected[2].depth + projected[3].depth) / 4 },
      { indices: [4, 5, 6, 7], name: "top", d: (projected[4].depth + projected[5].depth + projected[6].depth + projected[7].depth) / 4 },
      { indices: [0, 1, 5, 4], name: "south", d: (projected[0].depth + projected[1].depth + projected[5].depth + projected[4].depth) / 4 },
      { indices: [1, 2, 6, 5], name: "east", d: (projected[1].depth + projected[2].depth + projected[6].depth + projected[5].depth) / 4 },
      { indices: [2, 3, 7, 6], name: "north", d: (projected[2].depth + projected[3].depth + projected[7].depth + projected[6].depth) / 4 },
      { indices: [3, 0, 4, 7], name: "west", d: (projected[3].depth + projected[0].depth + projected[4].depth + projected[7].depth) / 4 }
    ];

    // Sort faces from back to front
    faces.sort((a, b) => a.d - b.d);

    return faces.map((face, index) => {
      const pts = face.indices.map((idx) => `${projected[idx].x},${projected[idx].y}`).join(" ");
      return (
        <polygon
          key={`face-${face.name}-${index}`}
          points={pts}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          className={`${extraStyles} transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      );
    });
  };

  return (
    <div id="digital-twin-wrapper" className="space-y-6">
      
      {/* Industrial Real-Time Map styling overrides */}
      <style>{`
        @keyframes pulse-ring {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -20; }
        }
        @keyframes flow-conveyor {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -24; }
        }
        @keyframes active-electric {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.95; stroke-width: 1.5px; }
        }
        .flow-line {
          stroke-dasharray: 6, 3;
          animation: flow-conveyor 1.4s infinite linear;
        }
        .electric-arc {
          animation: active-electric 0.12s infinite alternate;
        }
        .blueprint-mesh-overlay {
          animation: pulse-ring 4s infinite linear;
        }
      `}</style>

      {/* DUAL WIDGET HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-machina border border-border-machina p-4 rounded-[3px] text-left select-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-machina animate-pulse"></span>
            <h1 className="text-sm font-black tracking-widest text-text-primary uppercase font-mono">
              FACTORYGPT MULTI-THEMED VIRTUAL SCENARIO DESK
            </h1>
          </div>
          <p className="text-[10px] font-mono text-text-secondary leading-normal uppercase">
            60FPS Vector Orthographic Projector · Simulated Battleground & Industrial configurations on a single HUD space
          </p>
        </div>

        {/* 1. FAMOUS TACTICAL SKINS TRIGGER BUTTONS */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[9px] font-mono font-bold text-text-secondary pr-1 flex items-center gap-1">
            <Layers size={10} />
          </span>
          <button
            id="btn-skin-erangel"
            className="text-[9px] font-mono px-3 py-1.5 uppercase font-black border transition-all rounded-[1px] bg-accent-machina text-bg-machina border-accent-machina shadow-[0_0_8px_rgba(235,94,85,0.25)]"
          >
            ●
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left hand Map Visualizer (8 Cols) - Handcrafted Tactical Workspace */}
        <div className="lg:col-span-8 space-y-4">
          <IndustrialWidget
            title={
              layoutMode === "3d" ? "VECTOR PERSPECTIVE - ROTATABLE 3D ISO MAP" :
              layoutMode === "2d" ? "TACTICAL BLUEPRINT - 2D COMPONENT SCHEMETIC" :
              "TACTICAL HUD TABLE - INTEGRATED 3D MAP & SYNCHRONIZED 2D RADAR"
            }
            subtitle={
              layoutMode === "3d" ? `Dynamic 3D orthographic projection: drag to orbit. Current Angle: ${yaw.toFixed(0)}° Yaw` :
              layoutMode === "2d" ? "Unified 2D plant layout mapping vectors, structural guides and materials track" :
              "Co-acting workspace showing interactive rotatable 3D landscape paired with instant 2D telemetry coordinates"
            }
            headerAction={
              <div className="flex gap-2">
                <button
                  id="btn-layout-split"
                  onClick={() => setLayoutMode("split")}
                  className={`text-[9px] font-mono px-3 py-1.5 uppercase font-black border transition-all flex items-center gap-1 rounded-[1px] ${
                    layoutMode === "split" 
                      ? "bg-accent-machina text-bg-machina border-accent-machina" 
                      : "bg-card-machina text-text-secondary border-border-machina hover:text-text-primary"
                  }`}
                >
                  <Layers size={11} className="mr-0.5" />
                  <span>SPLIT-HUD VIEW</span>
                </button>
                <button
                  id="btn-layout-3d"
                  onClick={() => setLayoutMode("3d")}
                  className={`text-[9px] font-mono px-3 py-1.5 uppercase font-black border transition-all flex items-center gap-1 rounded-[1px] ${
                    layoutMode === "3d" 
                      ? "bg-accent-machina text-bg-machina border-accent-machina" 
                      : "bg-card-machina text-text-secondary border-border-machina hover:text-text-primary"
                  }`}
                >
                  <Map size={11} className="mr-0.5" />
                  <span>3D ISO MAP</span>
                </button>
                <button
                  id="btn-layout-2d"
                  onClick={() => setLayoutMode("2d")}
                  className={`text-[9px] font-mono px-3 py-1.5 uppercase font-black border transition-all flex items-center gap-1 rounded-[1px] ${
                    layoutMode === "2d" 
                      ? "bg-accent-machina text-bg-machina border-accent-machina" 
                      : "bg-card-machina text-text-secondary border-border-machina hover:text-text-primary"
                  }`}
                >
                  <Layers size={11} className="mr-0.5" />
                  <span>2D SCHEMATIC PLAN</span>
                </button>
              </div>
            }
          >
            {/* The single Map Container viewport */}
            <div 
              style={{ backgroundColor: currentTheme.floorBg }}
              className="border border-border-machina p-0 relative rounded-[3px] select-none overflow-hidden transition-all duration-500"
            >
              
              {/* EMERGENCY SIREN FLASH OVERLAY */}
              {activeEmergencyAlarms && (
                <div className="absolute inset-0 bg-red-950/20 border-2 border-red-500/30 animate-pulse pointer-events-none z-30 flex items-start justify-center pt-2">
                  <div className="bg-red-950 border border-red-500/70 text-red-500 px-3 py-1 font-mono text-[9px] uppercase font-black animate-bounce rounded-[1px] tracking-widest shadow-md flex items-center gap-1.5">
                    <ShieldAlert size={12} className="animate-pulse" />
                    <span>EMERGENCY PLANT ALARMS ENGAGED (13.8kV EXCEEDED)</span>
                  </div>
                </div>
              )}

              {/* AUTOMATED INSPECTION TOUR HUD (MANAGEMENT REVIEW PANEL) */}
              <div className="absolute top-3 right-3 bg-[#0d0d0f]/95 border border-border-machina p-3 font-mono text-[9px] text-text-secondary rounded-[2px] backdrop-blur-md space-y-2 text-left select-none w-[250px] z-20 shadow-xl pointer-events-auto">
                <div className="flex justify-between items-center">
                  <div className="text-accent-machina font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      {isTourActive && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isTourActive ? "bg-red-500" : "bg-zinc-600"}`}></span>
                    </span>
                    <span>AUTOMATED INSPECTION</span>
                  </div>
                  <span className="text-[7px] text-zinc-500 font-bold uppercase">MGT REVIEW</span>
                </div>
                
                <div className="h-[1px] bg-border-machina/60 my-1"></div>

                {isTourActive ? (
                  <div className="space-y-1.5 bg-black/40 p-2 border border-border-machina/60 rounded-[1px]">
                    <div className="flex justify-between items-center">
                      <span className="text-[7.5px] text-zinc-500">ACTIVE SEGMENT ({tourStep + 1}/{TOUR_STEPS.length}):</span>
                      <span className="text-[8px] bg-accent-machina/10 text-accent-machina px-1 rounded-[1px] font-black uppercase shadow-sm">STEPPING</span>
                    </div>
                    <div className="text-[9.5px] font-black text-white uppercase leading-normal tracking-wide">
                      {TOUR_STEPS[tourStep]?.name}
                    </div>
                    <div className="text-[7.5px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-amber-500"></span>
                      <span>{TOUR_STEPS[tourStep]?.sector}</span>
                    </div>

                    <div className="h-[1px] bg-border-machina/40 my-1"></div>

                    {/* Safety Sensor Readouts in Sequence */}
                    <div className="space-y-1 text-[8.5px]">
                      <div className="text-[7px] text-zinc-500 uppercase font-black">CRITICAL SAFETY READOUTS:</div>
                      {TOUR_STEPS[tourStep]?.safetySensors.map((sensor, sIdx) => {
                        let badgeColor = "bg-emerald-500";
                        let textColor = "text-emerald-400";
                        if (sensor.status === "warning") {
                          badgeColor = "bg-amber-500";
                          textColor = "text-amber-400";
                        } else if (sensor.status === "critical") {
                          badgeColor = "bg-red-500 animate-pulse";
                          textColor = "text-[#ff6b6b] font-extrabold";
                        }
                        return (
                          <div key={sIdx} className="flex justify-between items-center bg-black/20 p-1 border border-border-machina/30">
                            <span className="text-zinc-400">{sensor.label}:</span>
                            <span className={`font-mono flex items-center gap-1 ${textColor}`}>
                              <span className={`w-1 h-1 rounded-full ${badgeColor}`}></span>
                              {sensor.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="h-[1px] bg-border-machina/40 my-1"></div>

                    <div className="space-y-1 text-[8px]">
                      <span className="text-zinc-500 uppercase block">ZONE STATE OVERVIEW:</span>
                      <p className="text-text-primary uppercase leading-tight text-[8px] italic">
                        "{TOUR_STEPS[tourStep]?.operationalStatus}"
                      </p>
                    </div>

                    {/* Real-time progression bar (duration based) */}
                    <div className="space-y-1 pt-1.5">
                      <div className="flex justify-between text-[7px] text-zinc-500">
                        <span>SEGMENT PROGRESS:</span>
                        <span>{((tourSecondsElapsed / (TOUR_STEPS[tourStep]?.duration || 6)) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-[#1e1e24] h-[3px] rounded-full overflow-hidden">
                        <div 
                          className="bg-accent-machina h-[3px] transition-all duration-1000 ease-linear"
                          style={{ width: `${(tourSecondsElapsed / (TOUR_STEPS[tourStep]?.duration || 6)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 py-3 text-center text-zinc-500 bg-black/20 border border-dashed border-border-machina/50 rounded-[1px]">
                    <span className="block text-[8px] font-bold text-zinc-400">TOUR SYSTEM STANDBY</span>
                    <p className="text-[7.5px] leading-relaxed mx-2">
                      Initiate programmatic inspection sequence sweep of all critical factory sectors for management safety review.
                    </p>
                  </div>
                )}

                {/* Control Actions Column */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      setIsTourActive(!isTourActive);
                      setIsRotating(false);
                      if (!isTourActive) {
                        // Initialize first step target camera
                        const currentStepData = TOUR_STEPS[tourStep];
                        targetYawRef.current = currentStepData.camera.yaw;
                        targetPitchRef.current = currentStepData.camera.pitch;
                        targetZoomRef.current = currentStepData.camera.zoom;
                        setHoveredHotspot(currentStepData.id);
                      } else {
                        // Stop tour, return to standard orbiting
                        targetYawRef.current = null;
                        targetPitchRef.current = null;
                        targetZoomRef.current = null;
                        setIsRotating(true);
                      }
                    }}
                    className={`px-2 py-1.5 border text-[8px] uppercase font-black text-center flex items-center justify-center gap-1 rounded-[1px] cursor-pointer transition-all ${
                      isTourActive 
                        ? "bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b] hover:bg-[#ff6b6b]/30" 
                        : "bg-card-machina text-accent-machina border-border-machina hover:border-accent-machina"
                    }`}
                  >
                    <Play size={10} className={isTourActive ? "hidden" : "inline"} />
                    <span>{isTourActive ? "STOP INSPECT" : "START MGT TOUR"}</span>
                  </button>
                  
                  <div className="flex gap-1">
                    <button
                      disabled={!isTourActive}
                      onClick={() => {
                        setTourStep((s) => (s - 1 + TOUR_STEPS.length) % TOUR_STEPS.length);
                        setTourSecondsElapsed(0);
                      }}
                      className="flex-1 px-1 py-1.5 border border-border-machina bg-bg-machina hover:text-text-primary text-[8px] uppercase font-bold text-center rounded-[1px] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      PREV
                    </button>
                    <button
                      disabled={!isTourActive}
                      onClick={() => {
                        setTourStep((s) => (s + 1) % TOUR_STEPS.length);
                        setTourSecondsElapsed(0);
                      }}
                      className="flex-1 px-1 py-1.5 border border-border-machina bg-bg-machina hover:text-text-primary text-[8px] uppercase font-bold text-center rounded-[1px] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      NEXT
                    </button>
                  </div>
                </div>
              </div>

              {/* TACTICAL FLOATING ZOOM & AUTO-ROTATION CONTROLS ON THE MAP CANVAS */}
              <div className="absolute top-3 left-3 bg-[#0d0d0f]/90 border border-border-machina p-2.5 font-mono text-[9px] text-text-secondary rounded-[2px] backdrop-blur space-y-1.5 text-left select-none max-w-[210px] z-20 shadow-lg pointer-events-auto">
                <div className="text-accent-machina font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                  <Radio size={10} className="animate-pulse" />
                  <span>PERSPECTIVE ADAPTERS</span>
                </div>
                <div className="h-[1px] bg-border-machina my-1"></div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsRotating(!isRotating)}
                    className={`px-1 rounded-[1px] py-0.5 border text-[8px] uppercase font-bold text-center flex-1 ${
                      isRotating ? "bg-accent-machina text-[#0e0e0e] border-accent-machina" : "bg-[#18181a] text-text-secondary border-border-machina"
                    }`}
                  >
                    {isRotating ? "AUTO-ROT NOM" : "AUTO-ROT OFF"}
                  </button>
                  <button
                    onClick={() => {
                      setYaw(315);
                      setPitch(45);
                      setZoom(1.55);
                      if (addHistory) addHistory("SYSTEM_RESET", "PERSPECTIVE RESET", "Returned rotatable maps viewport angle definitions to system defaults.");
                    }}
                    className="px-1 py-0.5 border border-border-machina bg-[#18181a] hover:text-text-primary text-[8px] uppercase font-medium rounded-[1px]"
                  >
                    RESET
                  </button>
                </div>

                {/* ADVANCED CAMERA PRESETS */}
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    onClick={() => {
                      targetYawRef.current = 315; targetPitchRef.current = 45; targetZoomRef.current = 1.4; setIsRotating(false);
                      if (addHistory) addHistory("SYSTEM_RESET", "CAM_ISO", "Aligned virtual camera to high-contrast 3D Isometric default.");
                    }}
                    className="px-1 py-0.5 border border-border-machina bg-[#141519] text-text-secondary hover:text-accent-machina text-[7.5px] uppercase font-black tracking-wider rounded-[1.5px] truncate cursor-pointer"
                  >
                    ISO VIEW
                  </button>
                  <button
                    onClick={() => {
                      targetYawRef.current = 270; targetPitchRef.current = 85; targetZoomRef.current = 1.1; setIsRotating(false);
                      if (addHistory) addHistory("SYSTEM_RESET", "CAM_OVERHEAD", "Aligned virtual camera to 2D Planar Orthogonal view.");
                    }}
                    className="px-1 py-0.5 border border-border-machina bg-[#141519] text-text-secondary hover:text-accent-machina text-[7.5px] uppercase font-black tracking-wider rounded-[1.5px] truncate cursor-pointer"
                  >
                    BIRD'S EYE
                  </button>
                  <button
                    onClick={() => {
                      targetYawRef.current = 225; targetPitchRef.current = 40; targetZoomRef.current = 2.1; setIsRotating(false);
                      if (addHistory) addHistory("SYSTEM_RESET", "CAM_REACTOR", "Focused high-zoom optic telemetry matrices on Reactor core.");
                    }}
                    className="px-1 py-0.5 border border-border-machina bg-[#141519] text-text-secondary hover:text-accent-machina text-[7.5px] uppercase font-black tracking-wider rounded-[1.5px] truncate cursor-pointer"
                  >
                    REACTOR CAM
                  </button>
                  <button
                    onClick={() => {
                      targetYawRef.current = 45; targetPitchRef.current = 35; targetZoomRef.current = 1.85; setIsRotating(false);
                      if (addHistory) addHistory("SYSTEM_RESET", "CAM_FURNACE", "Focused high-zoom optic telemetry matrices on Furnace bed.");
                    }}
                    className="px-1 py-0.5 border border-border-machina bg-[#141519] text-text-secondary hover:text-accent-machina text-[7.5px] uppercase font-black tracking-wider rounded-[1.5px] truncate cursor-pointer"
                  >
                    FURNACE CAM
                  </button>
                </div>

                <div className="space-y-1 pt-1 text-[8px]">
                  <div className="flex justify-between">
                    <span>PAN CAMERA YAW:</span>
                    <span className="text-text-primary font-bold">{yaw.toFixed(0)}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    value={yaw.toFixed(0)}
                    onChange={(e) => {
                      setYaw(Number(e.target.value));
                      setIsRotating(false);
                      targetYawRef.current = null;
                    }}
                    className="w-full accent-accent-machina bg-[#1a1a1e]"
                  />

                  <div className="flex justify-between">
                    <span>PAN CAMERA PITCH:</span>
                    <span className="text-text-primary font-bold">{pitch.toFixed(0)}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" 
                    max="85" 
                    value={pitch.toFixed(0)}
                    onChange={(e) => {
                      setPitch(Number(e.target.value));
                      setIsRotating(false);
                      targetPitchRef.current = null;
                    }}
                    className="w-full accent-accent-machina bg-[#1a1a1e]"
                  />

                  <div className="flex justify-between">
                    <span>ZOOM GRID INDEX:</span>
                    <span className="text-text-primary font-bold">{zoom.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="2.5" 
                    step="0.05"
                    value={zoom}
                    onChange={(e) => {
                      setZoom(Number(e.target.value));
                      targetZoomRef.current = null;
                    }}
                    className="w-full accent-accent-machina bg-[#1a1a1e]"
                  />
                </div>

                <div className="h-[1px] bg-border-machina my-1"></div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="chk-blueprints-overlay"
                      checked={showBlueprintsOverlay}
                      onChange={() => setShowBlueprintsOverlay(!showBlueprintsOverlay)}
                      className="accent-accent-machina w-3 h-3 cursor-pointer"
                    />
                    <label htmlFor="chk-blueprints-overlay" className="cursor-pointer select-none text-[8px] font-bold text-text-primary uppercase">
                      2D SCANNERS ON FLOOR
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="chk-show-workers"
                      checked={showWorkers}
                      onChange={() => setShowWorkers(!showWorkers)}
                      className="accent-accent-machina w-3 h-3 cursor-pointer"
                    />
                    <label htmlFor="chk-show-workers" className="cursor-pointer select-none text-[8px] font-bold text-text-primary uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full inline-block"></span>
                      <span>TRACK ACTIVE WORKERS</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="chk-show-pipelines"
                      checked={showPipelines}
                      onChange={() => setShowPipelines(!showPipelines)}
                      className="accent-accent-machina w-3 h-3 cursor-pointer"
                    />
                    <label htmlFor="chk-show-pipelines" className="cursor-pointer select-none text-[8px] font-bold text-text-primary uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#a855f7] rounded-full inline-block"></span>
                      <span>SHOW SYSTEM PIPELINES</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="chk-show-heatmap"
                      checked={showThermalHeatmap}
                      onChange={() => setShowThermalHeatmap(!showThermalHeatmap)}
                      className="accent-accent-machina w-3 h-3 cursor-pointer"
                    />
                    <label htmlFor="chk-show-heatmap" className="cursor-pointer select-none text-[8px] font-bold text-text-primary uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#ef4444] rounded-full inline-block"></span>
                      <span>THERMOGRAPHY OVERLAYS</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* VIEWPORTS CONTAINER RENDERING LAYOUT MODES */}
              <div className="relative w-full aspect-[16/9] min-h-[460px] flex transition-all duration-300">
                
                {/* 3D RENDERING WORKSPACE OR SPLIT MAP LEFT SCREEN */}
                {(layoutMode === "3d" || layoutMode === "split") && (
                  <div className={`relative h-full flex-1 overflow-hidden flex items-center justify-center ${layoutMode === "split" ? "border-r border-border-machina" : ""}`}>
                    
                    {/* SVG canvas supporting manual dragging for camera orbit */}
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 800 450"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUpOrLeave}
                      onMouseLeave={handleMouseUpOrLeave}
                      className={`w-full h-full cursor-grab active:cursor-grabbing select-none transition-all duration-300`}
                    >
                      <defs>
                        {/* Shaders gradients matching selected industrial preset */}
                        <linearGradient id="reactor-plasma" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={currentTheme.accent} stopOpacity="0.8" />
                          <stop offset="100%" stopColor={currentTheme.secondary} stopOpacity="0.2" />
                        </linearGradient>
                        <linearGradient id="cyber-core-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={currentTheme.accent} stopOpacity="0.9" />
                          <stop offset="50%" stopColor={currentTheme.accent} stopOpacity="0.3" />
                          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* GROUND LEVEL 2D RADIAL SCHEMATIC MESH OVERLAYS (Unified 2D coordinate floor grid inside 3D map) */}
                      {showBlueprintsOverlay && (
                        <g>
                          {/* Main revolving coordinate scanner ring */}
                          <circle
                            cx="390"
                            cy="190"
                            r={120 * zoom}
                            fill="none"
                            stroke={currentTheme.accent}
                            strokeWidth="1"
                            strokeOpacity="0.22"
                          />
                          <circle
                            cx="390"
                            cy="190"
                            r={160 * zoom}
                            fill="none"
                            stroke={currentTheme.accent}
                            strokeWidth="0.75"
                            strokeOpacity="0.12"
                            strokeDasharray="6 8"
                            className="blueprint-mesh-overlay"
                          />
                          <circle
                            cx="390"
                            cy="190"
                            r={60 * zoom}
                            fill="none"
                            stroke={currentTheme.accent}
                            strokeWidth="1"
                            strokeOpacity="0.08"
                            strokeDasharray="1 4"
                          />

                          {/* Flat floor layout crosslines */}
                          <line
                            x1={390 - 180 * zoom}
                            y1={190}
                            x2={390 + 180 * zoom}
                            y2={190}
                            stroke={currentTheme.accent}
                            strokeWidth="0.5"
                            strokeOpacity="0.15"
                            strokeDasharray="3 3"
                          />
                          <line
                            x1={390}
                            y1={190 - 180 * zoom}
                            x2={390}
                            y2={190 + 180 * zoom}
                            stroke={currentTheme.accent}
                            strokeWidth="0.5"
                            strokeOpacity="0.15"
                            strokeDasharray="3 3"
                          />

                          {/* Render projected grid coordinate ticks dynamically on the rotated floor z = 0 */}
                          {[-120, -80, -40, 0, 40, 80, 120].map((gridX) => (
                            <g key={`grid-ticks-${gridX}`}>
                              {/* X grids running along the Y ax */}
                              <path
                                d={`M ${project3D(gridX, -120, 0).x} ${project3D(gridX, -120, 0).y} L ${project3D(gridX, 120, 0).x} ${project3D(gridX, 120, 0).y}`}
                                fill="none"
                                stroke={currentTheme.accent}
                                strokeWidth="0.5"
                                strokeOpacity="0.07"
                              />
                              <path
                                d={`M ${project3D(-120, gridX, 0).x} ${project3D(-120, gridX, 0).y} L ${project3D(120, gridX, 0).x} ${project3D(120, gridX, 0).y}`}
                                fill="none"
                                stroke={currentTheme.accent}
                                strokeWidth="0.5"
                                strokeOpacity="0.07"
                              />
                            </g>
                          ))}
                        </g>
                      )}

                      {/* 2D PROJECTION GUIDES: Upward vertical vectors (Connecting 2D to 3D elements) */}
                      {showBlueprintsOverlay && mapHotspots.map((spot) => {
                        const baseProj = project3D(spot.pos3d.x, spot.pos3d.y, 0);
                        const structureProj = project3D(spot.pos3d.x, spot.pos3d.y, spot.pos3d.z);
                        return (
                          <g key={`proj-link-${spot.id}`}>
                            {/* Dotted projection alignment vector lines */}
                            <line
                              x1={baseProj.x}
                              y1={baseProj.y}
                              x2={structureProj.x}
                              y2={structureProj.y}
                              stroke={currentTheme.accent}
                              strokeWidth="0.8"
                              strokeOpacity="0.35"
                              strokeDasharray="2 3"
                            />
                            {/* Target shadow ring at the projected floor footprint base */}
                            <ellipse
                              cx={baseProj.x}
                              cy={baseProj.y}
                              rx={12 * zoom}
                              ry={6 * zoom}
                              fill="none"
                              stroke={hoveredHotspot === spot.id ? currentTheme.accent : currentTheme.secondary}
                              strokeOpacity={hoveredHotspot === spot.id ? "0.65" : "0.2"}
                              strokeWidth="1"
                            />
                            {/* Minor alphanumeric coordinate stamp */}
                            <text
                              x={baseProj.x + 8}
                              y={baseProj.y + 4}
                              fill={currentTheme.accent}
                              fillOpacity="0.5"
                              className="font-mono text-[7px]"
                            >
                              X:{spot.pos3d.x} Y:{spot.pos3d.y}
                            </text>
                          </g>
                        );
                      })}

                      {/* PRO 3D STRUCTURE 1: THE ACCURED COILL REACTOR MATRIX (reactor-grid) */}
                      <g 
                        className="cursor-pointer"
                        onClick={() => {
                          setHoveredHotspot("reactor-grid");
                          if (addHistory) addHistory("SAFETY_SCAN", "REACTOR", "Operator selected reactor voltage grid structure.");
                        }}
                        onMouseEnter={() => setHoveredBuilding("reactor-grid")}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        {/* Reactor concrete pad at center (-65, -45) */}
                        {renderCuboid(-65, -45, 0, 32, 32, 6, getBuildingColors("reactor-grid").stroke, getBuildingColors("reactor-grid").fill, getBuildingColors("reactor-grid").strokeWidth, "",
                          () => setHoveredHotspot("reactor-grid"),
                          () => setHoveredBuilding("reactor-grid"),
                          () => setHoveredBuilding(null)
                        )}
                        {/* Upper energy containment glass dome */}
                        {renderCuboid(-65, -45, 8, 20, 20, 10, getBuildingColors("reactor-grid").stroke, cryoCoolantBypassActive ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.01)", getBuildingColors("reactor-grid").strokeWidth, "",
                          () => setHoveredHotspot("reactor-grid"),
                          () => setHoveredBuilding("reactor-grid"),
                          () => setHoveredBuilding(null)
                        )}
                        
                        {/* Spinning reactor containment energy fields (Neon rings) */}
                        {(() => {
                          const reactorCenter = project3D(-65, -45, 12);
                          // We calculate orbiting rings projecting ellipses
                          return (
                            <g>
                              <ellipse
                                cx={reactorCenter.x}
                                cy={reactorCenter.y}
                                rx={(cryoCoolantBypassActive ? 18 : 14) * zoom}
                                ry={(cryoCoolantBypassActive ? 8 : 6) * zoom}
                                fill="none"
                                stroke={cryoCoolantBypassActive ? "#ef4444" : currentTheme.accent}
                                strokeWidth={cryoCoolantBypassActive ? "3.5" : "2.5"}
                                strokeOpacity="0.8"
                                className="animate-pulse"
                                style={{ transformOrigin: `${reactorCenter.x}px ${reactorCenter.y}px` }}
                              />
                              <ellipse
                                cx={reactorCenter.x}
                                cy={reactorCenter.y}
                                rx={18 * zoom}
                                ry={8 * zoom}
                                fill="none"
                                stroke={currentTheme.secondary}
                                strokeWidth="0.85"
                                strokeOpacity="0.6"
                                strokeDasharray="3 3"
                              />
                            </g>
                          );
                        })()}

                        {/* REACTIVE ELECTRICAL BOLT SCANNERS GENERATOR (Tesla voltage arcs) */}
                        {(activeEmergencyAlarms || cryoCoolantBypassActive || assemblyCycleSpeed === "hyper") && (
                          <g stroke={cryoCoolantBypassActive ? "#ef4444" : (themeKey === "CYBERPUNK" ? "#ff007f" : currentTheme.accent)} strokeWidth="1.3" fill="none" className="electric-arc">
                            {/* Lightning discharge paths striking from reactor dome down to base terminals */}
                            {(() => {
                              const r1 = project3D(-65, -45, 15);
                              const rEnd1 = project3D(-82, -30, 0);
                              const rEnd2 = project3D(-50, -58, 0);
                              const rEnd3 = project3D(-65, -45, 0);

                              // Draw random jagged voltage path lines
                              const jagX1 = (r1.x + rEnd1.x) / 2 + (Math.random() * 20 - 10);
                              const jagY1 = (r1.y + rEnd1.y) / 2 + (Math.random() * 20 - 10);

                              const jagX2 = (r1.x + rEnd2.x) / 2 + (Math.random() * 20 - 10);
                              const jagY2 = (r1.y + rEnd2.y) / 2 + (Math.random() * 20 - 10);

                              return (
                                <g>
                                  <polyline points={`${r1.x},${r1.y} ${jagX1},${jagY1} ${rEnd1.x},${rEnd1.y}`} />
                                  <polyline points={`${r1.x},${r1.y} ${jagX2},${jagY2} ${rEnd2.x},${rEnd2.y}`} />
                                  {(activeEmergencyAlarms || cryoCoolantBypassActive) && (
                                    <line x1={r1.x} y1={r1.y} x2={rEnd3.x} y2={rEnd3.y} strokeWidth="2" />
                                  )}
                                </g>
                              );
                            })()}
                          </g>
                        )}
                      </g>

                      {/* PRO 3D STRUCTURE 2: THE TESLA ARTICULATED ASSEMBLY LINES & ROBOT ARMS (robo-arms) */}
                      <g 
                        className="cursor-pointer"
                        onClick={() => {
                          setHoveredHotspot("robo-arms");
                          if (addHistory) addHistory("SAFETY_SCAN", "ROBOTICS", "Operator selected articulated manufacturing lanes.");
                        }}
                        onMouseEnter={() => setHoveredBuilding("robo-arms")}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        {/* Conveyor path platform lines */}
                        {renderCuboid(-45, 40, 2, 44, 12, 4, getBuildingColors("robo-arms").stroke, getBuildingColors("robo-arms").fill, getBuildingColors("robo-arms").strokeWidth, "",
                          () => setHoveredHotspot("robo-arms"),
                          () => setHoveredBuilding("robo-arms"),
                          () => setHoveredBuilding(null)
                        )}

                        {/* Conveyor run flow paths for loaded elements */}
                        {(() => {
                          const beltStartProj = project3D(-67, 40, 4);
                          const beltEndProj = project3D(-23, 40, 4);
                          return (
                            <line
                              x1={beltStartProj.x}
                              y1={beltStartProj.y}
                              x2={beltEndProj.x}
                              y2={beltEndProj.y}
                              stroke={conveyorStopped ? "#f43f5e" : currentTheme.accent}
                              strokeWidth="1.5"
                              strokeOpacity={conveyorStopped ? "0.9" : "0.75"}
                              strokeDasharray={conveyorStopped ? "2 2" : "none"}
                              className={conveyorStopped ? "" : "flow-line"}
                            />
                          );
                        })()}

                        {/* ACTIVE CARGO BOX MOVING ON CONVEYER (Dynamic 3D Projector calculation) */}
                        {(() => {
                          // Cargo moves relative to time ticker
                          const speedFactor = conveyorStopped ? 0.0 : (assemblyCycleSpeed === "hyper" ? 4.0 : assemblyCycleSpeed === "boost" ? 2.2 : 1.1);
                          const cargoProgress = speedFactor === 0 ? 0 : (((timeTicker * speedFactor) % 44) - 22); // Offset center value range from -22 to +22
                          const cargoPos = { x: -45 + cargoProgress, y: 40, z: 6 };

                          // Render active flowing manufacturing component
                          return renderCuboid(
                            cargoPos.x,
                            cargoPos.y,
                            cargoPos.z,
                            6,
                            6,
                            5,
                            conveyorStopped ? "#ef4444" : currentTheme.accent,
                            conveyorStopped ? "rgba(220,38,38,0.3)" : currentTheme.cargoColor,
                            1,
                            "",
                            () => setHoveredHotspot("robo-arms"),
                            () => setHoveredBuilding("robo-arms"),
                            () => setHoveredBuilding(null)
                          );
                        })()}

                        {/* HIGH TECH COGNITIVE ROBOT WORKING PLATING ARM */}
                        {(() => {
                          const roboBase = { x: -45, y: 55, z: 2 };
                          const baseProj = project3D(roboBase.x, roboBase.y, roboBase.z);

                          // The robot arm joint angles sweep back and forth based on the timer ticker
                          const cycleSpeedScalar = conveyorStopped ? 0.0 : (assemblyCycleSpeed === "hyper" ? 0.35 : assemblyCycleSpeed === "boost" ? 0.18 : 0.08);
                          const jointAngle = conveyorStopped ? 0.1 : Math.sin(timeTicker * cycleSpeedScalar) * 0.45; // Swing angle rads

                          const limbLength1 = 15;
                          const limbLength2 = 12;

                          // Joint 1 vector coordinates rotated
                          const joint1 = {
                            x: roboBase.x + Math.sin(jointAngle) * limbLength1,
                            y: roboBase.y - Math.cos(jointAngle) * limbLength1,
                            z: roboBase.z + 12
                          };
                          const joint1Proj = project3D(joint1.x, joint1.y, joint1.z);

                          // Joint 2 (Rifle weld head) tip coordinate pointing toward conveyor belt item path
                          const joint2 = {
                            x: -45 + (conveyorStopped ? 0 : Math.sin(timeTicker * cycleSpeedScalar) * 6),
                            y: 40,
                            z: 7
                          };
                          const joint2Proj = project3D(joint2.x, joint2.y, joint2.z);

                          return (
                            <g>
                              {/* Robot base plate */}
                              {renderCuboid(roboBase.x, roboBase.y, roboBase.z, 10, 10, 4, getBuildingColors("robo-arms").stroke, getBuildingColors("robo-arms").fill, getBuildingColors("robo-arms").strokeWidth, "",
                                () => setHoveredHotspot("robo-arms"),
                                () => setHoveredBuilding("robo-arms"),
                                () => setHoveredBuilding(null)
                              )}

                              {/* Segment 1: Heavy lower loader limb segment */}
                              <line
                                x1={baseProj.x}
                                y1={baseProj.y - 2}
                                x2={joint1Proj.x}
                                y2={joint1Proj.y}
                                stroke={conveyorStopped ? "#f43f5e" : currentTheme.accent}
                                strokeWidth="3"
                                strokeLinecap="round"
                              />

                              {/* Segment 2: Secondary pneumatic weld arm */}
                              <line
                                x1={joint1Proj.x}
                                y1={joint1Proj.y}
                                x2={joint2Proj.x}
                                y2={joint2Proj.y}
                                stroke={conveyorStopped ? "#fda4af" : currentTheme.secondary}
                                strokeWidth="2"
                                strokeLinecap="round"
                              />

                              {/* Welding bright spark pointer lasers */}
                              {!conveyorStopped && (
                                <>
                                  <line
                                    x1={joint2Proj.x}
                                    y1={joint2Proj.y}
                                    x2={project3D(-45, 40, 4).x}
                                    y2={project3D(-45, 40, 4).y}
                                    stroke={currentTheme.accent}
                                    strokeWidth="0.8"
                                    strokeOpacity="0.8"
                                    strokeDasharray="1 3"
                                  />

                                  {/* Glowing weld point effect */}
                                  <circle
                                    cx={joint2Proj.x}
                                    cy={joint2Proj.y}
                                    r="4"
                                    fill={currentTheme.accent}
                                    className="animate-ping"
                                  />
                                  <circle
                                    cx={joint2Proj.x}
                                    cy={joint2Proj.y}
                                    r="2"
                                    fill="#ffffff"
                                  />
                                </>
                              )}
                            </g>
                          );
                        })()}
                      </g>

                      {/* PRO 3D STRUCTURE 3: THE ERANGEL COOLING TOWERS WITH EMITTED FLUID PARTICLES (steam-vent) */}
                      <g 
                        className="cursor-pointer"
                        onClick={() => {
                          setHoveredHotspot("steam-vent");
                          if (addHistory) addHistory("SAFETY_SCAN", "STEAM", "Operator clicked 3D Chimneys and steam vents.");
                        }}
                        onMouseEnter={() => setHoveredBuilding("steam-vent")}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        {/* Base industrial piping duct boxes */}
                        {renderCuboid(55, -45, 0, 26, 26, 4, getBuildingColors("steam-vent").stroke, getBuildingColors("steam-vent").fill, getBuildingColors("steam-vent").strokeWidth, "",
                          () => setHoveredHotspot("steam-vent"),
                          () => setHoveredBuilding("steam-vent"),
                          () => setHoveredBuilding(null)
                        )}

                        {/* Three distinct high-elevation Erangel mechanical cooling stacks */}
                        {([
                          { cx: 48, cy: -52, h: 32, label: "T-01" },
                          { cx: 62, cy: -38, h: 26, label: "T-02" }
                        ]).map((stack, idx) => {
                          const baseRing = project3D(stack.cx, stack.cy, 2);
                          const topRing = project3D(stack.cx, stack.cy, stack.h);
                          
                          // Taper layout coordinates
                          const stackWidthBase = 12 * zoom;
                          const stackWidthTop = 7 * zoom;

                          return (
                            <g key={`chimney-tower-${idx}`}>
                              {/* Left support profile line */}
                              <line
                                x1={baseRing.x - stackWidthBase}
                                y1={baseRing.y}
                                x2={topRing.x - stackWidthTop}
                                y2={topRing.y}
                                stroke={currentTheme.structureStroke}
                                strokeWidth="1"
                              />
                              {/* Right support profile line */}
                              <line
                                x1={baseRing.x + stackWidthBase}
                                y1={baseRing.y}
                                x2={topRing.x + stackWidthTop}
                                y2={topRing.y}
                                stroke={currentTheme.structureStroke}
                                strokeWidth="1"
                              />
                              {/* Inner cross wire-structure frame */}
                              <line
                                x1={baseRing.x - stackWidthBase}
                                y1={baseRing.y}
                                x2={topRing.x + stackWidthTop}
                                y2={topRing.y}
                                stroke={currentTheme.structureStroke}
                                strokeWidth="0.5"
                                strokeOpacity="0.2"
                              />
                              <line
                                x1={baseRing.x + stackWidthBase}
                                y1={baseRing.y}
                                x2={topRing.x - stackWidthTop}
                                y2={topRing.y}
                                stroke={currentTheme.structureStroke}
                                strokeWidth="0.5"
                                strokeOpacity="0.2"
                              />

                              {/* Top containment ring */}
                              <ellipse
                                cx={topRing.x}
                                cy={topRing.y}
                                rx={stackWidthTop}
                                ry={2.5 * zoom}
                                fill={currentTheme.structureFill}
                                stroke={currentTheme.accent}
                                strokeWidth="1.5"
                              />
                              <ellipse
                                cx={baseRing.x}
                                cy={baseRing.y}
                                rx={stackWidthBase}
                                ry={4.5 * zoom}
                                fill="none"
                                stroke={currentTheme.accent}
                                strokeWidth="0.8"
                                strokeOpacity="0.35"
                              />
                            </g>
                          );
                        })}

                        {/* RISING SMOKE PARTICLES - PROJECTED IN REAL-TIME */}
                        {smokeParticles.map((p, idx) => {
                          const proj = project3D(p.x, p.y, p.z);
                          return (
                            <circle
                              key={`p-${p.id}-${idx}-${p.z.toFixed(2)}`}
                              cx={proj.x}
                              cy={proj.y}
                              r={p.r * zoom * 0.6}
                              fill={themeKey === "CYBERPUNK" ? "#00f0ff" : "#808a9d"}
                              fillOpacity={p.alpha * 0.4}
                              className="pointer-events-none"
                            />
                          );
                        })}
                      </g>

                      {/* PRO 3D STRUCTURE 4: THE CYBERPUNK ROTATING CENTRAL COGNITIVE BRAIN CORE (gpt-core) */}
                      <g 
                        className="cursor-pointer"
                        onClick={() => {
                          setHoveredHotspot("gpt-core");
                          if (addHistory) addHistory("SAFETY_SCAN", "CORE", "Operator hovered and selected AI central mainframes.");
                        }}
                        onMouseEnter={() => setHoveredBuilding("gpt-core")}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        {/* Sublevel supercomputer servers footprint pedestal (0,0) */}
                        {renderCuboid(0, 0, 0, 36, 36, 5, getBuildingColors("gpt-core").stroke, getBuildingColors("gpt-core").fill, getBuildingColors("gpt-core").strokeWidth, "",
                          () => setHoveredHotspot("gpt-core"),
                          () => setHoveredBuilding("gpt-core"),
                          () => setHoveredBuilding(null)
                        )}

                        {/* Central Hovering brain core object (Octahedron or holographic rotating prisms) */}
                        {(() => {
                          // Core hovers based on a real-time wave
                          const hoverZ = 24 + Math.sin(timeTicker * 0.05) * 4;
                          const coreSize = 15;
                          
                          // Project core vertices
                          const cTop = project3D(0, 0, hoverZ + coreSize);
                          const cBottom = project3D(0, 0, hoverZ - coreSize);
                          
                          // Rotating side nodes mapping vertices
                          const rotScalar = timeTicker * 0.02;
                          const edges = [
                            { x: Math.cos(rotScalar) * 12, y: Math.sin(rotScalar) * 12 },
                            { x: Math.cos(rotScalar + Math.PI/2) * 12, y: Math.sin(rotScalar + Math.PI/2) * 12 },
                            { x: Math.cos(rotScalar + Math.PI) * 12, y: Math.sin(rotScalar + Math.PI) * 12 },
                            { x: Math.cos(rotScalar + Math.PI*1.5) * 12, y: Math.sin(rotScalar + Math.PI*1.5) * 12 }
                          ];

                          const edgeProjs = edges.map(e => project3D(e.x, e.y, hoverZ));

                          return (
                            <g key="gpt-hover-core" className="transition-all duration-300">
                              {/* Draw wireframe diamond prism lines (holographic geometry) */}
                              {edgeProjs.map((ep, i) => {
                                const nextEp = edgeProjs[(i + 1) % 4];
                                return (
                                  <g key={`core-prism-edge-${i}`}>
                                    {/* Face 1: Top pyramids */}
                                    <polygon
                                      points={`${cTop.x},${cTop.y} ${ep.x},${ep.y} ${nextEp.x},${nextEp.y}`}
                                      fill={currentTheme.structureFill}
                                      stroke={currentTheme.accent}
                                      strokeWidth="1.25"
                                      strokeOpacity="0.8"
                                    />
                                    {/* Face 2: Bottom pyramids */}
                                    <polygon
                                      points={`${cBottom.x},${cBottom.y} ${ep.x},${ep.y} ${nextEp.x},${nextEp.y}`}
                                      fill="transparent"
                                      stroke={currentTheme.secondary}
                                      strokeWidth="0.8"
                                      strokeOpacity="0.4"
                                      strokeDasharray="2 2"
                                    />
                                  </g>
                                );
                              })}

                              {/* Core core glowing sphere inside diamond */}
                              <circle
                                cx={project3D(0,0, hoverZ).x}
                                cy={project3D(0,0, hoverZ).y}
                                r={isNeuralCalibrating ? 8 * zoom : 5 * zoom}
                                fill={isNeuralCalibrating ? "#ff007f" : currentTheme.accent}
                                className="animate-pulse shadow-md"
                              />

                              {/* Rotating vertical holographic datalines projecting client info */}
                              <line
                                x1={project3D(0, 0, hoverZ + coreSize + 8).x}
                                y1={project3D(0, 0, hoverZ + coreSize + 8).y}
                                x2={project3D(0, 0, hoverZ - coreSize - 8).x}
                                y2={project3D(0, 0, hoverZ - coreSize - 8).y}
                                stroke={currentTheme.accent}
                                strokeWidth="0.5"
                                strokeOpacity="0.55"
                                strokeDasharray="4 2"
                              />
                            </g>
                          );
                        })()}
                      </g>

                      {/* PRO 3D STRUCTURE 5: THE SUBTERRANEAN EXPERIMENTAL SECURE CELL (secret-lab) */}
                      <g 
                        className="cursor-pointer"
                        onClick={() => {
                          setHoveredHotspot("secret-lab");
                          if (addHistory) addHistory("SAFETY_SCAN", "LAB", "Operator selected underground test and fracture chamber.");
                        }}
                        onMouseEnter={() => setHoveredBuilding("secret-lab")}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        {/* Sub level cavity boundaries (down to z = -15) */}
                        {renderCuboid(45, 55, -10, 30, 30, 14, getBuildingColors("secret-lab").stroke, getBuildingColors("secret-lab").fill, getBuildingColors("secret-lab").strokeWidth, "",
                          () => setHoveredHotspot("secret-lab"),
                          () => setHoveredBuilding("secret-lab"),
                          () => setHoveredBuilding(null)
                        )}

                        {/* Inside molecular helix rotating structure */}
                        {(() => {
                          const helixProj1 = project3D(45 + Math.sin(timeTicker * 0.04) * 6, 55 + Math.cos(timeTicker * 0.04) * 6, -10);
                          const helixProj2 = project3D(45 - Math.sin(timeTicker * 0.04) * 6, 55 - Math.cos(timeTicker * 0.04) * 6, -16);
                          
                          return (
                            <g>
                              {/* Center connecting shaft */}
                              <line
                                x1={helixProj1.x}
                                y1={helixProj1.y}
                                x2={helixProj2.x}
                                y2={helixProj2.y}
                                stroke={labStressActive ? "#f97316" : currentTheme.secondary}
                                strokeWidth={labStressActive ? "3.5" : "1.5"}
                                strokeOpacity="0.8"
                              />
                              {/* Molecule top cap */}
                              <circle cx={helixProj1.x} cy={helixProj1.y} r={labStressActive ? "7" : "4.5"} fill={labStressActive ? "#ff5500" : currentTheme.accent} className={labStressActive ? "animate-bounce" : ""} />
                              {/* Molecule bottom cap */}
                              <circle cx={helixProj2.x} cy={helixProj2.y} r={labStressActive ? "7" : "4.5"} fill={labStressActive ? "#ef4444" : currentTheme.secondary} className={labStressActive ? "animate-pulse" : ""} />
                            </g>
                          );
                        })()}
                      </g>

                      {/* REAL-TIME SIMULATED ERANGEL CARGO SPUR / RAIL TRACK ON DECK (Looping train locomotive) */}
                      <g>
                        {/* Rail lines drawn in rotated grid limits */}
                        {(() => {
                          const rStart = project3D(-110, 85, 1);
                          const rEnd = project3D(110, 85, 1);
                          return (
                            <g>
                              <line
                                x1={rStart.x}
                                y1={rStart.y}
                                x2={rEnd.x}
                                y2={rEnd.y}
                                stroke={currentTheme.structureStroke}
                                strokeWidth="1.5"
                                strokeOpacity="0.25"
                              />
                              <line
                                x1={project3D(-110, 89, 1).x}
                                y1={project3D(-110, 89, 1).y}
                                x2={project3D(110, 89, 1).x}
                                x3={project3D(110, 89, 1).y} // typo protect
                                stroke={currentTheme.structureStroke}
                                strokeWidth="1.5"
                                strokeOpacity="0.25"
                                strokeDasharray="2 3"
                              />
                            </g>
                          );
                        })()}

                        {/* Looping 3D train blocks */}
                        {(() => {
                          const trainSpeed = 0.55;
                          const trainProgress = ((timeTicker * trainSpeed) % 220) - 110; // offset track bounds
                          
                          // Draw massive Erangel industrial locomotive container boxes projected in 3D 
                          return (
                            <g>
                              {/* Main Engine Cab */}
                              {renderCuboid(trainProgress, 87, 4, 18, 8, 8, currentTheme.secondary, currentTheme.accent, 1)}
                              {/* Cargo Boxcar 1 connected to cab */}
                              {trainProgress > -90 && renderCuboid(trainProgress - 22, 87, 3, 16, 7, 6, currentTheme.structureStroke, "rgba(255,255,255,0.05)", 1)}
                            </g>
                          );
                        })()}
                      </g>

                      {/* INTERACTIVE CLICKABLE 3D PROJECTED VECTOR HOTSPOT TARGETS */}
                      {mapHotspots.map((spot) => {
                        const proj = project3D(spot.pos3d.x, spot.pos3d.y, spot.pos3d.z);
                        return (
                          <g key={`hot-target-${spot.id}`}>
                            {/* Outer pulsing scope lines */}
                            <ellipse
                              cx={proj.x}
                              cy={proj.y}
                              rx={hoveredHotspot === spot.id ? 15 * zoom : 8 * zoom}
                              ry={hoveredHotspot === spot.id ? 7.5 * zoom : 4 * zoom}
                              fill="none"
                              stroke={hoveredHotspot === spot.id ? currentTheme.secondary : currentTheme.accent}
                              strokeWidth={hoveredHotspot === spot.id ? "1.5" : "0.8"}
                              strokeOpacity={hoveredHotspot === spot.id ? "0.9" : "0.55"}
                              className="animate-pulse cursor-pointer"
                              onClick={() => {
                                setHoveredHotspot(spot.id);
                                setSelectedBuildingForModal(spot.id);
                                if (addHistory) {
                                  addHistory("SAFETY_SCAN", spot.name.split(" ")[0], `Operator focused 3D viewport laser locator on ${spot.sector}.`);
                                }
                              }}
                            />
                            {/* Inner central targeting core micro point */}
                            <circle
                              cx={proj.x}
                              cy={proj.y}
                              r={hoveredHotspot === spot.id ? "5" : "3.5"}
                              fill={hoveredHotspot === spot.id ? currentTheme.accent : "rgba(0,0,0,0.5)"}
                              stroke={currentTheme.accent}
                              strokeWidth="1"
                              className="cursor-pointer"
                              onClick={() => {
                                setHoveredHotspot(spot.id);
                                setSelectedBuildingForModal(spot.id);
                                if (addHistory) {
                                  addHistory("SAFETY_SCAN", spot.name.split(" ")[0], `Dynamic 3D lock handshake completed for ${spot.id.toUpperCase()}.`);
                                }
                              }}
                            />
                          </g>
                        );
                      })}

                      {/* ROLE-SPECIFIC 3D INFORMATION LAYERS */}
                      
                      {/* 1. SAFETY ZONES LAYER (Pulsing orange/red perimeters under critical halls) */}
                      {showSafetyZones && mapHotspots.map((spot) => {
                        const baseProj = project3D(spot.pos3d.x, spot.pos3d.y, 0);
                        const isViolated = spot.id === "reactor-grid" && activeEmergencyAlarms;
                        return (
                          <g key={`safety-layer-${spot.id}`}>
                            <ellipse
                              cx={baseProj.x}
                              cy={baseProj.y}
                              rx={30 * zoom}
                              ry={14 * zoom}
                              fill={isViolated ? "rgba(239, 68, 68, 0.08)" : "rgba(245, 158, 11, 0.03)"}
                              stroke={isViolated ? "#ef4444" : "#f59e0b"}
                              strokeWidth="1.3"
                              strokeDasharray="4 4"
                              className="animate-pulse"
                            />
                            <g transform={`translate(${baseProj.x - 45}, ${baseProj.y + 16 * zoom})`}>
                              <rect width="90" height="9" fill="#0c0d10" stroke={isViolated ? "#ef4444" : "#f59e0b"} strokeWidth="0.5" strokeOpacity="0.5" />
                              <text x="45" y="7" textAnchor="middle" fill={isViolated ? "#f87171" : "#fbbf24"} className="font-mono text-[5.5px] font-black uppercase tracking-wider">
                                {isViolated ? "▲ HAZARD VIOLATION" : "■ SAFE OPER SECTOR"}
                              </text>
                            </g>
                          </g>
                        );
                      })}

                      {/* 2. EFFICIENCY KPIS LAYER (Floating green tactical overlays) */}
                      {showEfficiencyKPIs && mapHotspots.map((spot) => {
                        const tProj = project3D(spot.pos3d.x, spot.pos3d.y, spot.pos3d.z + 18);
                        
                        const kpiVal = spot.id === "gpt-core" ? "99.9% ACC" :
                                       spot.id === "reactor-grid" ? (activeEmergencyAlarms ? "74% LOADED" : "94% NOMINAL") :
                                       spot.id === "robo-arms" ? (assemblyCycleSpeed === "hyper" ? "120% OVERHEAT" : "91% CYCLE") :
                                       spot.id === "steam-vent" ? (activeSteamVent ? "96% VENTED" : "89% STORAGE") :
                                       "85% SECURE";

                        return (
                          <g key={`kpi-layer-${spot.id}`} transform={`translate(${tProj.x - 35}, ${tProj.y - 12})`}>
                            <rect width="70" height="11" fill="#0c0d10" stroke="#10b981" strokeWidth="0.85" rx="1" />
                            <rect width="2.5" height="11" fill="#10b981" rx="0.5" />
                            <text x="6" y="8" fill="#10b981" className="font-mono text-[6px] font-black uppercase tracking-wider">
                              {kpiVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* 3. MAINTENANCE TASKS LAYER (Alert symbols linking to checklists) */}
                      {showMaintenanceTasks && mapHotspots.map((spot) => {
                        const tProj = project3D(spot.pos3d.x, spot.pos3d.y, spot.pos3d.z + (showEfficiencyKPIs ? 32 : 18));
                        const checklist = checklistState[spot.id] || [false, false, false];
                        const pendingCount = checklist.filter(t => !t).length;

                        return (
                          <g key={`maint-layer-${spot.id}`} transform={`translate(${tProj.x - 35}, ${tProj.y - 12})`}>
                            <rect width="70" height="11" fill="#0c0d10" stroke="#f59e0b" strokeWidth="0.85" rx="1" />
                            <rect width="2.5" height="11" fill="#f59e0b" rx="0.5" />
                            <text x="6" y="8" fill="#fbbf24" className="font-mono text-[5.8px] font-black uppercase tracking-wider">
                              {pendingCount === 0 ? "✓ ALL ACTIVE" : `🔧 ${pendingCount} PNDG TASK`}
                            </text>
                          </g>
                        );
                      })}

                      {/* ADVANCED FACTORY ADDITIONS: Ceiling Gantry truss lines & support pillars */}
                      <g stroke={currentTheme.structureStroke} strokeOpacity="0.12" strokeWidth="1" fill="none">
                        {[-95, 95].map(x => 
                          [-75, 75].map(y => (
                            <line 
                              key={`p-pillar-${x}-${y}`} 
                              x1={project3D(x, y, 0).x} 
                              y1={project3D(x, y, 0).y} 
                              x2={project3D(x, y, 32).x} 
                              y2={project3D(x, y, 32).y} 
                              strokeWidth="1.8"
                            />
                          ))
                        )}
                        <polygon 
                          points={`
                            ${project3D(-95, -75, 32).x},${project3D(-95, -75, 32).y}
                            ${project3D(95, -75, 32).x},${project3D(95, -75, 32).y}
                            ${project3D(95, 75, 32).x},${project3D(95, 75, 32).y}
                            ${project3D(-95, 75, 32).x},${project3D(-95, 75, 32).y}
                          `} 
                          strokeWidth="2.2"
                          stroke={currentTheme.structureStroke}
                          strokeOpacity="0.22"
                        />
                      </g>

                      {/* ADVANCED FACTORY ADDITIONS: Extra industrial logistics assets */}
                      <g>
                        {/* High Voltage Substation Transformer near Reactor Core */}
                        {renderCuboid(-82, -58, 0, 10, 10, 8, currentTheme.secondary, "rgba(59,130,246,0.06)", 1)}
                        
                        {/* Substation electrical link line with animated current pulse */}
                        {(() => {
                          const subStationProj = project3D(-82, -58, 8);
                          const reactorCoreProj = project3D(-65, -45, 6);
                          return (
                            <g>
                              <line 
                                x1={subStationProj.x} 
                                y1={subStationProj.y} 
                                x2={reactorCoreProj.x} 
                                y2={reactorCoreProj.y} 
                                stroke="#3b82f6" 
                                strokeWidth="0.85" 
                                strokeDasharray="4 4" 
                                strokeOpacity="0.5" 
                              />
                              <circle 
                                cx={subStationProj.x + (reactorCoreProj.x - subStationProj.x) * ((timeTicker * 0.025) % 1.0)}
                                cy={subStationProj.y + (reactorCoreProj.y - subStationProj.y) * ((timeTicker * 0.025) % 1.0)}
                                r="1.7"
                                fill="#60a5fa"
                              />
                            </g>
                          );
                        })()}

                        {/* Liquid Fuel Storage Tanks (Cylinders) at (75, -15, 0) */}
                        {(() => {
                          const tCenter = { x: 75, y: -15 };
                          const height = 15;
                          const radius = 6;
                          const bRing = project3D(tCenter.x, tCenter.y, 0);
                          const tRing = project3D(tCenter.x, tCenter.y, height);
                          return (
                            <g key="fuel-tank-3d">
                              <line x1={bRing.x - radius * zoom} y1={bRing.y} x2={tRing.x - radius * zoom} y2={tRing.y} stroke={currentTheme.structureStroke} strokeWidth="1" />
                              <line x1={bRing.x + radius * zoom} y1={bRing.y} x2={tRing.x + radius * zoom} y2={tRing.y} stroke={currentTheme.structureStroke} strokeWidth="1" />
                              <ellipse cx={bRing.x} cy={bRing.y} rx={radius * zoom} ry={ radius * 0.4 * zoom} fill="none" stroke={currentTheme.structureStroke} strokeOpacity="0.25" />
                              <ellipse cx={tRing.x} cy={tRing.y} rx={radius * zoom} ry={ radius * 0.4 * zoom} fill={currentTheme.structureFill} stroke={currentTheme.accent} strokeWidth="1.2" />
                              <text x={tRing.x} y={tRing.y - 4} fill={currentTheme.accent} fillOpacity="0.7" className="font-mono text-[5.5px]" textAnchor="middle">FUEL_TK_0A</text>
                            </g>
                          );
                        })()}

                        {/* Warehouse Stacking Pallet Crates near BE-4 robotics */}
                        {renderCuboid(-85, 20, 0, 8, 8, 6, currentTheme.structureStroke, "rgba(255,255,255,0.02)", 0.6)}
                        {renderCuboid(-78, 12, 0, 6, 6, 5, currentTheme.structureStroke, "rgba(255,255,255,0.02)", 0.6)}
                        {renderCuboid(-85, 20, 6, 6, 6, 5, currentTheme.structureStroke, "rgba(255,255,255,0.02)", 0.6)}
                      </g>

                      {/* ADVANCED FACTORY ADDITIONS: Fluid transport pipelines loop */}
                      {showPipelines && FACTORY_PIPELINES.map((pipe) => {
                        return (
                          <g key={`pipe-group-${pipe.id}`}>
                            {pipe.points.map((pt, idx) => {
                              if (idx === pipe.points.length - 1) return null;
                              const nextPt = pipe.points[idx + 1];
                              const p1 = project3D(pt.x, pt.y, pt.z);
                              const p2 = project3D(nextPt.x, nextPt.y, nextPt.z);
                              return (
                                <g key={`segment-${pipe.id}-${idx}`}>
                                  <line 
                                    x1={p1.x} 
                                    y1={p1.y} 
                                    x2={p2.x} 
                                    y2={p2.y} 
                                    stroke={pipe.color} 
                                    strokeWidth="1.6" 
                                    strokeOpacity="0.4" 
                                  />
                                  <line 
                                    x1={p1.x} 
                                    y1={p1.y} 
                                    x2={p2.x} 
                                    y2={p2.y} 
                                    stroke="#ffffff" 
                                    strokeWidth="0.5" 
                                    strokeOpacity="0.2" 
                                  />
                                </g>
                              );
                            })}

                            {/* Animated flowing energy particles inside layout */}
                            {(() => {
                              const totalSegments = pipe.points.length - 1;
                              const pulseFactor = (timeTicker * pipe.speed * 0.08) % 1.0;
                              return [0, 0.25, 0.5, 0.75].map((offset, pIdx) => {
                                const t = (pulseFactor + offset) % 1.0;
                                const segmentF = t * totalSegments;
                                const currentSegmentIdx = Math.floor(segmentF) % totalSegments;
                                const interpolation = segmentF - Math.floor(segmentF);

                                const startPt = pipe.points[currentSegmentIdx];
                                const endPt = pipe.points[currentSegmentIdx + 1];

                                if (!startPt || !endPt) return null;

                                const interX = startPt.x + (endPt.x - startPt.x) * interpolation;
                                const interY = startPt.y + (endPt.y - startPt.y) * interpolation;
                                const interZ = startPt.z + (endPt.z - startPt.z) * interpolation;

                                const bubbleProj = project3D(interX, interY, interZ);

                                return (
                                  <circle
                                    key={`bubble-${pipe.id}-${pIdx}`}
                                    cx={bubbleProj.x}
                                    cy={bubbleProj.y}
                                    r="2.2"
                                    fill="#ffffff"
                                    stroke={pipe.color}
                                    strokeWidth="0.8"
                                    className="shadow-sm"
                                  />
                                );
                              });
                            })()}
                          </g>
                        );
                      })}

                      {/* ADVANCED FACTORY ADDITIONS: Real-time wandering facility workers */}
                      {showWorkers && FACTORY_WORKERS.map((worker) => {
                        const pos = getWorkerPosition(worker, timeTicker);
                        const proj = project3D(pos.x, pos.y, pos.z);
                        const isHovered = hoveredWorkerId === worker.id;

                        return (
                          <g 
                            key={`worker-3d-${worker.id}`}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredWorkerId(worker.id)}
                            onMouseLeave={() => setHoveredWorkerId(null)}
                          >
                            <g>
                              {(() => {
                                const floorProj = project3D(pos.x, pos.y, 0);
                                return (
                                  <g>
                                    <ellipse
                                      cx={floorProj.x}
                                      cy={floorProj.y}
                                      rx={5 * zoom * (1 + (timeTicker % 30) / 30)}
                                      ry={2.5 * zoom * (1 + (timeTicker % 30) / 30)}
                                      fill="none"
                                      stroke={worker.color}
                                      strokeWidth="0.6"
                                      strokeOpacity={1 - (timeTicker % 30) / 30}
                                    />
                                    <ellipse
                                      cx={floorProj.x}
                                      cy={floorProj.y}
                                      rx={4 * zoom}
                                      ry={2 * zoom}
                                      fill={worker.color}
                                      fillOpacity="0.12"
                                      stroke={worker.color}
                                      strokeWidth="0.5"
                                      strokeOpacity="0.4"
                                    />
                                  </g>
                                );
                              })()}
                            </g>

                            {/* 3D Vertical holographic cylinder body marker */}
                            <line 
                              x1={proj.x} 
                              y1={proj.y} 
                              x2={proj.x} 
                              y2={proj.y - 12} 
                              stroke={worker.color} 
                              strokeWidth="2.5" 
                              strokeLinecap="round"
                              strokeOpacity="0.85"
                              className="transition-all duration-300"
                            />
                            <line 
                              x1={proj.x} 
                              y1={proj.y} 
                              x2={proj.x} 
                              y2={proj.y - 12} 
                              stroke="#ffffff" 
                              strokeWidth="0.8" 
                              strokeLinecap="round"
                              strokeOpacity="0.9"
                            />

                            {/* Initials badge floating */}
                            <g transform={`translate(${proj.x - 8}, ${proj.y - 20})`}>
                              <rect 
                                width="16" 
                                height="8.5" 
                                fill="#0c0d10" 
                                stroke={isHovered ? "#ffffff" : worker.color} 
                                strokeWidth="0.85" 
                                rx="1" 
                              />
                              <text 
                                x="8" 
                                y="6.2" 
                                fill={isHovered ? "#ffffff" : worker.color} 
                                className="font-mono text-[5.5px] font-black text-center"
                                textAnchor="middle"
                              >
                                {worker.initials}
                              </text>
                            </g>

                            {/* Micro hover metadata tag */}
                            {isHovered && (
                              <g transform={`translate(${proj.x - 45}, ${proj.y - 36})`} className="pointer-events-none z-50">
                                <rect width="90" height="15" fill="#0c0d10" stroke={worker.color} strokeWidth="1" rx="1.5" />
                                <text x="45" y="6" textAnchor="middle" fill="#ffffff" className="font-mono text-[5.5px] font-black leading-none">{worker.name} ({worker.role})</text>
                                <text x="45" y="12" textAnchor="middle" fill={worker.color} className="font-mono text-[4.8px] font-bold uppercase tracking-wider">{worker.statusText}</text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* ADVANCED FACTORY ADDITIONS: Thermal Heatmap Layer */}
                      {showThermalHeatmap && mapHotspots.map((spot) => {
                        const bProj = project3D(spot.pos3d.x, spot.pos3d.y, 0);
                        const heatColor = spot.id === "reactor-grid" && cryoCoolantBypassActive ? "rgba(239, 68, 68, 0.16)" :
                                          spot.id === "robo-arms" && assemblyCycleSpeed === "hyper" ? "rgba(244, 63, 94, 0.16)" :
                                          spot.id === "steam-vent" && !activeSteamVent ? "rgba(245, 158, 11, 0.14)" :
                                          "rgba(16, 185, 129, 0.08)";
                                          
                        const strokeColor = spot.id === "reactor-grid" && cryoCoolantBypassActive ? "#ef4444" :
                                            spot.id === "robo-arms" && assemblyCycleSpeed === "hyper" ? "#f43f5e" :
                                            spot.id === "steam-vent" && !activeSteamVent ? "#f59e0b" :
                                            "#10b981";

                        return (
                          <g key={`heatmap-3d-${spot.id}`}>
                            <ellipse
                              cx={bProj.x}
                              cy={bProj.y}
                              rx={40 * zoom}
                              ry={18 * zoom}
                              fill={heatColor}
                              stroke={strokeColor}
                              strokeWidth="1"
                              strokeDasharray="1 3"
                              className="animate-pulse"
                            />
                            <ellipse
                              cx={bProj.x}
                              cy={bProj.y}
                              rx={22 * zoom}
                              ry={10 * zoom}
                              fill={heatColor}
                              opacity="0.5"
                              stroke="none"
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* HOVER FLOATING KPI CARD OVERLAY */}
                    {hoveredBuilding && (() => {
                      const spot = mapHotspots.find(h => h.id === hoveredBuilding);
                      if (!spot) return null;
                      const proj = project3D(spot.pos3d.x, spot.pos3d.y, spot.pos3d.z + 14);
                      
                      const temp = spot.id === "gpt-core" ? (isNeuralCalibrating ? "48.5 °C" : "38.2 °C") :
                                   spot.id === "reactor-grid" ? (cryoCoolantBypassActive ? "89.4 °C" : "68.5 °C") :
                                   spot.id === "robo-arms" ? (assemblyCycleSpeed === "hyper" ? "74.5 °C" : assemblyCycleSpeed === "boost" ? "62.8 °C" : "54.2 °C") :
                                   spot.id === "steam-vent" ? (activeSteamVent ? "85.0 °C" : "125.0 °C") :
                                   (labStressActive ? "36.8 °C" : "22.4 °C");
                                   
                      const eff = spot.id === "gpt-core" ? "98.6%" :
                                  spot.id === "reactor-grid" ? (activeEmergencyAlarms ? "74.1%" : "94.2%") :
                                  spot.id === "robo-arms" ? (assemblyCycleSpeed === "hyper" ? "88.2%" : "91.8%") :
                                  spot.id === "steam-vent" ? (activeSteamVent ? "96.1%" : "89.5%") :
                                  "85.4%";
                                  
                      const staff = spot.id === "gpt-core" ? "6 AI ENGINEERS" :
                                    spot.id === "reactor-grid" ? "4 GRID TECHS" :
                                    spot.id === "robo-arms" ? "2 ROBO ADVISORS" :
                                    spot.id === "steam-vent" ? "3 ZONE INSPECTORS" :
                                    "5 CRYO SCIENTISTS";

                      return (
                        <div 
                          className="absolute z-40 bg-[#0c0d10]/95 border border-accent-machina p-3 rounded-[2px] shadow-2xl pointer-events-none min-w-[210px] backdrop-blur-md"
                          style={{
                            left: `${(proj.x / 800) * 100}%`,
                            top: `${(proj.y / 450) * 100}%`,
                            transform: "translate(-50%, -108%)",
                          }}
                        >
                          <div className="screw screw-tl"></div>
                          <div className="screw screw-tr"></div>
                          <div className="screw screw-bl"></div>
                          <div className="screw screw-br"></div>
                          
                          <div className="font-mono space-y-2 text-left">
                            <div className="border-b border-border-machina pb-1 font-bold">
                              <span className="text-[7.5px] text-accent-machina font-black block tracking-widest leading-none uppercase">// BUILDING CORE KPI</span>
                              <span className="text-[10px] text-text-primary font-black uppercase tracking-wide truncate mt-0.5 block">{spot.name}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-[9px] pt-0.5">
                              <div>
                                <span className="text-text-secondary block font-bold text-[7.5px]">TEMPERATURE:</span>
                                <span className="text-text-primary font-black flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-accent-machina"></span>
                                  {temp}
                                </span>
                              </div>
                              <div>
                                <span className="text-text-secondary block font-bold text-[7.5px]">ENERGY EFF:</span>
                                <span className="text-text-primary font-black flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  {eff}
                                </span>
                              </div>
                            </div>
                            
                            <div className="border-t border-border-machina/60 pt-1.5 text-[8px] flex justify-between items-center">
                              <span className="text-text-secondary font-bold">STAFF ALIGNED:</span>
                              <span className="text-accent-machina font-black uppercase tracking-wide">{staff}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Left HUD Sector Labeling Badge (Auto-updates with selected theme style) */}
                    <div className="absolute bottom-3 left-3 bg-bg-machina/95 border border-border-machina p-2 font-mono text-[8px] text-accent-machina rounded-[2px] backdrop-blur pointer-events-none max-w-[280px] text-left z-10 select-none shadow-md">
                      <span className="block uppercase font-black tracking-widest text-[9px] text-text-primary">
                        THEMATIC VECTOR SCHEME ACTIVE:
                      </span>
                      <span className="text-accent-machina uppercase text-[8px] block mt-0.5 leading-normal font-black">
                        {themeKey === "CYBERPUNK" ? "30% CYBERNETICS // 40% SERVER INFRA // 30% HOLOGRAPHY" :
                         themeKey === "TESLA_AUTOMATION" ? "40% TESLA ASSEMBLY ARMS // 30% WELDS // 30% ROBOTICS" :
                         themeKey === "ERANGEL" ? "40% PUBG ERANGEL CHIMNEYS // 30% CARGO LOCO // 30% CONCRETE" :
                         "40% HAZARD DIAGONALS // 30% CROSSHAIRS // 30% DETECTORS"}
                      </span>
                    </div>

                  </div>
                )}

                {/* 2D SCHEMATIC PLANNER OR SPLIT MAP RIGHT SCREEN */}
                {(layoutMode === "2d" || layoutMode === "split") && (
                  <div className="relative h-full flex-1 overflow-hidden bg-[#0c0d10] p-1 flex items-center justify-center">
                    
                    {/* Flat 2D Canvas vector blueprint representation layout */}
                    <svg viewBox="0 0 800 450" className="w-full h-full text-text-secondary select-none">
                      
                      {/* Blueprint Grids & Guides */}
                      <defs>
                        <pattern id="plan-blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <rect width="40" height="40" fill="none" />
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={currentTheme.accent} strokeWidth="1" strokeOpacity="0.08" />
                          <path d="M 20 0 L 20 20 0 20" fill="none" stroke={currentTheme.accent} strokeWidth="0.5" strokeOpacity="0.04" />
                        </pattern>
                      </defs>
                      <rect width="800" height="450" fill="url(#plan-blueprint-grid)" />

                      {/* Structural Boundary containment guides */}
                      <rect x="25" y="25" width="750" height="400" fill="none" stroke={currentTheme.accent} strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="5 4" />
                      
                      {/* Grid Coordinates markings */}
                      <text x="35" y="42" fill={currentTheme.accent} fillOpacity="0.45" className="font-mono text-[8.5px] font-bold">GRID PLAN ZONE A-1</text>
                      <text x="680" y="42" fill={currentTheme.accent} fillOpacity="0.45" className="font-mono text-[8.5px] font-bold">GRID PLAN ZONE C-4</text>
                      <text x="35" y="415" fill={currentTheme.accent} fillOpacity="0.3" className="font-mono text-[8px]">SYS_AUTOPILOT_REF: {themeKey}_MOD_SYS_ACTIVE</text>

                      {/* CONNECTING COPPER SCHEMATIC WALKWAY BUSES (Flat blueprint wiring lines) */}
                      <g className="stroke-accent-machina/65" strokeWidth="1.5" strokeOpacity="0.25">
                        <line x1="230" y1="130" x2="400" y2="220" strokeDasharray="3 3" />
                        <line x1="550" y1="130" x2="530" y2="330" strokeDasharray="3 3" />
                        <line x1="260" y1="310" x2="400" y2="220" />
                        <line x1="530" y1="330" x2="400" y2="220" />
                      </g>
                      
                      {/* AUTOMATED LOGISTICS TERMINAL SPUR / RAIL TRACK */}
                      <g stroke={currentTheme.structureStroke} strokeOpacity="0.15" strokeWidth="3">
                        <line x1="0" y1="390" x2="800" y2="390" />
                        <line x1="0" y1="396" x2="800" y2="396" strokeDasharray="5 5" />
                      </g>

                      {/* FLAT 2D OUTLINE DRAWS FOR RECONFIGURED FACILITY SECTORS */}
                      {/* Sector 1: Superconducting Reactor */}
                      <g 
                        transform="translate(230, 130)" 
                        className="cursor-pointer" 
                        onClick={() => {
                          setHoveredHotspot("reactor-grid");
                          setSelectedBuildingForModal("reactor-grid");
                        }}
                        onMouseEnter={() => setHoveredBuilding("reactor-grid")}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <circle r="30" fill="none" stroke={hoveredBuilding === "reactor-grid" || hoveredHotspot === "reactor-grid" ? currentTheme.secondary : currentTheme.accent} strokeWidth={hoveredBuilding === "reactor-grid" || hoveredHotspot === "reactor-grid" ? "2.5" : "1.5"} strokeOpacity={hoveredHotspot === "reactor-grid" ? "0.9" : "0.4"} />
                        <polygon points="0,-22 19,11 -19,11" fill="none" stroke={currentTheme.secondary} strokeWidth="1" strokeOpacity="0.4" />
                        <text x="-16" y="5" fill={currentTheme.accent} className="font-mono text-[7px]" fontWeight="bold">GA-2</text>
                      </g>

                      {/* Sector 2: Intelligent Assembly Swarm BE-4 */}
                      <g 
                        transform="translate(260, 310)" 
                        className="cursor-pointer" 
                        onClick={() => {
                          setHoveredHotspot("robo-arms");
                          setSelectedBuildingForModal("robo-arms");
                        }}
                        onMouseEnter={() => setHoveredBuilding("robo-arms")}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect x="-24" y="-24" width="48" height="48" fill="none" stroke={hoveredBuilding === "robo-arms" || hoveredHotspot === "robo-arms" ? currentTheme.secondary : currentTheme.accent} strokeWidth={hoveredBuilding === "robo-arms" || hoveredHotspot === "robo-arms" ? "2.5" : "1.5"} strokeOpacity={hoveredHotspot === "robo-arms" ? "0.9" : "0.4"} />
                        <line x1="-24" y1="-24" x2="24" y2="24" stroke={currentTheme.accent} strokeWidth="0.5" strokeOpacity="0.15" />
                        <line x1="-24" y1="24" x2="24" y2="-24" stroke={currentTheme.accent} strokeWidth="0.5" strokeOpacity="0.15" />
                        <text x="-15" y="4" fill={currentTheme.accent} className="font-mono text-[7px]" fontWeight="bold">BE-4</text>
                      </g>

                      {/* Sector 3: Central Cognition GPT-Core */}
                      <g 
                        transform="translate(400, 220)" 
                        className="cursor-pointer" 
                        onClick={() => {
                          setHoveredHotspot("gpt-core");
                          setSelectedBuildingForModal("gpt-core");
                        }}
                        onMouseEnter={() => setHoveredBuilding("gpt-core")}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <circle r="36" fill="none" stroke={hoveredBuilding === "gpt-core" || hoveredHotspot === "gpt-core" ? currentTheme.secondary : currentTheme.accent} strokeWidth={hoveredBuilding === "gpt-core" || hoveredHotspot === "gpt-core" ? "3.5" : "2.5"} strokeOpacity={hoveredHotspot === "gpt-core" ? "0.95" : "0.5"} />
                        <circle r="22" fill="none" stroke={currentTheme.secondary} strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.4" />
                        <rect x="-8" y="-8" width="16" height="16" fill={currentTheme.accent} fillOpacity="0.15" stroke={currentTheme.accent} strokeWidth="1" />
                        <text x="-18" y="32" fill={currentTheme.accent} className="font-mono text-[8px] font-black tracking-widest">CORE_DE-01</text>
                      </g>

                      {/* Sector 4: Geothermal Chimneys C-3 */}
                      <g 
                        transform="translate(550, 130)" 
                        className="cursor-pointer" 
                        onClick={() => {
                          setHoveredHotspot("steam-vent");
                          setSelectedBuildingForModal("steam-vent");
                        }}
                        onMouseEnter={() => setHoveredBuilding("steam-vent")}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect x="-24" y="-34" width="48" height="68" rx="2" fill="none" stroke={hoveredBuilding === "steam-vent" || hoveredHotspot === "steam-vent" ? currentTheme.secondary : currentTheme.accent} strokeWidth={hoveredBuilding === "steam-vent" || hoveredHotspot === "steam-vent" ? "2.5" : "1.5"} strokeOpacity={hoveredHotspot === "steam-vent" ? "0.9" : "0.4"} />
                        <circle cx="-10" cy="-12" r="8" fill="none" stroke={currentTheme.secondary} strokeWidth="1" strokeOpacity="0.3" />
                        <circle cx="10" cy="14" r="8" fill="none" stroke={currentTheme.secondary} strokeWidth="1" strokeOpacity="0.3" />
                        <text x="-12" y="2" fill={currentTheme.accent} className="font-mono text-[7px]" fontWeight="bold">C-3</text>
                      </g>

                      {/* Sector 5: Secret Research Lab Sanctuary X-09 */}
                      <g 
                        transform="translate(530, 330)" 
                        className="cursor-pointer" 
                        onClick={() => {
                          setHoveredHotspot("secret-lab");
                          setSelectedBuildingForModal("secret-lab");
                        }}
                        onMouseEnter={() => setHoveredBuilding("secret-lab")}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <polygon points="0,-28 26,14 -26,14" fill="none" stroke={hoveredBuilding === "secret-lab" || hoveredHotspot === "secret-lab" ? currentTheme.secondary : currentTheme.accent} strokeWidth={hoveredBuilding === "secret-lab" || hoveredHotspot === "secret-lab" ? "2.5" : "1.5"} strokeOpacity={hoveredHotspot === "secret-lab" ? "0.9" : "0.4"} />
                        <ellipse rx="12" ry="6" fill="none" stroke={currentTheme.secondary} strokeWidth="1" strokeOpacity="0.3" />
                        <text x="-10" y="8" fill={currentTheme.accent} className="font-mono text-[7px]" fontWeight="bold">X-09</text>
                      </g>

                      {/* REAL-TIME HIGHLIGHT SCANNER HUD FOR THE HOVERED HOTSPOT */}
                      {(() => {
                        const spotPos = currentHotspot.coords2d;
                        return (
                          <g>
                            {/* Targeted Reticle box */}
                            <rect
                              x={spotPos.x - 48}
                              y={spotPos.y - 48}
                              width="96"
                              height="96"
                              fill="none"
                              stroke={currentTheme.secondary}
                              strokeWidth="1"
                              strokeOpacity="0.55"
                              strokeDasharray="4 8"
                            />
                            {/* Sniper scope crosshairs lines */}
                            <line x1={spotPos.x - 60} y1={spotPos.y} x2={spotPos.x - 20} y2={spotPos.y} stroke={currentTheme.accent} strokeWidth="0.75" />
                            <line x1={spotPos.x + 20} y1={spotPos.y} x2={spotPos.x + 60} y2={spotPos.y} stroke={currentTheme.accent} strokeWidth="0.75" />
                            <line x1={spotPos.x} y1={spotPos.y - 60} x2={spotPos.x} y2={spotPos.y - 20} stroke={currentTheme.accent} strokeWidth="0.75" />
                            <line x1={spotPos.x} y1={spotPos.y + 20} x2={spotPos.x} y2={spotPos.y + 60} stroke={currentTheme.accent} strokeWidth="0.75" />
                            
                            {/* Target label bubble */}
                            <g transform={`translate(${spotPos.x - 70}, ${spotPos.y - 65})`}>
                              <rect width="140" height="13" fill="#0c0d10" stroke={currentTheme.accent} strokeWidth="1.2" />
                              <text x="6" y="9" fill={currentTheme.accent} className="font-mono text-[8px] font-black uppercase tracking-widest">
                                TARGET: {currentHotspot.id.replace("-", "_").toUpperCase()}
                              </text>
                            </g>
                          </g>
                        );
                      })()}

                      {/* ADVANCED BLUEPRINT ADDITIONS: Sonar Radar Sweep Line */}
                      {(() => {
                        const sweepAngle = (timeTicker * 1.3) % 360;
                        const sweepRad = (sweepAngle * Math.PI) / 180;
                        const rx = 400 + Math.cos(sweepRad) * 350;
                        const ry = 220 + Math.sin(sweepRad) * 350;
                        return (
                          <g pointerEvents="none">
                            <path 
                              d={`M 400 220 L ${400 + Math.cos(sweepRad - 0.25) * 350} ${220 + Math.sin(sweepRad - 0.25) * 350} A 350 350 0 0 1 ${rx} ${ry} Z`}
                              fill={currentTheme.accent}
                              fillOpacity="0.06"
                            />
                            <line 
                              x1="400" 
                              y1="220" 
                              x2={rx} 
                              y2={ry} 
                              stroke={currentTheme.accent} 
                              strokeWidth="1.2" 
                              strokeOpacity="0.35" 
                            />
                          </g>
                        );
                      })()}

                      {/* ADVANCED BLUEPRINT ADDITIONS: Thermal Heatmap Zones */}
                      {showThermalHeatmap && mapHotspots.map((spot) => {
                        const center = spot.coords2d;
                        const isViolated = spot.id === "reactor-grid" && activeEmergencyAlarms;
                        return (
                          <circle 
                            key={`heatmap-2d-${spot.id}`}
                            cx={center.x}
                            cy={center.y}
                            r={42}
                            fill={isViolated ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.1)"}
                            stroke={isViolated ? "#ef4444" : "#10b981"}
                            strokeWidth="1"
                            strokeDasharray="2 4"
                            className="animate-pulse"
                          />
                        );
                      })}

                      {/* ADVANCED BLUEPRINT ADDITIONS: 2D Fluid Pipes */}
                      {showPipelines && FACTORY_PIPELINES.map((pipe) => {
                        return (
                          <g key={`pipe-2d-${pipe.id}`} pointerEvents="none">
                            {pipe.points.map((pt, idx) => {
                              if (idx === pipe.points.length - 1) return null;
                              const nextPt = pipe.points[idx + 1];
                              const p1 = getWorkerCoords2D(pt);
                              const p2 = getWorkerCoords2D(nextPt);
                              return (
                                <line 
                                  key={`seg-2d-${idx}`}
                                  x1={p1.x} 
                                  y1={p1.y} 
                                  x2={p2.x} 
                                  y2={p2.y} 
                                  stroke={pipe.color} 
                                  strokeWidth="1.2" 
                                  strokeOpacity="0.35" 
                                />
                              );
                            })}
                          </g>
                        );
                      })}

                      {/* ADVANCED BLUEPRINT ADDITIONS: Real-time wandering worker blips */}
                      {showWorkers && FACTORY_WORKERS.map((worker) => {
                        const pos3d = getWorkerPosition(worker, timeTicker);
                        const pos2d = getWorkerCoords2D(pos3d);
                        const isHovered = hoveredWorkerId === worker.id;

                        const dx = pos2d.x - 400;
                        const dy = pos2d.y - 220;
                        const workerAngleRad = Math.atan2(dy, dx);
                        let workerAngleDeg = (workerAngleRad * 180) / Math.PI;
                        if (workerAngleDeg < 0) workerAngleDeg += 360;

                        const sweepAngle = (timeTicker * 1.3) % 360;
                        const angleDiff = Math.abs(sweepAngle - workerAngleDeg);
                        const isScanningHit = angleDiff < 15 || angleDiff > 345;

                        return (
                          <g 
                            key={`wrk-2d-${worker.id}`} 
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredWorkerId(worker.id)}
                            onMouseLeave={() => setHoveredWorkerId(null)}
                          >
                            <circle
                              cx={pos2d.x}
                              cy={pos2d.y}
                              r={isScanningHit ? 14 : (isHovered ? 12 : 6)}
                              fill="none"
                              stroke={worker.color}
                              strokeWidth={isScanningHit ? "2" : "1"}
                              strokeOpacity={isScanningHit ? "0.9" : "0.35"}
                            />
                            <circle
                              cx={pos2d.x}
                              cy={pos2d.y}
                              r="3.5"
                              fill={worker.color}
                              className="animate-pulse"
                            />

                            {isHovered && (
                              <g transform={`translate(${pos2d.x + 8}, ${pos2d.y - 12})`} className="z-50 pointer-events-none text-left">
                                <rect width="130" height="42" fill="#0c0d10" stroke={worker.color} strokeWidth="1" rx="2" />
                                <text x="6" y="10" fill="#ffffff" className="font-mono text-[7px] font-black">{worker.name}</text>
                                <text x="6" y="19" fill={worker.color} className="font-mono text-[6px] font-bold uppercase">{worker.role}</text>
                                <text x="6" y="28" fill="rgba(255,255,255,0.7)" className="font-mono text-[5.5px]">VITALS: HR {worker.vitalHeartRate}BPM | O2 {worker.vitalOxygen}</text>
                                <text x="6" y="36" fill={worker.color} className="font-mono text-[5.2px] uppercase font-black tracking-wider">&gt;&gt; STATUS: {worker.statusText}</text>
                              </g>
                            )}

                            {!isHovered && (
                              <text 
                                x={pos2d.x + 6} 
                                y={pos2d.y + 2.5} 
                                fill={worker.color} 
                                fillOpacity="0.75" 
                                className="font-mono text-[6.5px] font-black pointer-events-none"
                              >
                                {worker.initials}
                              </text>
                            )}
                          </g>
                        );
                      })}

                    </svg>

                    {/* Left HUD coordinates planner tag */}
                    <div className="absolute top-3 right-3 bg-bg-machina/95 border border-border-machina p-2 font-mono text-[8px] text-text-secondary rounded-[1px] pointer-events-none max-w-[170px] text-left z-10 shadow-lg">
                      <div className="text-accent-machina font-black uppercase text-[9px] flex items-center gap-1">
                        <Binary size={10} />
                        <span>FLAT MATRIX</span>
                      </div>
                      <div className="h-[1px] bg-border-machina my-1"></div>
                      <div>X_LIMIT: <span className="text-text-primary font-bold">800.00 MM</span></div>
                      <div>Y_LIMIT: <span className="text-text-primary font-bold">450.00 MM</span></div>
                      <div>L_SYNC: <span className="text-accent-machina font-bold">ACTIVE OK</span></div>
                    </div>

                  </div>
                )}

              </div>

              {/* BOTTOM STRATEGIC REAL-TIME OPERATION CONTROLS PANEL */}
              <div className="border-t border-border-machina bg-hover-machina px-4 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 select-none text-left">
                <div className="space-y-0.5 max-w-sm">
                  <span className="text-[9px] font-mono font-black text-accent-machina uppercase tracking-widest flex items-center gap-1">
                    <Settings size={10} className="animate-spin" />
                    <span>OPERATIONAL INTEGRATED CALIBRATORS</span>
                  </span>
                  <p className="text-[9px] font-mono text-text-secondary leading-normal uppercase">
                    Adjust simulation vectors. This registers and records automated activity parameters inside the history log in real-time.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  
                  {/* TRIGGER STEAM VENT */}
                  <button
                    onClick={() => {
                      const updated = !activeSteamVent;
                      setActiveSteamVent(updated);
                      if (addHistory) {
                        addHistory(
                          "EQUIPMENT_MAINTENANCE", 
                          updated ? "STEAM DUCTS ACTIVE" : "STEAM DUCTS SEALED", 
                          updated 
                            ? "Opened geothermic steam vent valves at Chimney Complex C-3. Pressure dropped back to 1.84 bar."
                            : "Vent complex C-3 steam bypass sealed. Retaining nominal pressure indices."
                        );
                      }
                    }}
                    className={`text-[9px] font-mono py-1.5 px-3 uppercase font-black border rounded-[2px] transition-all flex items-center gap-1 ${
                      activeSteamVent
                        ? "bg-emerald-950 text-emerald-400 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                        : "bg-bg-machina text-text-secondary border-border-machina hover:text-text-primary"
                    }`}
                  >
                    <Wind size={10} className={activeSteamVent ? "animate-pulse" : ""} />
                    <span>{activeSteamVent ? "[VENT ACTIVE]" : "EMERGENCY VENT"}</span>
                  </button>

                  {/* COGNITIVE SWARM SPEEDS TRIGGER */}
                  <button
                    onClick={() => {
                      let nextSpeed: "normal" | "boost" | "hyper" = "normal";
                      if (assemblyCycleSpeed === "normal") nextSpeed = "boost";
                      else if (assemblyCycleSpeed === "boost") nextSpeed = "hyper";
                      
                      setAssemblyCycleSpeed(nextSpeed);
                      if (addHistory) {
                        addHistory(
                          "EQUIPMENT_MAINTENANCE", 
                          `CYCLE RE-CALIBRATED: ${nextSpeed.toUpperCase()}`, 
                          `Operator adjusted automated robot arm replication frequencies to ${nextSpeed === "hyper" ? "820Hz hyper-strike" : nextSpeed === "boost" ? "540Hz speed-run cycles" : "418Hz standard state"}.`
                        );
                      }
                    }}
                    className={`text-[9px] font-mono py-1.5 px-3 uppercase font-black border rounded-[2px] transition-all flex items-center gap-1 ${
                      assemblyCycleSpeed === "hyper"
                        ? "bg-red-950 text-red-400 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                        : assemblyCycleSpeed === "boost"
                        ? "bg-amber-950 text-amber-400 border-amber-500/50"
                        : "bg-bg-machina text-text-secondary border-border-machina hover:text-text-primary"
                    }`}
                  >
                    <Zap size={10} className={assemblyCycleSpeed !== "normal" ? "animate-bounce" : ""} />
                    <span>CYCLE RATE: {assemblyCycleSpeed.toUpperCase()}</span>
                  </button>

                  {/* EMERGENCY ALARMS GRID SIREN TOGGLE */}
                  <button
                    onClick={() => {
                      const status = !activeEmergencyAlarms;
                      setActiveEmergencyAlarms(status);
                      if (addHistory) {
                        addHistory(
                          "SAFETY_SCAN", 
                          status ? "INCIDENT ALARMS ENABLED" : "INCIDENT ALARMS SOLVED", 
                          status 
                            ? "CRITICAL TEST: Simulated sudden load surge breaker breach at Reactor core GA-2. Plant warnings synced."
                            : "Plant warnings solved. reactor load balance synchronized back to normal parameters."
                        );
                      }
                    }}
                    className={`text-[9px] font-mono py-1.5 px-3 uppercase font-black border rounded-[2px] transition-all flex items-center gap-1 ${
                      activeEmergencyAlarms
                        ? "bg-red-950 text-red-500 border-red-500 font-bold animate-pulse"
                        : "bg-bg-machina text-text-danger-machina border-border-machina hover:border-red-500/40 text-rose-500/70 hover:text-rose-500"
                    }`}
                  >
                    <ShieldAlert size={10} />
                    <span>{activeEmergencyAlarms ? "[SIRENS ACTIVE]" : "TEST ALARMS"}</span>
                  </button>

                </div>
              </div>

            </div>
          </IndustrialWidget>
        </div>

        {/* Right hand Panel (4 Cols) - Telemetry readout of hovered sector hotspot or nodes */}
        <div id="twin-node-spec-panel" className="lg:col-span-4 space-y-4">
          <IndustrialWidget
            title="LOCKED PLAN SECTOR DIAGNOSTICS"
            subtitle="Extracted physical calibration & telemetry maps"
          >
            <div className="space-y-4 font-mono">
              
              {/* PRIMARY READOUT ZONE */}
              <div className="bg-card-machina border border-border-machina p-4 h-28 flex flex-col justify-between rounded-[3px] text-left select-none relative overflow-hidden">
                <div className="screw screw-tl"></div>
                <div className="screw screw-tr"></div>
                <div className="screw screw-bl"></div>
                <div className="screw screw-br"></div>

                <div>
                  <span className="text-[9px] text-accent-machina block tracking-widest uppercase font-black">
                     // SYSTEM SECTOR REF: {currentHotspot.sector}
                  </span>
                  <span className="text-xs text-text-primary mt-1.5 block font-black leading-tight uppercase tracking-wide">
                    {currentHotspot.name}
                  </span>
                </div>
                <span className="text-[9px] text-text-secondary block font-bold leading-none mt-1 uppercase">
                  UNREAL ENGINE ASSET ID: <span className="text-accent-machina">{currentHotspot.unrealRef}</span>
                </span>
              </div>

              {/* DUAL TELEMETRY PARAM GRID */}
              <div className="grid grid-cols-2 gap-4 text-left select-none">
                
                <div className="bg-card-machina border border-border-machina p-4 rounded-[3px] relative overflow-hidden">
                  <div className="screw screw-tl"></div>
                  <div className="screw screw-tr"></div>
                  <div className="screw screw-bl"></div>
                  <div className="screw screw-br"></div>
                  <span className="text-[8px] text-text-secondary block uppercase font-bold tracking-wider">
                    {currentHotspot.metricName}
                  </span>
                  <span className="text-xl text-text-primary mt-1 block font-black text-accent-machina">
                    {currentHotspot.metricValue}
                  </span>
                </div>

                <div className="bg-card-machina border border-border-machina p-4 rounded-[3px] relative overflow-hidden">
                  <div className="screw screw-tl"></div>
                  <div className="screw screw-tr"></div>
                  <div className="screw screw-bl"></div>
                  <div className="screw screw-br"></div>
                  <span className="text-[8px] text-text-secondary block uppercase font-bold tracking-wider">
                    INTEGRATED SYSTEM INDEX
                  </span>
                  <span className="text-xl text-text-primary mt-1 block font-black uppercase">
                    #{currentHotspot.id.toUpperCase()}
                  </span>
                </div>
              </div>

            </div>
          </IndustrialWidget>

          <IndustrialWidget
            title="WANDERING FIELD STAFF PROTOCOL"
            subtitle="Live biometric & location telemetry records"
          >
            <div className="space-y-3 font-mono text-left select-none">
              <div className="flex justify-between items-center bg-[#141519] px-2 py-1.5 border border-border-machina/60 text-[8px] font-black tracking-widest text-accent-machina uppercase">
                <span>[SCAN STATUS: ACTIVE NOMINAL]</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>5 LOGGED STAFF</span>
                </span>
              </div>
              
              <div className="space-y-2">
                {FACTORY_WORKERS.map((worker, idx) => {
                  const hrVar = worker.vitalHeartRate + Math.floor(Math.sin(timeTicker * 0.06 + idx) * 4);
                  const isHovered = hoveredWorkerId === worker.id;
                  return (
                    <div 
                      key={worker.id}
                      onMouseEnter={() => setHoveredWorkerId(worker.id)}
                      onMouseLeave={() => setHoveredWorkerId(null)}
                      className={`p-2.5 border transition-all rounded-[2px] ${
                        isHovered 
                          ? "bg-hover-machina border-accent-machina/92 shadow-[0_0_8px_rgba(235,94,85,0.15)]" 
                          : "bg-card-machina border-border-machina/75 hover:border-border-machina hover:bg-hover-machina/30"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span 
                            style={{ backgroundColor: worker.color + "25", color: worker.color, borderColor: worker.color }} 
                            className="w-6 h-6 rounded-[2px] border text-[9px] font-black flex items-center justify-center font-mono"
                          >
                            {worker.initials}
                          </span>
                          <div>
                            <div className="text-[10px] text-text-primary font-black uppercase tracking-wide">
                              {worker.name}
                            </div>
                            <div className="text-[7.5px] text-text-secondary uppercase">
                              {worker.role}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right font-mono text-[8.5px]">
                          <span className="text-text-secondary block">TEAM REF:</span>
                          <span className="text-text-primary font-bold">{worker.team.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="h-[1px] bg-border-machina/50 my-1.5"></div>

                      <div className="grid grid-cols-3 gap-2 text-[7.8px] leading-tight text-text-secondary">
                        <div className="bg-bg-machina/60 p-1 border border-border-machina/40">
                          <span className="block text-[6.5px] text-text-secondary uppercase">BIOMETRIC:</span>
                          <span className={`font-black flex items-center gap-0.5 ${hrVar > 85 ? "text-amber-500" : "text-text-primary"}`}>
                            ♥ {hrVar} BPM
                          </span>
                        </div>
                        <div className="bg-[#191b22] p-1 border border-border-machina/40">
                          <span className="block text-[6.5px] text-text-secondary uppercase">O2 FACTOR:</span>
                          <span className="font-black text-emerald-500">
                            {worker.vitalOxygen}
                          </span>
                        </div>
                        <div className="bg-[#191b22] p-1 border border-border-machina/40">
                          <span className="block text-[6.5px] text-text-secondary uppercase">SYS_LOC:</span>
                          <span className="font-black text-accent-machina truncate">
                            {worker.id === "wrk-01" ? "GPT-CORE" :
                             worker.id === "wrk-02" ? "ROBO-ARMS" :
                             worker.id === "wrk-03" ? "STEAM-VENT" :
                             worker.id === "wrk-04" ? "SECRET-LAB" : "REACTOR-GA"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-1.5 flex justify-between items-center">
                        <span className="text-[7px] text-text-secondary uppercase font-bold truncate max-w-[150px]">
                          » {worker.statusText}
                        </span>
                        <span className="text-[6.5px] bg-[#1d1f26] text-accent-machina px-1 py-0.5 font-bold uppercase rounded-[1px]">
                          TRACKING SYNC
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </IndustrialWidget>
        </div>

      </div>

      {/* DETAILED FACILITY INSPECTION BREAKDOWN MODAL */}
      {selectedBuildingForModal && (() => {
        const spot = mapHotspots.find(h => h.id === selectedBuildingForModal);
        if (!spot) return null;

        // Custom details mapping per building
        const detailsMap: Record<string, {
          title: string;
          sector: string;
          metrics: { label: string; val: string; color: string }[];
          equipment: { id: string; name: string; status: "NOMINAL" | "WARNING" | "CRITICAL"; value: string }[];
          safety: { title: string; category: string; severity: "LOW" | "MED" | "HIGH"; detail: string }[];
        }> = {
          "reactor-grid": {
            title: "Superconducting Voltage Grid",
            sector: "REACTOR CORE GA-2",
            metrics: [
              { label: "GRID CORE TEMP", val: cryoCoolantBypassActive ? "89.4 °C" : "68.5 °C", color: cryoCoolantBypassActive ? "text-amber-500" : "text-accent-machina" },
              { label: "MAGNETIC FIELD FORCE", val: "1.84 TESLA", color: "text-text-primary" },
              { label: "GRID VOLT LOAD", val: activeEmergencyAlarms ? "128% LOAD" : "94.2% FACTOR", color: activeEmergencyAlarms ? "text-red-500" : "text-emerald-500" }
            ],
            equipment: [
              { id: "GA-CORE-A1", name: "Superinduction Coil Inductor", status: "NOMINAL", value: "94.2% Eff" },
              { id: "LN-PUMP-02", name: "Cryo Liquid Nitrogen Flow Pump", status: cryoCoolantBypassActive ? "WARNING" : "NOMINAL", value: "12.5 L/s" },
              { id: "BYPASS-V3", name: "Induction Heat Exp Valve BY-V3", status: activeEmergencyAlarms ? "CRITICAL" : "NOMINAL", value: "Sealed" }
            ],
            safety: [
              { title: "Cryogenic bypass condition", category: "THERMAL", severity: cryoCoolantBypassActive ? "MED" : "LOW", detail: cryoCoolantBypassActive ? "Nitrogen coolant bypass loop activated. Temperature climbing." : "Standard coolant loop locking within 85C bounds." },
              { title: "Radiation emission bounds", category: "PHYSICAL", severity: "LOW", detail: "Containment screens sealed safe. Secondary loop output nominal." }
            ]
          },
          "robo-arms": {
            title: "Robotic Assembly Swarm",
            sector: "ASSEMBLY HALL BE-4",
            metrics: [
              { label: "CORE MOTOR TEMP", val: assemblyCycleSpeed === "hyper" ? "74.5 °C" : assemblyCycleSpeed === "boost" ? "62.8 °C" : "54.2 °C", color: "text-accent-machina" },
              { label: "JOINT ERROR OFFSET", val: "<0.008 MM", color: "text-emerald-500" },
              { label: "CONVEYOR RUN STATS", val: conveyorStopped ? "STOPPED" : (assemblyCycleSpeed === "hyper" ? "320 ITEMS/M" : "180 ITEMS/M"), color: conveyorStopped ? "text-red-500 font-black animate-pulse" : "text-text-primary" }
            ],
            equipment: [
              { id: "ROBO-ARM-Z1", name: "Articulated 6-Axis Welding Swarm", status: "NOMINAL", value: "High Sync" },
              { id: "CV-BELT-4A", name: "High Speed Feed Logistic Belt", status: conveyorStopped ? "WARNING" : "NOMINAL", value: conveyorStopped ? "Interrupted" : "Steady" },
              { id: "LASER-W-09", name: "Optical CO2 Weld Controller", status: assemblyCycleSpeed === "hyper" ? "WARNING" : "NOMINAL", value: "Nominal Pulse" }
            ],
            safety: [
              { title: "Kinematic boundaries scan", category: "MECHANICAL", severity: "LOW", detail: "Collision avoidance field active. Zero human anomalies inside boundary." },
              { title: "Weld sparks flash back", category: "OPTICAL", severity: assemblyCycleSpeed === "hyper" ? "MED" : "LOW", detail: assemblyCycleSpeed === "hyper" ? "High energy welds active. Automatic safety shielding active." : "Nominal flash containment verified." }
            ]
          },
          "steam-vent": {
            title: "Geothermal Steam Vent Complex",
            sector: "VENT COMPLEX C-3",
            metrics: [
              { label: "EXCHANGE FLUX TEMP", val: activeSteamVent ? "85.0 °C" : "125.0 °C", color: activeSteamVent ? "text-emerald-500" : "text-red-500 font-bold" },
              { label: "DUCT BACKPRESSURE", val: activeSteamVent ? "1.84 BAR" : "3.10 BAR", color: activeSteamVent ? "text-emerald-500" : "text-accent-machina" },
              { label: "ACTIVE HYDROGEN EMISSIONS", val: activeSteamVent ? "12 PPM" : "2 PPM", color: "text-text-primary" }
            ],
            equipment: [
              { id: "CHIMNEY-T1", name: "Geothermal Exhaust Stack T1", status: "NOMINAL", value: "Primary Flow" },
              { id: "VENT-V-C3", name: "Pneumatic Steam Discharge Gate", status: activeSteamVent ? "NOMINAL" : "WARNING", value: activeSteamVent ? "Discharging" : "Clogged Backpressure" },
              { id: "SCRUB-FLT4", name: "Acid Oxide Sulphur Scrubber", status: "NOMINAL", value: "98.4% Efficiency" }
            ],
            safety: [
              { title: "Turbine Vent Exhaust pressure", category: "PRESSURE", severity: activeSteamVent ? "LOW" : "HIGH", detail: activeSteamVent ? "Overpressure safely ventilated." : "Exhaust duct overpressure warning indices triggered. Recommended emergency vent." }
            ]
          },
          "gpt-core": {
            title: "Central AI Cognition Brain",
            sector: "CENTRAL COGNITION GPT-CORE",
            metrics: [
              { label: "SUPERCOMPUTER TEMP", val: isNeuralCalibrating ? "48.5 °C" : "38.2 °C", color: "text-accent-machina" },
              { label: "PIPELINE THREAD JITTER", val: "<0.12 MICROSEC", color: "text-emerald-500" },
              { label: "NEURAL LOGIC COMPLEMENT", val: customModelAcc, color: "text-accent-machina font-black" }
            ],
            equipment: [
              { id: "MAIN-SYS-1A", name: "FactoryGPT H100 GPU Cluster Frame", status: "NOMINAL", value: "Dense Flow" },
              { id: "COGN-SYN-B", name: "High Speed Sync Synaptic Multiplexer", status: isNeuralCalibrating ? "WARNING" : "NOMINAL", value: isNeuralCalibrating ? "Calibrating" : "Optimized" },
              { id: "OPT-FIBER-9", name: "Ultra-low Latency Liquid Photonic Bridge", status: "NOMINAL", value: "100 Gbps Nominal" }
            ],
            safety: [
              { title: "Security kernel validation", category: "CYBER", severity: "LOW", detail: "Internal firewall matrices state locked in secure mode." },
              { title: "Neural pipeline calibration stress", category: "LOGIC", severity: isNeuralCalibrating ? "MED" : "LOW", detail: isNeuralCalibrating ? "Calibrating synaptic weights. Momentary response logic skew observed." : "Inference models locked nominal." }
            ]
          },
          "secret-lab": {
            title: "Subterranean Research Center",
            sector: "LAB SANCTUARY X-09",
            metrics: [
              { label: "CRYO TESTBED TEMP", val: labStressActive ? "36.8 °C" : "22.4 °C", color: "text-accent-machina" },
              { label: "HYDROGEN ISOTOPE ENTHALPY", val: "148.5 KJL", color: "text-text-primary" },
              { label: "SECURE WALL SHIELD INTEGRITY", val: "100% COMPLETE", color: "text-emerald-500" }
            ],
            equipment: [
              { id: "SECURE-CELL-01", name: "Hyperbaric Diagnostic Fracture Chamber", status: "NOMINAL", value: "Hermetically Locked" },
              { id: "MOL-FREQ-Z", name: "Adversarial Isotope Synthesizer", status: labStressActive ? "WARNING" : "NOMINAL", value: "Steady" },
              { id: "SHIELD-G9", name: "Static Electrostatic Shield Grid", status: "NOMINAL", value: "95KV Feed nominal" }
            ],
            safety: [
              { title: "Experimental gas leakage check", category: "CHEMICAL", severity: "LOW", detail: "Zero toxic isotopes detected outside secure extraction tubes." },
              { title: "Fracture chamber stress coefficient", category: "STRUCTURAL", severity: labStressActive ? "MED" : "LOW", detail: labStressActive ? "Enthalpy limits pushed past threshold. Structural integrity monitored." : "Stable vault pressures." }
            ]
          }
        };

        const activeDetails = detailsMap[spot.id] || {
          title: spot.name,
          sector: spot.sector,
          metrics: [],
          equipment: [],
          safety: []
        };

        const getStatusStyles = (status: "NOMINAL" | "WARNING" | "CRITICAL") => {
          if (status === "CRITICAL") return "bg-red-950/60 text-red-500 border-red-800/50";
          if (status === "WARNING") return "bg-amber-950/60 text-amber-500 border-amber-800/50";
          return "bg-emerald-950/60 text-emerald-500 border-emerald-800/50";
        };

        // Filter actual store history events matching this sector name or title
        const matchingHistory = history?.filter(h => 
          h.description?.toLowerCase().includes(spot.id.replace("-", "")) || 
          h.title?.toLowerCase().includes(spot.id.replace("-", "")) ||
          h.description?.toLowerCase().includes(spot.name.split(" ")[0].toLowerCase())
        ).slice(0, 5) || [];

        // Manual completion checklist toggle handler
        const toggleChecklistTask = (index: number) => {
          setChecklistState(prev => {
            const list = [...(prev[spot.id] || [false, false, false])];
            list[index] = !list[index];
            const updated = { ...prev, [spot.id]: list };
            
            if (addHistory) {
              addHistory(
                "EQUIPMENT_MAINTENANCE",
                `TASK_${index + 1}_MUTATED`,
                `Operator modified field checklist for ${spot.name}. Task ${index + 1} marked ${list[index] ? "CLOSED" : "PENDING"}.`
              );
            }
            return updated;
          });
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07080a]/80 backdrop-blur-sm transition-all animate-fade-in">
            <div className="relative w-full max-w-4xl bg-bg-machina border border-accent-machina p-6 shadow-2xl rounded-[3px] flex flex-col max-h-[90vh] overflow-hidden text-left">
              <div className="screw screw-tl"></div>
              <div className="screw screw-tr"></div>
              <div className="screw screw-bl"></div>
              <div className="screw screw-br"></div>

              {/* Header section with sector tagging and close */}
              <div className="flex justify-between items-start border-b border-border-machina pb-4 mb-4 font-mono">
                <div>
                  <span className="text-[9px] font-black tracking-widest text-accent-machina block uppercase">// CRITICAL INFRASTRUCTURE ENHANCED INSPECTOR</span>
                  <h3 className="text-xl font-black text-text-primary tracking-tight uppercase">{activeDetails.title}</h3>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="bg-hover-machina border border-border-machina text-[8px] font-bold px-2 py-0.5 text-text-secondary select-none tracking-wide">{activeDetails.sector}</span>
                    <span className="text-[8.5px] font-medium text-text-secondary">COORDINATES: {spot.pos3d.x}X / {spot.pos3d.y}Y / {spot.pos3d.z}Z</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedBuildingForModal(null)}
                  className="bg-card-machina hover:bg-hover-machina border border-border-machina text-text-secondary hover:text-text-primary h-7 w-7 flex items-center justify-center rounded-[2px] transition-colors font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Active real-time analytics KPIs ribbons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 font-mono">
                {activeDetails.metrics.map((met, index) => (
                  <div key={`modal-met-${index}`} className="bg-card-machina border border-border-machina p-3 rounded-[2px]">
                    <span className="text-[8px] text-text-secondary font-black block uppercase tracking-wider">{met.label}</span>
                    <span className={`text-[12px] font-black block mt-1 tracking-tight uppercase ${met.color}`}>{met.val}</span>
                  </div>
                ))}
              </div>

              {/* Main content body (Layout divided into Equipment, Safety, History) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto pr-1 flex-1 pb-2">
                
                {/* COLUMN 1: Equipment Inventory & Telemetry (Spans 5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="border border-border-machina rounded-[3px] bg-hover-machina p-3 relative h-full">
                    <div className="flex items-center gap-1.5 border-b border-border-machina pb-2 mb-3 font-mono">
                      <Wrench size={12} className="text-accent-machina" />
                      <span className="text-[10px] text-text-primary font-black uppercase tracking-wider">Field Equipment Manifest ({activeDetails.equipment.length})</span>
                    </div>

                    <div className="space-y-2 font-mono">
                      {activeDetails.equipment.map((eq, idx) => (
                        <div key={`modal-eq-${idx}`} className="bg-[#0c0d10] border border-border-machina p-2.5 rounded-[2px] flex flex-col justify-between select-none">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[9px] text-text-secondary font-bold block">{eq.id}</span>
                              <span className="text-[10px] text-text-primary font-black uppercase tracking-wide leading-tight mt-0.5 block">{eq.name}</span>
                            </div>
                            <span className={`text-[7px] font-black border px-1.5 py-0.5 rounded-[1px] ${getStatusStyles(eq.status)}`}>
                              {eq.status}
                            </span>
                          </div>
                          
                          <div className="h-[1px] bg-border-machina/60 my-2"></div>
                          <div className="flex justify-between items-center text-[8.5px]">
                            <span className="text-text-secondary">DIAGNOSTIC OUT:</span>
                            <span className="text-accent-machina font-black uppercase tracking-wide">{eq.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: Safety & Hazard Auditing (Spans 4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="border border-border-machina rounded-[3px] bg-hover-machina p-3 h-full">
                    <div className="flex items-center gap-1.5 border-b border-border-machina pb-2 mb-3 font-mono">
                      <ShieldAlert size={12} className="text-amber-500 animate-pulse" />
                      <span className="text-[10px] text-text-primary font-black uppercase tracking-wider">Active Sector Threats & Bounds</span>
                    </div>

                    <div className="space-y-2.5 font-mono">
                      {activeDetails.safety.map((saf, idx) => (
                        <div key={`modal-safety-${idx}`} className="bg-[#0c0d10] border border-border-machina/85 p-2.5 rounded-[2px] text-[8.5px] leading-relaxed">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-text-primary font-black uppercase tracking-wide">{saf.title}</span>
                            <span className={`text-[7px] font-mono px-1 py-0.2 select-none border font-black ${
                              saf.severity === "HIGH" ? "text-red-500 border-red-800 bg-red-950/40" :
                              saf.severity === "MED" ? "text-amber-500 border-amber-800 bg-amber-950/40" :
                              "text-emerald-500 border-emerald-800 bg-emerald-950/40"
                            }`}>{saf.severity}</span>
                          </div>
                          <div className="text-[7.5px] text-accent-machina uppercase tracking-wider font-bold mb-1">// CAT: {saf.category}</div>
                          <p className="text-text-secondary text-[8px] uppercase">{saf.detail}</p>
                        </div>
                      ))}

                      {/* WORKER MAINTENANCE CHECKLIST DECK (DIRECT INTERACTIVE INTEGRATION) */}
                      <div className="border-t border-border-machina/60 pt-3 mt-3">
                        <span className="text-[8.5px] text-text-primary font-black block tracking-widest uppercase font-mono mb-2">// PENDING TASKS CHECKLISTS</span>
                        <div className="space-y-1.5 font-mono">
                          {["Safety Boundary Scan", "Calibrate Precision Feeders", "Validate Pressure Relief Duct"].map((lbl, idx) => {
                            const isDone = (checklistState[spot.id] || [false, false, false])[idx];
                            return (
                              <label 
                                key={`chk-${idx}`} 
                                className="flex items-center gap-2 border border-border-machina bg-[#0c0d10] p-2 rounded-[2px] cursor-pointer hover:bg-card-machina select-none transition-colors"
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isDone} 
                                  onChange={() => toggleChecklistTask(idx)}
                                  className="accent-accent-machina h-3.5 w-3.5 bg-bg-machina border-border-machina cursor-pointer rounded"
                                />
                                <span className={`text-[8px] uppercase font-bold tracking-wide ${isDone ? "line-through text-text-secondary" : "text-text-primary"}`}>
                                  {lbl}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: Operations Log (Spans 3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="border border-border-machina rounded-[3px] bg-hover-machina p-3 h-full flex flex-col">
                    <div className="flex items-center gap-1.5 border-b border-border-machina pb-2 mb-3 font-mono">
                      <Activity size={12} className="text-accent-machina" />
                      <span className="text-[10px] text-text-primary font-black uppercase tracking-wider">Facility History Ledger</span>
                    </div>

                    <div className="space-y-2 flex-1 font-mono overflow-y-auto max-h-[220px]">
                      {matchingHistory.length === 0 ? (
                        <div className="py-6 text-center text-text-secondary font-mono text-[8px] uppercase font-bold">
                          No recent maintenance events registered for this sector.
                        </div>
                      ) : (
                        matchingHistory.map((item, idx) => (
                          <div key={`modal-his-${idx}`} className="bg-[#0c0d10] border border-border-machina/70 p-2 rounded-[2px] text-[8px]">
                            <span className="text-text-secondary block font-bold text-[7px]">{new Date(item.timestamp).toLocaleTimeString()}</span>
                            <span className="text-accent-machina block font-bold truncate tracking-wide uppercase mt-0.5">{item.title}</span>
                            <p className="text-text-primary mt-1 leading-normal capitalize">{item.description?.toLowerCase()}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* ACTION PANEL */}
                    <div className="border-t border-border-machina/60 pt-3 mt-3 space-y-2 font-mono">
                      <button
                        onClick={() => {
                          if (addHistory) {
                            addHistory(
                              "SAFETY_SCAN",
                              spot.id.replace("-", "").toUpperCase(),
                              `Instant digital twin calibrator sweep executed for ${spot.name}. Validated zero telemetry drifts.`
                            );
                          }
                        }}
                        className="w-full bg-accent-machina hover:bg-accent-machina/80 text-[#0c0d10] font-black text-[8px] tracking-widest py-2 rounded-[2px] transition-colors text-center uppercase"
                      >
                        [⚡ EX DIAGNOSTIC SWEEP]
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
