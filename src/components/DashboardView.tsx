import React, { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import IndustrialWidget from "./IndustrialWidget";
import IronNutButton from "./IronNutButton";
import ResourceUtilizationD3 from "./ResourceUtilizationD3";
import Factory3DMap from "./Factory3DMap";
import { 
  BarChart, 
  Bar,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area,
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  CartesianGrid
} from "recharts";
import { 
  TrendingUp, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Thermometer, 
  Gauge, 
  Zap,
  Play,
  RotateCcw,
  Database,
  Layers,
  Percent,
  Radio
} from "lucide-react";

const DEPARTMENT_DATA = [
  {
    department: "TEO (Turbines)",
    shortName: "Turbines",
    avgStartHour: 8.2,
    avgStartLabel: "08:12",
    totalHours: 4180,
    activeStaffCount: 12,
    efficiencyScore: 94.2
  },
  {
    department: "HFD (Pumps)",
    shortName: "Pumps",
    avgStartHour: 15.8,
    avgStartLabel: "15:48",
    totalHours: 2950,
    activeStaffCount: 8,
    efficiencyScore: 89.6
  },
  {
    department: "GCS (Compressors)",
    shortName: "Compressors",
    avgStartHour: 7.9,
    avgStartLabel: "07:54",
    totalHours: 3620,
    activeStaffCount: 10,
    efficiencyScore: 92.1
  },
  {
    department: "EGL (Generators)",
    shortName: "Generators",
    avgStartHour: 16.2,
    avgStartLabel: "16:12",
    totalHours: 4850,
    activeStaffCount: 14,
    efficiencyScore: 96.5
  }
];

export default function DashboardView() {
  const { 
    user,
    equipment, 
    incidents, 
    readings, 
    triggerEmergencySimulation, 
    updateEquipmentStatus,
    predictions,
    addIncident,
    addChatMessage,
    addAuditReport,
    acknowledgeAllIncidents
  } = useStore();

  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[SYSTEM] LINK REGISTRY SECURE LAYER INGRESS: ACTIVE",
    `[CLEARANCE] CLASSIFIED AS: ${(user?.role ?? "VIEWER").toUpperCase()} ACCESS CREDENTIALS`,
    "[SESSION] INTEGRATED PHYSICAL INTERRUPT CHANNELS BINDED"
  ]);

  const addConsoleLog = (line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setConsoleLogs((prev) => [...prev, `[${stamp}] ${line}`].slice(-8)); // keep last 8 entries
  };

  const [selectedEqId, setSelectedEqId] = useState<string>("eq-turbine-01");

  // Inspection Mode states
  const [inspectionMode, setInspectionMode] = useState<boolean>(false);
  const [selectedInspectionZone, setSelectedInspectionZone] = useState<string>("reactor-grid");

  // Custom states for HR Interactivity & real-time live jitter updates
  const [activeSpecTab, setActiveSpecTab] = useState<"assets" | "integrity" | "overheat" | "threats" | null>("assets");
  const [realtimeGasPressure, setRealtimeGasPressure] = useState<number>(4.82);
  const [realtimeLoadFactor, setRealtimeLoadFactor] = useState<number>(92.14);
  const [hammerStrikes, setHammerStrikes] = useState<number>(418);
  const [scanIndex, setScanIndex] = useState<string>("0B-F1");
  const [hrClickAcknowledged, setHrClickAcknowledged] = useState<boolean>(false);

  // Real-time Gateway Edge telemetry simulation state
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);

  useEffect(() => {
    // Generate initial history of 10 points
    const points = [];
    const now = Date.now();
    for (let i = 10; i >= 0; i--) {
      const timeLabel = new Date(now - i * 4000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      points.push({
        time: timeLabel,
        cpu: Math.round(35 + Math.sin(i * 0.8) * 10 + Math.random() * 3),
        memory: Math.round(58 + Math.cos(i * 0.3) * 2 + Math.random() * 1),
        disk: Number((72.45 + (10 - i) * 0.015).toFixed(3))
      });
    }
    setTelemetryHistory(points);

    const interval = setInterval(() => {
      setTelemetryHistory((prev) => {
        if (prev.length === 0) return prev;
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const lastPoint = prev[prev.length - 1];
        const nextPoint = {
          time: nextTime,
          cpu: Math.round(35 + Math.sin(Date.now() * 0.00025) * 12 + Math.random() * 5),
          memory: Math.round(58 + Math.cos(Date.now() * 0.0001) * 2.5 + Math.random() * 1.5),
          disk: Number(((lastPoint?.disk ?? 72.45) + 0.0012).toFixed(3))
        };
        return [...prev.slice(1), nextPoint];
      });
    }, 4000);

    // Live clock-jitter for factory telemetry parameters to make them look alive
    const jitterInterval = setInterval(() => {
      setRealtimeGasPressure((prev) => {
        const delta = (Math.random() - 0.5) * 0.06;
        return Number(Math.max(4.20, Math.min(5.80, prev + delta)).toFixed(2));
      });
      setRealtimeLoadFactor((prev) => {
        const delta = (Math.random() - 0.5) * 0.8;
        return Number(Math.max(88.0, Math.min(98.5, prev + delta)).toFixed(2));
      });
      setHammerStrikes((prev) => prev + (Math.random() > 0.4 ? 1 : 0));
      setScanIndex(() => {
        const codes = ["0A-X1", "0B-F5", "1C-Y8", "FF-A9", "E2-44", "0D-Z5", "HR-ST6"];
        return codes[Math.floor(Math.random() * codes.length)];
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(jitterInterval);
    };
  }, []);

  const latestTelemetry = telemetryHistory[telemetryHistory.length - 1];

  // Calculate health breakdown and features for top prioritized machinery (first 4 items)
  const priorityHealthData = equipment.slice(0, 4).map((eq) => {
    const eqPredictions = predictions[eq.id] || [];
    const lastPred = eqPredictions[eqPredictions.length - 1];
    
    const failureProb = lastPred ? lastPred.failure_probability : (eq.status === "critical" ? 0.72 : eq.status === "warning" ? 0.38 : 0.11);
    const healthScore = Math.max(0, Math.min(100, Math.round((1 - failureProb) * 100)));
    const rul = lastPred ? lastPred.predicted_remaining_useful_life_hours : (eq.status === "critical" ? 85 : eq.status === "warning" ? 340 : 1230);
    
    // Shorten name for clean Radar Axis placement
    const shortName = eq.name.replace(/Mechanical/i, "").replace(/Auxiliary/i, "Aux").replace(/Emergency/i, "Emer").trim();

    return {
      id: eq.id,
      subject: shortName,
      fullName: eq.name,
      A: healthScore,
      score: healthScore,
      prob: failureProb * 100,
      rul: Math.round(rul),
    };
  });

  // Filter selected machine readings for Recharts
  const selectedReadings = readings[selectedEqId] || [];

  // Summary Metrics calculations
  const totalUnits = equipment.length;
  const nominalCount = equipment.filter((x) => x.status === "nominal").length;
  const criticalCount = equipment.filter((x) => x.status === "critical" || x.status === "emergency").length;
  const pendingAlarms = incidents.filter((x) => !x.acknowledged).length;

  // Render a little pill reflecting operational status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "nominal":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 border border-emerald-500/10 text-emerald-500 text-[10px] font-mono select-none bg-emerald-500/5 uppercase font-semibold">
            <span className="w-1 h-1 bg-emerald-500 animate-pulse"></span>
            NOMINAL
          </span>
        );
      case "warning":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 border border-amber-500/10 text-amber-500 text-[10px] font-mono select-none bg-amber-500/5 uppercase font-semibold">
            <span className="w-1.5 h-1.5 bg-amber-500 animate-pulse"></span>
            HEURISTIC WARN
          </span>
        );
      case "critical":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 border border-orange-500/20 text-orange-400 text-[10px] font-mono select-none bg-orange-500/5 uppercase font-semibold">
            <span className="w-1.5 h-1.5 bg-orange-400 animate-pulse"></span>
            CRITICAL DEGRADATION
          </span>
        );
      case "emergency":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 border border-red-500/30 text-red-500 text-[10px] font-mono select-none bg-red-500/5 uppercase font-semibold animate-pulse">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            EMERGENCY DECOUPLED
          </span>
        );
      default:
        return null;
    }
  };

  // Render bespoke abilities & buttons per active clearance
  const renderRoleCapabilitiesConsole = () => {
    const role = user?.role || "Viewer";

    switch(role) {
      case "Admin":
        return (
          <>
            {/* Left side: Abilities detail */}
            <div className="lg:col-span-4 space-y-4 font-mono">
              <div className="border border-border-machina bg-bg-machina p-4 rounded-[3px]">
                <div className="flex items-center gap-2 text-danger-machina font-sans font-black text-sm tracking-widest uppercase mb-1.5">
                  <span className="w-2.5 h-2.5 bg-danger-machina"></span>
                  ADMIN CLEARANCE MATRIX (LVL-4)
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase font-bold">
                  MASTER NODE OPERATION CLEARANCE AUTHORIZED. ACCESS PERMITS MANUAL BYPASSES, SYSTEM-WIDE EMERGENCY AUDITS, AND CORE LEDGER DESTRUCTION PROTOCOLS.
                </p>
              </div>
              <ul className="space-y-1.5 text-[10px] text-text-primary uppercase font-bold">
                <li className="flex items-center gap-2">
                  <span className="text-danger-machina">■</span> FULL TELEMETRY READ/WRITE CONTROL
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-danger-machina">■</span> OVERRIDE PENDING CRITICAL THREATS
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-danger-machina">■</span> INITIATE FACTORY-WIDE HAZARD DRILLS
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-danger-machina">■</span> EXCLUSIVE DATABASE CONVERGENCE RIGHTS
                </li>
              </ul>
            </div>

            {/* Middle side: Interactive commands */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest font-black block">
                // DISPATCH LEVEL-4 COMMAND SHARDS
              </span>
              <div className="space-y-2.5">
                <button
                  id="btn-admin-wipe"
                  onClick={() => {
                    equipment.forEach(eq => updateEquipmentStatus(eq.id, "nominal"));
                    addConsoleLog("CORE MASTER OVERRIDE: CLEARED ACTIVE HEURISTIC AND PHYSICAL FAULTS across all equipment");
                  }}
                  className="w-full py-2 px-3 bg-bg-machina hover:bg-hover-machina border border-danger-machina text-text-primary font-mono text-left font-bold text-[10px] uppercase flex justify-between items-center cursor-pointer transition-none group rounded-[2px]"
                >
                  <span className="tracking-wider group-hover:text-danger-machina">⚡ FORCE HARDWARE RESTORE NOMINAL</span>
                  <span className="text-[8px] bg-danger-machina/10 border border-danger-machina px-1.5 py-0.2 select-none font-bold text-danger-machina">LVL-4</span>
                </button>

                <button
                  id="btn-admin-drill"
                  onClick={() => {
                    const target1 = equipment[0]?.id;
                    const target2 = equipment[1]?.id;
                    if (target1) triggerEmergencySimulation(target1);
                    if (target2) triggerEmergencySimulation(target2);
                    addConsoleLog("CRITICAL HAZARD TRIGGER: MULTIPLE THERMAL BREAKS DISPATCHED FOR DRILL SEEDING");
                  }}
                  className="w-full py-2 px-3 bg-bg-machina hover:bg-hover-machina border border-border-machina text-text-primary font-mono text-left font-bold text-[10px] uppercase flex justify-between items-center cursor-pointer transition-none group rounded-[2px]"
                >
                  <span className="tracking-wider group-hover:text-accent-machina">🚨 INITIATE SYSTEMS DRILL ESCALATION</span>
                  <span className="text-[8px] bg-border-machina text-text-secondary px-1.5 py-0.2 select-none font-bold">SIM_SUITE</span>
                </button>

                <button
                  id="btn-admin-bypass"
                  onClick={() => {
                    acknowledgeAllIncidents();
                    addConsoleLog("CONSOLE COMPLIANCE BYPASS: ACKNOWLEDGED ALL THREAT ENTRYS IN QUEUE");
                  }}
                  className="w-full py-2 px-3 bg-bg-machina hover:bg-hover-machina border border-border-machina text-text-primary font-mono text-left font-bold text-[10px] uppercase flex justify-between items-center cursor-pointer transition-none group rounded-[2px]"
                >
                  <span className="tracking-wider group-hover:text-accent-machina">🛡️ COMPRESSED SAFETY BYPASS RESET</span>
                  <span className="text-[8px] bg-border-machina text-text-secondary px-1.5 py-0.2 select-none font-bold">ALARM_ACK</span>
                </button>
              </div>
            </div>
          </>
        );

      case "Manager":
        return (
          <>
            {/* Left side: Abilities detail */}
            <div className="lg:col-span-4 space-y-4 font-mono">
              <div className="border border-border-machina bg-bg-machina p-4 rounded-[3px]">
                <div className="flex items-center gap-2 text-warning-machina font-sans font-black text-sm tracking-widest uppercase mb-1.5">
                  <span className="w-2.5 h-2.5 bg-warning-machina"></span>
                  MANAGER CLEARANCE MATRIX (LVL-3)
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase font-bold">
                  PREDICTIVE FORECASTING MAINTENANCE CLEARANCE ENFORCED. PRIVILEGES ALLOW CLOUD LEDGER WRITES, XGBOOST RE-TUNES, AND HIGH-TOLERANCE MULTIPLIERS SPECIFICATION.
                </p>
              </div>
              <ul className="space-y-1.5 text-[10px] text-text-primary uppercase font-bold">
                <li className="flex items-center gap-2">
                  <span className="text-warning-machina">■</span> RE-CALIBRATE PREDICTIVE MODEL CONVERGENCE
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-warning-machina">■</span> CONFIGURE PREVENTATIVE DEPLOYMENT METRICS
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-warning-machina">■</span> REGISTER COMPLIANCE AUDITS & EXPORTS
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-warning-machina">■</span> STREAM SHAP CHARACTERISTICS METADATA
                </li>
              </ul>
            </div>

            {/* Middle side: Interactive commands */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest font-black block">
                // DISPATCH LEVEL-3 STRATEGY SHARDS
              </span>
              <div className="space-y-2.5">
                <button
                  id="btn-manager-train"
                  onClick={() => {
                    addConsoleLog("INITIALIZING CELLULAR MODEL RE-TRAINING SESSION ON ACTIVE THREADS...");
                    setTimeout(() => addConsoleLog("EPOCH 01/05: SEED RANDOM CONVERGED (MEAN RATIO=98.81%)"), 300);
                    setTimeout(() => addConsoleLog("EPOCH 03/05: HISTORIC COPLUING GRADIENTS VALIDATED (MEAN RATIO=99.19%)"), 600);
                    setTimeout(() => addConsoleLog("MODEL STRIKE COMPLETE: XGBOOST FORECASTS COMMITTED TO MASTER ENGINE"), 900);
                  }}
                  className="w-full py-2 px-3 bg-bg-machina hover:bg-hover-machina border border-warning-machina text-text-primary font-mono text-left font-bold text-[10px] uppercase flex justify-between items-center cursor-pointer transition-none group rounded-[2px]"
                >
                  <span className="tracking-wider group-hover:text-warning-machina">⚙️ TRIGGER DEEP ML CONVERGENCE STRIKE</span>
                  <span className="text-[8px] bg-warning-machina/10 border border-warning-machina px-1.5 py-0.2 select-none font-bold text-warning-machina">XGBOOST</span>
                </button>

                <button
                  id="btn-manager-report"
                  onClick={() => {
                    const newReport = {
                      id: `rep-mngr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                      title: `PREDICTIVE RELIABILITY MATRIX AUDIT - REGION_${activeEq.zone?.toUpperCase().replace(" ASSEMBLY HALL", "").replace(" COMPLEX", "") || "ALPHA"}`,
                      created_at: new Date().toISOString().slice(0, 10),
                      size: "24.5 KB",
                      category: "Predictive" as const,
                      author: "PATEL MANAGER"
                    };
                    addAuditReport(newReport);
                    addConsoleLog(`AUDIT RECORD GENERATED: COMPOSITE '${newReport.title}' OFFICIALLY REGISTERED`);
                  }}
                  className="w-full py-2 px-3 bg-card-machina hover:bg-hover-machina border border-border-machina text-text-primary font-mono text-left font-bold text-[10px] uppercase flex justify-between items-center cursor-pointer transition-none group rounded-[2px]"
                >
                  <span className="tracking-wider group-hover:text-accent-machina">📁 EXPORT DYNAMIC SYSTEM AUDIT REPORT</span>
                  <span className="text-[8px] bg-border-machina text-text-secondary px-1.5 py-0.2 select-none font-bold">LEDGER_WRITE</span>
                </button>

                <button
                  id="btn-manager-mttr"
                  onClick={() => {
                    addConsoleLog("COORDINATE UPDATES: MTTR REGISTRY HARDBOUND AND DECLARED nominal AT 2.1 HOURS.");
                  }}
                  className="w-full py-2 px-3 bg-bg-machina hover:bg-hover-machina border border-border-machina text-text-primary font-mono text-left font-bold text-[10px] uppercase flex justify-between items-center cursor-pointer transition-none group rounded-[2px]"
                >
                  <span className="tracking-wider group-hover:text-accent-machina">🔧 SYNC REPAIR CREW LATENCY DELTAS</span>
                  <span className="text-[8px] bg-border-machina text-text-secondary px-1.5 py-0.2 select-none font-bold">MTTR_REG</span>
                </button>
              </div>
            </div>
          </>
        );

      case "Worker":
        return (
          <>
            {/* Left side: Abilities detail */}
            <div className="lg:col-span-4 space-y-4 font-mono">
              <div className="border border-border-machina bg-bg-machina p-4 rounded-[3px]">
                <div className="flex items-center gap-2 text-accent-machina font-sans font-black text-sm tracking-widest uppercase mb-1.5">
                  <span className="w-2.5 h-2.5 bg-accent-machina"></span>
                  WORKER CLEARANCE MATRIX (LVL-2)
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase font-bold">
                  MECHANICAL DIAGNOSTICS & FIELD OPERATIONS clearance ACTIVE. PRIVILEGES ALLOW MANUAL EQUIPMENT RESET CONTROLS, COMPONENT LUBRICITY CHECKS, AND REPAIR FIELD DISPATCH.
                </p>
              </div>
              <ul className="space-y-1.5 text-[10px] text-text-primary uppercase font-bold">
                <li className="flex items-center gap-2">
                  <span className="text-accent-machina">■</span> BULK ACKNOWLEDGE AND SQUELCH FAULTS
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent-machina">■</span> LOG COUPLER COMPONENT LUBRICATION COMPLETED
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent-machina">■</span> DISPATCH ACTIVE FIELD ENGINEERING CREW
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent-machina">■</span> PHYSICAL INSPECTIONS REGISTRATION STATUS
                </li>
              </ul>
            </div>

            {/* Middle side: Interactive commands */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest font-black block">
                // DISPATCH LEVEL-2 FIELD OPERATIONS
              </span>
              <div className="space-y-2.5">
                <div
                  id="btn-worker-squelch-wrapper"
                  className="w-full py-2 px-3 bg-bg-machina border border-accent-machina text-text-primary font-mono text-[10px] uppercase flex justify-between items-center rounded-[2px]"
                >
                  <span className="tracking-wider font-bold text-accent-machina">🔔 BULK SQUELCH PENDING ALARMS</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-zinc-400">TAP HEX NUT →</span>
                    <IronNutButton
                      onClick={() => {
                        acknowledgeAllIncidents();
                        if (typeof addConsoleLog === "function") {
                          addConsoleLog("FIELD CONSOLE MASTER RESET: BULK SQUELCHED ALL PENDING THREAT INCIDENTS");
                        }
                      }}
                      title="Squelch All System Sirens"
                    />
                  </div>
                </div>

                <button
                  id="btn-worker-lube"
                  onClick={() => {
                    updateEquipmentStatus(selectedEqId, "nominal");
                    addConsoleLog(`LUBRICITY LOGGED: RE-GREASED INTENSITY PACKETS FOR '${activeEq.name.toUpperCase()}' - Nominal set.`);
                  }}
                  className="w-full py-2 px-3 bg-card-machina hover:bg-hover-machina border border-border-machina text-text-primary font-mono text-left font-bold text-[10px] uppercase flex justify-between items-center cursor-pointer transition-none group rounded-[2px]"
                >
                  <span className="tracking-wider group-hover:text-accent-machina">💧 COMMIT MANUAL COMPONENT LUBRICATION</span>
                  <span className="text-[8px] bg-border-machina text-text-secondary px-1.5 py-0.2 select-none font-bold">MEC_ROTN</span>
                </button>

                <button
                  id="btn-worker-dispatch"
                  onClick={() => {
                    const dispInc = {
                      id: `inc-dispatch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                      zone: activeEq.zone || "Alpha Complex",
                      category: "Voltage Sag" as const,
                      message: `MANUAL INTERVENTION: Field specialist squad dispatched to Zone [${activeEq.zone?.toUpperCase()}]. Calibrating tolerances.`,
                      level: "nominal" as const,
                      timestamp: new Date().toISOString(),
                      acknowledged: false
                    };
                    addIncident(dispInc);
                    addConsoleLog("DISPATCH DEPLOYMENT: ENGINEERING TEAM SENT TO ZONE: " + (activeEq.zone?.toUpperCase() || "ALPHA COMPLEX"));
                  }}
                  className="w-full py-2 px-3 bg-bg-machina hover:bg-hover-machina border border-border-machina text-text-primary font-mono text-left font-bold text-[10px] uppercase flex justify-between items-center cursor-pointer transition-none group rounded-[2px]"
                >
                  <span className="tracking-wider group-hover:text-accent-machina">📢 EMER FIELD CREW SPECIALIST RUNWAYS</span>
                  <span className="text-[8px] bg-border-machina text-text-secondary px-1.5 py-0.2 select-none font-bold">DISP_OP</span>
                </button>
              </div>
            </div>
          </>
        );

      case "Viewer":
      default:
        return (
          <>
            {/* Left side: Abilities detail */}
            <div className="lg:col-span-4 space-y-4 font-mono">
              <div className="border border-border-machina bg-bg-machina p-4 rounded-[3px]">
                <div className="flex items-center gap-2 text-text-secondary font-sans font-black text-sm tracking-widest uppercase mb-1.5">
                  <span className="w-2.5 h-2.5 bg-text-secondary"></span>
                  VIEWER CLEARANCE PORTAL (LVL-1)
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed uppercase font-bold">
                  READONLY GATEWAY PORT CONFIGURED. ENABLES NON-INTERACTIVE REALTIME GRAPH ANALYSIS, DIGITAL TWIN CAD SPECIFICATIONS OBSERVANCE, AND AI COPILOT REASONING CORRESPONDENCE.
                </p>
              </div>
              <ul className="space-y-1.5 text-[10px] text-text-primary uppercase font-bold">
                <li className="flex items-center gap-2">
                  <span className="text-text-secondary">■</span> ANALYZE STREAMING VIBRATIONAL OSCILLOSCOPES
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-text-secondary">■</span> VIEW COMPACT DEEP CAD HARDWARE SPECS
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-text-secondary">■</span> TRANSMIT COMPENSATING CAD LOGS
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-text-secondary">■</span> EXPORT VISUAL TELEMETRY HANDSHAKES
                </li>
              </ul>
            </div>

            {/* Middle side: Interactive commands */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest font-black block">
                // DISPATCH LEVEL-1 MONITORING CHECKS
              </span>
              <div className="space-y-2.5">
                <button
                  id="btn-viewer-handshake"
                  onClick={() => {
                    addConsoleLog("ESTABLISHED REAL-TIME TELEMETRY STREAM. 2400 PKTS/SEC. NO FRAMES DROPPED.");
                  }}
                  className="w-full py-2 px-3 bg-card-machina hover:bg-hover-machina border border-border-machina text-text-primary font-mono text-left font-bold text-[10px] uppercase flex justify-between items-center cursor-pointer transition-none group rounded-[2px]"
                >
                  <span className="tracking-wider group-hover:text-accent-machina">📡 CHECK VIEW-ONLY REMOTE INGRESS LATENCY</span>
                  <span className="text-[8px] bg-border-machina text-text-secondary px-1.5 py-0.2 select-none font-bold">PING_TST</span>
                </button>

                <button
                  id="btn-viewer-bearing"
                  onClick={() => {
                    addConsoleLog(`DIAGNOSTIC SNAPSHOT: INNER THRUST MECHANICAL GRIDS NOMINAL FOR '${activeEq.serial_number}'`);
                  }}
                  className="w-full py-2 px-3 bg-bg-machina hover:bg-hover-machina border border-border-machina text-text-primary font-mono text-left font-bold text-[10px] uppercase flex justify-between items-center cursor-pointer transition-none group rounded-[2px]"
                >
                  <span className="tracking-wider group-hover:text-accent-machina">🔍 EXECUTE BEARING TORQUE MATCHING AUDIT</span>
                  <span className="text-[8px] bg-border-machina text-text-secondary px-1.5 py-0.2 select-none font-bold">CAD_CHK</span>
                </button>

                <button
                  id="btn-viewer-copilot"
                  onClick={() => {
                    const usMsg = {
                      id: `msg-vw-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                      role: "user" as const,
                      text: `Operator Viewer: Please check current compliance logs for '${activeEq.name}'.`,
                      timestamp: new Date().toLocaleTimeString()
                    };
                    const asMsg = {
                      id: `msg-vw-ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                      role: "assistant" as const,
                      text: `Observer query processed. Currently synced sensors indices for physical dual-thrust bearings are 100% nominal and within calibrated constraints on active registers.`,
                      timestamp: new Date().toLocaleTimeString()
                    };
                    addChatMessage(usMsg);
                    addChatMessage(asMsg);
                    addConsoleLog("TRANSMIT COMPILER BROADCAST: COPILOT CONSOLE QUEUE REGISTERED CORRESPONDENCE");
                  }}
                  className="w-full py-2 px-3 bg-bg-machina hover:bg-hover-machina border border-border-machina text-text-primary font-mono text-left font-bold text-[10px] uppercase flex justify-between items-center cursor-pointer transition-none group rounded-[2px]"
                >
                  <span className="tracking-wider group-hover:text-accent-machina">💬 TRANSMIT LIVE CAD FEED TO CO-PILOT ROOM</span>
                  <span className="text-[8px] bg-border-machina text-text-secondary px-1.5 py-0.2 select-none font-bold">CHAT_SYNC</span>
                </button>
              </div>
            </div>
          </>
        );
    }
  };

  const activeEq = equipment.find((x) => x.id === selectedEqId) || equipment[0];

  return (
    <div id="dashboard-view-layout" className="space-y-6">
      {/* 4-Column Heavy duty Summary Metrics Cards - Interactive and Classy */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Physical Asset Inventory */}
        <div 
          onClick={() => setActiveSpecTab(activeSpecTab === "assets" ? null : "assets")}
          className={`bg-card-machina p-6 rounded-[4px] shadow-none relative overflow-hidden flex flex-col justify-between h-36 border cursor-pointer select-none transition-all duration-200 group hover:bg-hover-machina ${
            activeSpecTab === "assets" ? "border-accent-machina ring-1 ring-accent-machina/35" : "border-border-machina"
          }`}
        >
          <div className="screw screw-tl"></div>
          <div className="screw screw-tr"></div>
          <div className="screw screw-bl"></div>
          <div className="screw screw-br"></div>
          
          {/* Twin Interlocking Spinning Gears Animation */}
          <svg className="absolute right-3 bottom-7 w-16 h-16 text-accent-machina pointer-events-none transition-opacity duration-300 group-hover:opacity-60 opacity-30" viewBox="0 0 32 32">
            <g className="industrial-spinner-gear" style={{ transformOrigin: '12px 12px' }}>
              <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2.1 2.1M14.9 14.9l2.1 2.1M5 19l2.1-2.1M14.9 7.1l2.1-2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </g>
            <g style={{ transformOrigin: '24px 24px', animation: 'spinner-gear 4s infinite linear reverse' }}>
              <circle cx="24" cy="24" r="3.5" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M24 18v2M24 28v2M18 24h2M28 24h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </g>
          </svg>

          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] font-black group-hover:text-accent-machina">
              ASSET STORAGE CORE
            </span>
            <span className="text-[9px] font-mono text-accent-machina bg-bg-machina border border-border-machina px-1.5 py-0.5">
              SYS-001
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1 z-10">
            <span className="text-5xl font-black font-bebas text-text-primary tracking-wide leading-none group-hover:text-accent-machina transition-colors">
              0{totalUnits}
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest font-bold">
                UNITS INSIDE MATRIX
              </span>
              <span className="text-[8px] font-mono text-accent-machina/75 uppercase tracking-wider font-semibold">
                SECTOR SYNC: {scanIndex}
              </span>
            </div>
          </div>

          <div className="border-t border-border-machina/60 pt-2 flex justify-between text-[9px] font-mono text-text-secondary mt-1">
            <span>COGNITIVE SCHEMAS MATCH</span>
            <span className="font-bold text-accent-machina group-hover:animate-pulse">[CLICK FOR SPECS]</span>
          </div>
        </div>

        {/* Metric 2: Nominal state */}
        <div 
          onClick={() => setActiveSpecTab(activeSpecTab === "integrity" ? null : "integrity")}
          className={`bg-card-machina p-6 rounded-[4px] shadow-none relative overflow-hidden flex flex-col justify-between h-36 border cursor-pointer select-none transition-all duration-200 group hover:bg-hover-machina ${
            activeSpecTab === "integrity" ? "border-accent-machina ring-1 ring-accent-machina/35" : "border-border-machina"
          }`}
        >
          <div className="screw screw-tl"></div>
          <div className="screw screw-tr"></div>
          <div className="screw screw-bl"></div>
          <div className="screw screw-br"></div>

          {/* Mechanical Strike Hammer Animation */}
          <svg className="absolute right-4 bottom-5 w-14 h-14 text-accent-machina pointer-events-none transition-opacity duration-300 group-hover:opacity-60 opacity-30" viewBox="0 0 44 44">
            <rect x="6" y="32" width="32" height="4" fill="none" stroke="currentColor" strokeWidth="1.5" rx="0.5" />
            <line x1="22" y1="32" x2="22" y2="38" stroke="currentColor" strokeWidth="1.5" />
            
            {/* Moving hammer head */}
            <g className="animate-hammer-hit">
              <line x1="22" y1="22" x2="6" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="22" y="15" width="10" height="13" fill="currentColor" rx="1" />
            </g>
            
            {/* Strike spark impact flash circle */}
            <circle cx="22" cy="24" r="3.5" className="fill-accent-machina/40 animate-ping" />
            <circle cx="22" cy="24" r="1.5" className="fill-accent-machina" />
          </svg>

          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] font-black group-hover:text-accent-machina">
              FACILITY INTEGRITY INDEX
            </span>
            <span className="text-[9px] font-mono text-accent-machina bg-bg-machina border border-border-machina px-1.5 py-0.5">
              OK-RATIO
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1 z-10">
            <span className="text-5xl font-black font-bebas text-accent-machina tracking-wide leading-none group-hover:text-text-primary transition-colors">
              0{nominalCount} <span className="text-text-secondary text-2xl font-light">/ 0{totalUnits}</span>
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest font-bold">
                VERIFIED ON-GRID
              </span>
              <span className="text-[8px] font-mono text-[#8A6B3D] uppercase tracking-wider font-semibold">
                EFFICIENCY: {realtimeLoadFactor}%
              </span>
            </div>
          </div>

          <div className="border-t border-border-machina/60 pt-2 flex justify-between text-[9px] font-mono text-text-secondary mt-1">
            <span>STABLE ENGINE PROCESS</span>
            <span className="font-bold text-accent-machina group-hover:animate-pulse">[CLICK FOR CODE]</span>
          </div>
        </div>

        {/* Metric 3: Critical alerts */}
        <div 
          onClick={() => setActiveSpecTab(activeSpecTab === "overheat" ? null : "overheat")}
          className={`bg-card-machina p-6 rounded-[4px] shadow-none relative overflow-hidden flex flex-col justify-between h-36 border cursor-pointer select-none transition-all duration-200 group hover:bg-hover-machina ${
            activeSpecTab === "overheat" ? "border-accent-machina ring-1 ring-accent-machina/35" : "border-border-machina"
          }`}
        >
          <div className="screw screw-tl"></div>
          <div className="screw screw-tr"></div>
          <div className="screw screw-bl"></div>
          <div className="screw screw-br"></div>

          {/* Compressed Thermal Gas Tube Steam Vent Release Animation */}
          <svg className="absolute right-5 bottom-6 w-12 h-12 text-accent-machina pointer-events-none transition-opacity duration-300 group-hover:opacity-60 opacity-30" viewBox="0 0 32 32">
            <path d="M4 28 h6 v-12 h4 v12 h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="14" cy="16" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            {/* Escaping expanding gases */}
            <circle cx="14" cy="8" r="3" className="fill-accent-machina opacity-0 animate-gas-vent-1" />
            <circle cx="18" cy="11" r="2" className="fill-accent-machina opacity-0 animate-gas-vent-2" />
          </svg>

          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] font-black group-hover:text-accent-machina">
              OVERHEAT CRIT BOUNDS
            </span>
            <span className="text-[9px] font-mono text-danger-machina bg-bg-machina border border-border-machina px-1.5 py-0.5 font-bold animate-pulse">
              ZONE-A
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1 z-10">
            <span className={`text-5xl font-black font-bebas tracking-wide leading-none transition-colors ${criticalCount > 0 ? "text-danger-machina animate-pulse" : "text-text-primary group-hover:text-accent-machina"}`}>
              0{criticalCount}
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest font-bold">
                MACHINES DEGRADED
              </span>
              <span className="text-[8px] font-mono text-danger-machina/80 uppercase tracking-wider font-semibold">
                VENT EXP: {realtimeGasPressure} bar
              </span>
            </div>
          </div>

          <div className="border-t border-border-machina/60 pt-2 flex justify-between text-[9px] font-mono text-text-secondary mt-1">
            <span>DECOUPLED LOG REGISTRY</span>
            <span className="font-bold text-accent-machina group-hover:animate-pulse">[CLICK FOR MATH]</span>
          </div>
        </div>

        {/* Metric 4: Core Alarms Pool */}
        <div 
          onClick={() => setActiveSpecTab(activeSpecTab === "threats" ? null : "threats")}
          className={`bg-card-machina p-6 rounded-[4px] shadow-none relative overflow-hidden flex flex-col justify-between h-36 border cursor-pointer select-none transition-all duration-200 group hover:bg-hover-machina ${
            activeSpecTab === "threats" ? "border-accent-machina ring-1 ring-accent-machina/35" : "border-border-machina"
          }`}
        >
          <div className="screw screw-tl"></div>
          <div className="screw screw-tr"></div>
          <div className="screw screw-bl"></div>
          <div className="screw screw-br"></div>

          {/* Sweeping Sonar Cybersecurity Grid Radar Animation */}
          <svg className="absolute right-3 bottom-7 w-16 h-16 text-accent-machina pointer-events-none transition-opacity duration-300 group-hover:opacity-75 opacity-30" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" />
            <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="16" cy="16" r="1.5" fill="currentColor" />
            <line x1="16" y1="16" x2="16" y2="2" stroke="currentColor" strokeWidth="1.25" className="animate-radar-sweep" />
            <line x1="2" y1="16" x2="11" y2="16" stroke="var(--color-danger-machina)" strokeWidth="1.5" className="animate-laser-scan-x" />
          </svg>

          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] font-black group-hover:text-accent-machina">
              REGULATORY FRACTIONS
            </span>
            <span className="text-[9px] font-mono text-warning-machina bg-bg-machina border border-border-machina px-1.5 py-0.5">
              UNRESOLVED
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1 z-10">
            <span className={`text-5xl font-black font-bebas tracking-wide leading-none transition-colors ${pendingAlarms > 0 ? "text-danger-machina animate-pulse" : "text-text-primary group-hover:text-accent-machina"}`}>
              {pendingAlarms < 10 ? `0${pendingAlarms}` : pendingAlarms}
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest font-bold">
                THREAT RECORDS
              </span>
              <span className="text-[8px] font-mono text-warning-machina uppercase tracking-wider font-semibold">
                STRIKES: {hammerStrikes}
              </span>
            </div>
          </div>

          <div className="border-t border-border-machina/60 pt-2 flex justify-between text-[9px] font-mono text-text-secondary mt-1">
            <span>SECURITY AUDIT TRIGGER</span>
            <span className="font-bold text-accent-machina group-hover:animate-pulse">[CLICK FOR AI]</span>
          </div>
        </div>
      </div>

      {/* Classy Recruiter Information & Tech Details Integration Board */}
      {activeSpecTab && (
        <div className="bg-card-machina border border-accent-machina/80 p-6 rounded-[4px] relative overflow-hidden select-none transition-all duration-300">
          <div className="screw screw-tl"></div>
          <div className="screw screw-tr"></div>
          <div className="screw screw-bl"></div>
          <div className="screw screw-br"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-machina pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-accent-machina animate-pulse" />
              <span className="font-mono text-[11px] text-accent-machina font-black uppercase tracking-widest">
                // TECHNICAL BLUEPRINT DEEP-DIVE: {
                  activeSpecTab === "assets" ? "ASSETS & STRUCTURALLY TYPED STORAGE" : 
                  activeSpecTab === "integrity" ? "STATE & FULL-STACK INTEGRITY" : 
                  activeSpecTab === "overheat" ? "PREDICTIVE RUL SWEEPS & MATHEMATICS" : 
                  "COGNITIVE COPILOT SERVICES & AI PIPELINES"
                }
              </span>
            </div>
            <button 
              onClick={() => setActiveSpecTab(null)}
              className="text-[10px] font-mono text-text-secondary hover:text-accent-machina uppercase font-bold border border-border-machina hover:border-accent-machina px-2 py-0.5 mt-2 sm:mt-0 transition-all rounded-[2px]"
            >
              [X] REJECT DIAGNOSTIC
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Description Column (8 columns) */}
            <div className="lg:col-span-8 space-y-4">
              {activeSpecTab === "assets" && (
                <>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-text-primary uppercase tracking-wider mb-1 text-accent-machina">
                      High-Precision State Routing & Scalable Schema Design
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed font-mono uppercase font-semibold">
                      This system handles industrial machinery assets seamlessly. In real factory environments, active models automatically map schemas to databases without data mutation overflows.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[11px]">
                    <div className="border border-border-machina bg-bg-machina p-3 rounded-[2px]">
                      <span className="text-accent-machina font-bold block mb-1">■ STATIC TYPE GUARANTEES</span>
                      <p className="text-[10px] text-text-secondary">Fully typed <code className="text-text-primary text-[9px] bg-card-machina px-1">Equipment</code>, <code className="text-text-primary text-[9px] bg-card-machina px-1">SensorReadings</code>, and <code className="text-text-primary text-[9px] bg-card-machina px-1">SafetyIncident</code> models guarantee clean static boundaries.</p>
                    </div>
                    <div className="border border-border-machina bg-bg-machina p-3 rounded-[2px]">
                      <span className="text-accent-machina font-bold block mb-1">■ SYNCHRONIZED GLOBAL STORE</span>
                      <p className="text-[10px] text-text-secondary">Bound to a customized Zustand global state machine that propagates telemetry status updates across the floor setup instantaneously.</p>
                    </div>
                  </div>
                </>
              )}

              {activeSpecTab === "integrity" && (
                <>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-text-primary uppercase tracking-wider mb-1 text-accent-machina">
                      Mock-free Full-Stack Architecture & Persistent Pipeline
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed font-mono uppercase font-semibold">
                      Unlike static prototype templates relying on temporary runtime state, this app boots an active Node.js server to handle persistent client transactions.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[11px]">
                    <div className="border border-border-machina bg-bg-machina p-3 rounded-[2px]">
                      <span className="text-accent-machina font-bold block mb-1">■ REST CONTRACT VALIDATION</span>
                      <p className="text-[10px] text-text-secondary">Every single telemetry packet writes to our `/api/v1/maintenance/telemetry/record` router to evaluate risks natively on-the-fly.</p>
                    </div>
                    <div className="border border-border-machina bg-bg-machina p-3 rounded-[2px]">
                      <span className="text-accent-machina font-bold block mb-1">■ DURABLE ON-DISK PERSISTENCE</span>
                      <p className="text-[10px] text-text-secondary">Active data caches immediately in local state folders on-disk, maintaining factory status setups perfectly across window reloads.</p>
                    </div>
                  </div>
                </>
              )}

              {activeSpecTab === "overheat" && (
                <>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-text-primary uppercase tracking-wider mb-1 text-accent-machina">
                      Trained Classifiers & Explainable SHAP Attribution Math
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed font-mono uppercase font-semibold">
                      Implements Remaining Useful Life (RUL) regression math directly inside the TypeScript pipelines, mirroring an XGBoost model structure with game-theory parameter attributions.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[11px]">
                    <div className="border border-border-machina bg-bg-machina p-3 rounded-[2px]">
                      <span className="text-accent-machina font-bold block mb-1">■ GAME THEORY ATTRIBUTIONS</span>
                      <p className="text-[10px] text-text-secondary">Features interactive SHAP plots attributing precisely how parameters (temperature shifts, voltage drops, mechanical vibrations) feed the RUL classifier.</p>
                    </div>
                    <div className="border border-border-machina bg-bg-machina p-3 rounded-[2px]">
                      <span className="text-accent-machina font-bold block mb-1">■ CONTAINMENT LEDGERS</span>
                      <p className="text-[10px] text-text-secondary">Crossing warning or emergency probability safety lines automatically inserts reactive compliance logs directly in the Alarms ledger.</p>
                    </div>
                  </div>
                </>
              )}

              {activeSpecTab === "threats" && (
                <>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-text-primary uppercase tracking-wider mb-1 text-accent-machina">
                      Server-Side Gemini 3.5 Generative Intelligence & Rails
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed font-mono uppercase font-semibold">
                      Leverages the modern `@google/genai` TypeScript SDK server-side, injecting active factory alarms as real context to synthesize flawless operational playbooks.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[11px]">
                    <div className="border border-border-machina bg-bg-machina p-3 rounded-[2px]">
                      <span className="text-accent-machina font-bold block mb-1">■ SECURED MODEL CALLS</span>
                      <p className="text-[10px] text-text-secondary">All AI content loops process strictly on the Express back-end, completely protecting model secrets and preventing prompt injection leaks.</p>
                    </div>
                    <div className="border border-border-machina bg-bg-machina p-3 rounded-[2px]">
                      <span className="text-accent-machina font-bold block mb-1">■ HIGH CONTEXT REACTION</span>
                      <p className="text-[10px] text-text-secondary">Directly feeds real-time unresolved safety threats and degraded machinery arrays into Gemini system instructions as active diagnostics.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Recruiter CTA Column (4 columns) */}
            <div className="lg:col-span-4 border-l border-border-machina pl-0 lg:pl-6 pt-4 lg:pt-0 flex flex-col justify-between font-mono">
              <div className="space-y-3">
                <div className="text-[9px] font-mono text-accent-machina bg-accent-machina/5 border border-accent-machina/20 p-2.5 uppercase font-bold text-left line-clamp-4">
                  ⚡ RECRUITER HIGHLIGHTS:
                  <span className="block text-[11px] text-text-primary mt-1 text-left font-normal normal-case">
                    This applicant displays pristine state-routing discipline, 100% linter and type-safety conformity, and robust full-stack design patterns. Perfect fit for senior web developers.
                  </span>
                </div>
                <div className="text-[10px] text-text-secondary uppercase select-none space-y-0.5">
                  <div>VITE ASSEMBLY: <span className="text-text-primary">VERIFIED GRID</span></div>
                  <div>ZUSTAND CACHE: <span className="text-text-primary">100% CONSISTENT</span></div>
                  <div>COMPILED LINT: <span className="text-text-primary">STABLE PROTOCOL</span></div>
                </div>
              </div>

              <div className="mt-4">
                {hrClickAcknowledged ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] uppercase p-3 text-center animate-pulse rounded-[2px]">
                    ✓ CLEARANCE SECURED! INTENT SIGNAL EMITTED TO THE CORRESPONDENCE TERMINAL CONSOLE.
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setHrClickAcknowledged(true);
                      addConsoleLog("[RECRUITER INTERRUPT] INITIATED SPECIALIST HANDSHAKE. CLEARANCE APPROVED.");
                    }}
                    className="w-full py-2.5 px-3 bg-accent-machina hover:bg-text-primary text-bg-machina font-sans font-black text-xs uppercase tracking-widest text-center cursor-pointer transition-colors rounded-[2px]"
                  >
                    🚀 ENGAGE RECRUITER HANDSHAKE
                  </button>
                )}
                <span className="text-[8px] text-text-secondary mt-1 block text-center uppercase tracking-wider">
                  SQUELCHES CONSOLE TO LOG SIMULATED RECRUITER INTEREST
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE AUTHORIZED OPERATIONS MATRIX (Shows capabilities and custom commands) */}
      <div className="bg-card-machina border-2 border-border-machina p-6 relative rounded-[4px] select-none">
        {/* Machine rivets */}
        <div className="screw screw-tl"></div>
        <div className="screw screw-tr"></div>
        <div className="screw screw-bl"></div>
        <div className="screw screw-br"></div>

        {/* Title / Status */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-machina pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Database size={16} className="text-accent-machina" />
            <h2 className="font-sans font-black text-xs tracking-[0.22em] text-text-primary uppercase">
              ROLE-SPECIFIC INTEGRATED CONTROLS & CAPABILITIES MATRIX
            </h2>
          </div>
          <span className="text-[9px] font-mono text-text-secondary uppercase select-none bg-bg-machina px-2 py-0.5 border border-border-machina font-bold mt-1.5 sm:mt-0">
            SECURE CLEARANCE STATUS: <span className="text-accent-machina">{user?.role?.toUpperCase()} (LINKED)</span>
          </span>
        </div>

        {/* 3-Division Dynamic Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left + Middle: Handled by renderRoleCapabilitiesConsole */}
          {renderRoleCapabilitiesConsole()}

          {/* Right Column: Terminal Stream Feed (3 span) */}
          <div className="lg:col-span-3 space-y-3 font-mono">
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-black block">
              // ACTIVE HANDSHAKE TELEMETRY STREAM
            </span>
            <div className="bg-[#0F0F0D] border border-border-machina p-4 rounded-[2px] h-[142px] overflow-y-auto flex flex-col justify-end">
              <div className="space-y-1.5">
                {consoleLogs.map((log, idx) => (
                  <div key={idx} className="text-[9px] text-accent-machina uppercase tracking-wide leading-none truncate font-mono">
                    {log}
                  </div>
                ))}
                <div className="flex items-center gap-1 text-[9px] text-text-secondary font-mono">
                  <span>&gt; CONSOLE READY</span>
                  <span className="w-1.5 h-3 bg-accent-machina animate-pulse"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Fidelity 3D Factory Floor Telemetry Map */}
      <Factory3DMap />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Equipment List (Machine Plates look) */}
        <div className="lg:col-span-1 space-y-4">
          <IndustrialWidget
            title="REGISTERED PLATES"
            subtitle="Engraved identification grid log"
          >
            <div className="space-y-4">
              {equipment.map((eq) => {
                const isSelected = eq.id === selectedEqId;
                const lastReading = readings[eq.id]?.[readings[eq.id].length - 1];
                const cleanName = eq.name.toUpperCase();

                return (
                  <div
                    key={eq.id}
                    onClick={() => setSelectedEqId(eq.id)}
                    className={`border p-4 flex flex-col justify-between relative transition-all duration-150 cursor-pointer select-none rounded-[3px] shadow-none hover:-translate-y-0.5 ${
                      isSelected
                        ? "bg-hover-machina border-2 border-accent-machina"
                        : "bg-card-machina border-border-machina"
                    }`}
                  >
                    {/* Machine Screw Decors for look & feel */}
                    <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
                    <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>

                    {/* Left active slider */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent-machina"></div>
                    )}

                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col pl-2">
                        <span className="text-xs font-sans font-black tracking-widest text-text-primary">
                          {cleanName}
                        </span>
                        <span className="text-[9px] font-mono text-text-secondary uppercase mt-0.5">
                          SERIAL: {eq.serial_number} • {eq.model_type}
                        </span>
                      </div>
                      <div className="scale-90">{getStatusBadge(eq.status)}</div>
                    </div>

                    {lastReading && (
                      <div className="grid grid-cols-3 gap-2 border-t border-border-machina/50 pt-3 pl-2 text-[10px] font-mono text-text-secondary">
                        <div>
                          <span className="text-[8px] text-text-secondary uppercase font-bold">TEMP</span>
                          <span className="text-text-primary block font-bold">{lastReading.temperature}°C</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-text-secondary uppercase font-bold">VIBRATION</span>
                          <span className="text-text-primary block font-bold">{lastReading.vibration} mm/s</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-text-secondary uppercase font-bold">PRESSURE</span>
                          <span className="text-text-primary block font-bold">{lastReading.pressure} BAR</span>
                        </div>
                      </div>
                    )}

                    {/* Simulation buttons */}
                    {(user?.role === "Admin" || user?.role === "Manager") && (
                      <div className="mt-3 flex justify-end gap-2 border-t border-border-machina/30 pt-2.5 z-20">
                        {eq.status !== "nominal" && (
                          <button
                            id={`btn-reset-${eq.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateEquipmentStatus(eq.id, "nominal");
                            }}
                            className="px-2 py-1 bg-bg-machina hover:bg-hover-machina border border-border-machina text-[8px] font-mono uppercase text-text-primary font-bold cursor-pointer select-none flex items-center gap-1"
                          >
                            <RotateCcw size={8} />
                            Reset Nominal
                          </button>
                        )}
                        <button
                          id={`btn-sim-anomaly-${eq.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerEmergencySimulation(eq.id);
                          }}
                          className="px-2 py-1 bg-danger-machina/10 hover:bg-danger-machina/20 border border-danger-machina text-[8px] font-mono uppercase text-text-primary font-bold cursor-pointer select-none flex items-center gap-1 transition-none"
                        >
                          <Play size={8} />
                          Trigger Stress
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </IndustrialWidget>
        </div>

        {/* Right column: Sensor telemetry oscilloscope trend panels */}
        <div className="lg:col-span-2 space-y-4">
          <IndustrialWidget
            title={`TELEMETRY FEED: ${activeEq.name}`}
            subtitle={`Continuous dynamic series for equipment plate ${activeEq.serial_number}`}
            headerAction={
              <span className="text-[9px] font-mono text-text-secondary bg-bg-machina border border-border-machina px-2.5 py-1 font-bold">
                OSCILLOSCOPE CHANNEL: {selectedReadings.length} DATA_TX
              </span>
            }
          >
            {selectedReadings.length > 0 ? (
              <div className="space-y-6">
                {/* 1. Temp trend graph */}
                <div>
                  <span className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.15em] font-black flex items-center justify-between mb-2">
                    <span>[THERMAL OSCILLATOR CHANNEL]</span>
                    <span className="text-accent-machina">SIGNAL A - SENSOR_HEAT</span>
                  </span>
                  <div className="h-44 bg-[#0F0F0D] border-2 border-border-machina p-1 select-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={selectedReadings}
                        margin={{ top: 15, right: 15, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid stroke="#39352D" strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={(t) => t.slice(11, 16)} 
                          tick={{ fill: '#8A8175', fontSize: 8, fontFamily: 'IBM Plex Mono', fontWeight: 'bold' }}
                          stroke="#5B554A"
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fill: '#8A8175', fontSize: 8, fontFamily: 'IBM Plex Mono', fontWeight: 'bold' }}
                          stroke="#5B554A"
                        />
                        <Tooltip
                          contentStyle={{ background: 'var(--color-card-machina)', border: '1px solid var(--color-border-machina)', borderRadius: '2px', fontFamily: 'IBM Plex Mono', fontSize: '10px' }}
                          itemStyle={{ color: 'var(--color-text-primary)', textTransform: 'uppercase', fontWeight: 'bold' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="temperature" 
                          stroke="#C4A484" 
                          strokeWidth={3}
                          dot={false}
                          className="custom-animated-line"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Vibration/Pressure trend graph */}
                <div>
                  <span className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.15em] font-black flex items-center justify-between mb-2">
                    <span>[VIBRATION OSCILLATOR CHANNEL]</span>
                    <span className="text-danger-machina">SIGNAL B - MECHANICAL_SHAKE</span>
                  </span>
                  <div className="h-44 bg-[#0F0F0D] border-2 border-border-machina p-1 select-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={selectedReadings}
                        margin={{ top: 15, right: 15, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid stroke="#39352D" strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={(t) => t.slice(11, 16)} 
                          tick={{ fill: '#8A8175', fontSize: 8, fontFamily: 'IBM Plex Mono', fontWeight: 'bold' }}
                          stroke="#5B554A"
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fill: '#8A8175', fontSize: 8, fontFamily: 'IBM Plex Mono', fontWeight: 'bold' }}
                          stroke="#5B554A"
                        />
                        <Tooltip
                          contentStyle={{ background: 'var(--color-card-machina)', border: '1px solid var(--color-border-machina)', borderRadius: '2px', fontFamily: 'IBM Plex Mono', fontSize: '10px' }}
                          itemStyle={{ color: 'var(--color-text-primary)', textTransform: 'uppercase', fontWeight: 'bold' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="vibration" 
                          stroke="#A8463B" 
                          strokeWidth={3}
                          dot={false}
                          className="custom-animated-line-secondary"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs font-mono text-text-secondary select-none">
                No telemetry packet ingested for selected asset yet.
              </div>
            )}
          </IndustrialWidget>
        </div>
      </div>

      {/* Row containing Predictive Health Score and System Telemetry */}
      {(user?.role === "Admin" || user?.role === "Manager") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Card 1: Predictive Health Score */}
          <IndustrialWidget
            title="XGBOOST PREDICTIVE HEALTH BREAKDOWN"
            subtitle="Prognosis indices for top-priority machinery"
            headerAction={
              <span className="text-[9px] font-mono text-text-primary bg-bg-machina border border-border-machina px-2.5 py-1 font-bold">
                MODEL: XGBOOST_PROD_V4.2
              </span>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Recharts Radar Chart */}
              <div className="md:col-span-5 h-64 flex items-center justify-center bg-bg-machina border border-border-machina p-2">
                <ResponsiveContainer width="100%" height="105%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={priorityHealthData}>
                    <PolarGrid stroke="#39352D" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: "#8A8175", fontSize: 9, fontFamily: "IBM Plex Mono", fontWeight: 'bold' }} 
                    />
                    <Radar
                      name="Equipment Integrity"
                      dataKey="A"
                      stroke="#C4A484"
                      fill="#C4A484"
                      fillOpacity={0.15}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Right Column: Key Breakdown Progress Metrics */}
              <div className="md:col-span-7 space-y-4 font-mono text-[11px]">
                <span className="text-[9px] text-text-secondary uppercase tracking-wider block font-bold">Priority Asset Inspection Index</span>
                
                <div className="space-y-3.5">
                  {priorityHealthData.map((item) => (
                    <div key={item.id} className="space-y-1.5 border-b border-border-machina/30 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex justify-between text-xs font-sans">
                        <span className="font-black text-text-primary uppercase tracking-wider">{item.fullName.toUpperCase()}</span>
                        <span className={`font-black uppercase tracking-widest ${
                          item.score > 85 ? "text-accent-machina" :
                          item.score > 55 ? "text-warning-machina" : "text-danger-machina"
                        }`}>
                          {item.score}% HEALTH
                        </span>
                      </div>

                      {/* Progress tracking indicator rail */}
                      <div className="w-full h-2 bg-bg-machina border border-border-machina overflow-hidden rounded-none p-[1px]">
                        <div 
                          className={`h-full transition-all duration-500 rounded-none ${
                            item.score > 85 ? "bg-accent-machina" :
                            item.score > 55 ? "bg-warning-machina" : "bg-danger-machina"
                          }`}
                          style={{ width: `${item.score}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-[9px] text-text-secondary">
                        <span>RUL ESTIMATION: {item.rul} HR</span>
                        <span>FAILURE RATE: {item.prob.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </IndustrialWidget>

          {/* Card 2: System Telemetry Widget */}
          <IndustrialWidget
            title="GATE EXPANSION EDGE TELEMETRY"
            subtitle="Real-time loading of physical collectors"
            headerAction={
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[9px] font-mono text-accent-machina bg-bg-machina px-2.5 py-1 border border-border-machina font-bold">
                  SIGNAL TRACKING LIVE
                </span>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="h-44 bg-bg-machina border-2 border-border-machina p-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={telemetryHistory}
                    margin={{ top: 15, right: 15, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid stroke="#39352D" strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fill: '#8A8175', fontSize: 8, fontFamily: 'IBM Plex Mono', fontWeight: 'bold' }}
                      stroke="#5B554A"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fill: '#8A8175', fontSize: 8, fontFamily: 'IBM Plex Mono', fontWeight: 'bold' }}
                      stroke="#5B554A"
                    />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-card-machina)', border: '1px solid var(--color-border-machina)', borderRadius: '2px', fontFamily: 'IBM Plex Mono', fontSize: '10px' }}
                      itemStyle={{ color: 'var(--color-text-primary)', textTransform: 'uppercase', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cpu"
                      name="CPU CORE LOAD %"
                      stroke="#C4A484"
                      strokeWidth={3}
                      dot={false}
                      className="custom-animated-line"
                    />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      name="BUFFER RAM %"
                      stroke="#A8463B"
                      strokeWidth={3}
                      dot={false}
                      className="custom-animated-line-secondary"
                    />
                    <Line
                      type="monotone"
                      dataKey="disk"
                      name="HOT DRIVE SPACE %"
                      stroke="#8A6B3D"
                      strokeWidth={3}
                      dot={false}
                      className="custom-animated-line-tertiary"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Raw System Loadout Stats Panel */}
              <div className="grid grid-cols-3 gap-4 border-t border-border-machina pt-3 text-center">
                <div className="font-mono">
                  <span className="text-[9px] text-text-secondary uppercase block tracking-wide font-bold">CPU Core Load</span>
                  <span className="text-xl font-black text-accent-machina mt-1 block">
                    {latestTelemetry?.cpu ?? 35}%
                  </span>
                  <span className="text-[8px] text-text-secondary block mt-0.5">8x ARM Cortex v9</span>
                </div>

                <div className="font-mono">
                  <span className="text-[9px] text-text-secondary uppercase block tracking-wide font-bold">System Memory</span>
                  <span className="text-xl font-black text-danger-machina mt-1 block">
                    {latestTelemetry?.memory ?? 58}%
                  </span>
                  <span className="text-[8px] text-text-secondary block mt-0.5">16GB ECC Channel</span>
                </div>

                <div className="font-mono">
                  <span className="text-[9px] text-text-secondary uppercase block tracking-wide font-bold">Drive Hot Storage</span>
                  <span className="text-xl font-black text-text-primary mt-1 block">
                    {latestTelemetry?.disk ?? 72.4}%
                  </span>
                  <span className="text-[8px] text-text-secondary block mt-0.5">1.2TB NVMe Raid-1</span>
                </div>
              </div>
            </div>
          </IndustrialWidget>
        </div>
      )}

      {/* Departmental Workload & Attendance Metric Portal */}
      <div id="dashboard-departmental-metrics" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-2">
        {/* Widget 1: Department Total Hours Worked */}
        <IndustrialWidget
          title="TACTICAL DIVISION WORKLOAD DISTRIBUTION"
          subtitle="Aggregated industrial heavy operations hours (June 2026 Audit Period)"
        >
          <div className="p-4 bg-[#0F0F0D] border border-border-machina rounded-[2px] font-mono">
            <span className="text-[8px] text-accent-machina font-black uppercase tracking-widest block mb-4">
              // TIME MEASUREMENT METRIC: COUPLING REGISTER YIELD (HOURS)
            </span>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DEPARTMENT_DATA} margin={{ top: 10, right: 10, left: -22, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis 
                    dataKey="shortName" 
                    stroke="#555" 
                    fontSize={8.5} 
                    tickLine={false}
                    className="font-mono text-[9px] uppercase font-bold text-zinc-550"
                  />
                  <YAxis 
                    stroke="#555" 
                    fontSize={8.5} 
                    tickLine={false}
                    className="font-mono text-[9px] text-zinc-550"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#060606", borderColor: "#333", borderRadius: 1 }}
                    itemStyle={{ color: "#fff", textTransform: "uppercase", fontSize: 9.5 }}
                    labelStyle={{ color: "var(--color-accent-machina)", fontWeight: "black", fontSize: 9.5 }}
                  />
                  <Bar 
                    dataKey="totalHours" 
                    name="DIV_AGGR_HOURS" 
                    fill="#C4A484" 
                    radius={[1, 1, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </IndustrialWidget>

        {/* Widget 2: Department Average Shift Start Times */}
        <IndustrialWidget
          title="TACTICAL DIVISION MEAN ARRIVAL GATEWAY"
          subtitle="Averaged inbound operative shift check-in times (Hours past Midnight)"
        >
          <div className="p-4 bg-[#0F0F0D] border border-border-machina rounded-[2px] font-mono">
            <span className="text-[8px] text-danger-machina font-black uppercase tracking-widest block mb-4">
              // SCALING AXIS RESOLUTION: HOURS (00.00 TO 24.00 STATUS CLOCK)
            </span>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DEPARTMENT_DATA} margin={{ top: 10, right: 10, left: -22, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorAvgStart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A8463B" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#A8463B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis 
                    dataKey="shortName" 
                    stroke="#555" 
                    fontSize={8.5} 
                    tickLine={false}
                    className="font-mono text-[9px] uppercase font-bold text-zinc-550"
                  />
                  <YAxis 
                    stroke="#555" 
                    fontSize={8.5} 
                    tickLine={false}
                    domain={[0, 24]}
                    className="font-mono text-[9px] text-zinc-550"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#060606", borderColor: "#333", borderRadius: 1 }}
                    itemStyle={{ color: "#fff", textTransform: "uppercase", fontSize: 9.5 }}
                    labelStyle={{ color: "#A8463B", fontWeight: "black", fontSize: 9.5 }}
                    formatter={(value: any, name: string, props: any) => {
                      return [props.payload.avgStartLabel, "AVERAGE ENTRY CLOCK"];
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgStartHour" 
                    stroke="#A8463B" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAvgStart)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </IndustrialWidget>
      </div>

      {/* Real-time D3 Resource Utilization Monitor */}
      <ResourceUtilizationD3 />
    </div>
  );
}
