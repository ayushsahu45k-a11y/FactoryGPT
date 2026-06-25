import React, { useState } from "react";
import { useStore } from "../store/useStore";
import PermissionGuard from "./PermissionGuard";
import { Equipment } from "../types";
import { API_CLIENT } from "../lib/api";
import IndustrialWidget from "./IndustrialWidget";
import { 
  Settings, 
  Plus, 
  Database, 
  PowerOff, 
  ShieldCheck, 
  HelpCircle, 
  Sliders, 
  Trash2, 
  Volume2, 
  Lock, 
  Shield, 
  Wrench, 
  Layers, 
  Cpu, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  SlidersHorizontal, 
  Terminal,
  Activity,
  Users
} from "lucide-react";

interface TabRestrictedLockProps {
  requiredRoles: string[];
  activeRole: string;
  tabLabel: string;
}

function TabRestrictedLock({ requiredRoles, activeRole, tabLabel }: TabRestrictedLockProps) {
  return (
    <div className="p-8 border-2 border-dashed border-rose-500/25 bg-[#160a0c] rounded-[4px] text-center font-mono space-y-6 my-4 animate-fade-in select-none">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 rounded-full mb-3 animate-pulse">
          <Lock size={22} />
        </div>
        <span className="text-[11px] font-black text-rose-500 tracking-wider uppercase">
          🚨 SECURE COMPLIANCE LOCK: RESTRICTED COMMAND DECK
        </span>
        <div className="w-24 h-[1px] bg-rose-500/20 my-3" />
        <span className="text-[9px] text-zinc-400 uppercase max-w-md leading-relaxed">
          The requested subsystem <strong className="text-white">[{tabLabel}]</strong> requires higher security authorization clearance level.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto text-left bg-black/40 p-4 border border-zinc-900 rounded-[2px]">
        <div>
          <span className="text-[8px] text-zinc-500 block uppercase font-black">ACTIVE SESSION ROLE:</span>
          <span className="text-[10px] text-rose-400 font-bold uppercase">{activeRole || "VIEWER"}</span>
        </div>
        <div>
          <span className="text-[8px] text-zinc-500 block uppercase font-black">MINIMUM COMPLIANCE LEVEL:</span>
          <span className="text-[10px] text-zinc-300 font-bold uppercase">{requiredRoles.join(" / ")}</span>
        </div>
        <div className="col-span-1 md:col-span-2 mt-2 pt-2 border-t border-zinc-900/60 text-[7.5px] text-zinc-500 uppercase leading-normal">
          NOTICE: All unauthenticated attempts to bridge regulatory safety valves are logged per OSHA compliance section 1910.119 under military-grade dual-key cryptographic signatures.
        </div>
      </div>
    </div>
  );
}

export default function SettingsView() {
  const { mode, setMode, addEquipment, equipment, user, setUser, addHistory, history } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<"global" | "manager" | "admin" | "worker">("global");

  // Audit trail state
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState<"ALL" | "AUTHENTICATION" | "SYSTEM_RESET" | "WORKER_REGISTRATION" | "ALARM_CLEARANCE">("ALL");

  // Registration Form State (SYS-299)
  const [eqName, setEqName] = useState("");
  const [eqSerial, setEqSerial] = useState("");
  const [eqType, setEqType] = useState<"Turbine" | "Pump" | "Compressor" | "Generator">("Pump");
  const [eqZone, setEqZone] = useState("Alpha Complex");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Everyone / Universal Configurations
  const [sirenVolume, setSirenVolume] = useState(() => {
    return Number(localStorage.getItem("cfg_siren_volume") || "80");
  });
  const [refreshInterval, setRefreshInterval] = useState(() => {
    return Number(localStorage.getItem("cfg_refresh_interval") || "2");
  });
  const [gridOverlay, setGridOverlay] = useState(() => {
    return localStorage.getItem("cfg_grid_overlay") !== "false";
  });
  const [activeIsoStandard, setActiveIsoStandard] = useState(() => {
    return localStorage.getItem("cfg_id_standard") || "standard-imperial";
  });

  // Manager Options
  const [riskSensitivity, setRiskSensitivity] = useState(() => {
    return Number(localStorage.getItem("cfg_risk_sensitivity") || "65");
  });
  const [rulThreshold, setRulThreshold] = useState(() => {
    return Number(localStorage.getItem("cfg_rul_threshold") || "48");
  });
  const [oshaComplianceClass, setOshaComplianceClass] = useState(() => {
    return localStorage.getItem("cfg_compliance_class") || "class-I-enforcement";
  });
  const [ppeStrictEnforcement, setPpeStrictEnforcement] = useState(() => {
    return localStorage.getItem("cfg_ppe_strict_enforcement") !== "false";
  });

  // Admin Configs & Simulation variables
  const [ingressPort, setIngressPort] = useState(() => {
    return localStorage.getItem("cfg_ingress_port") || "3000";
  });
  const [ingressIp, setIngressIp] = useState(() => {
    return localStorage.getItem("cfg_ingress_ip") || "0.0.0.0";
  });
  const [tempBias, setTempBias] = useState(() => {
    return Number(localStorage.getItem("cfg_temp_bias") || "1.0");
  });
  const [vibBias, setVibBias] = useState(() => {
    return Number(localStorage.getItem("cfg_vib_bias") || "1.0");
  });
  const [pressBias, setPressBias] = useState(() => {
    return Number(localStorage.getItem("cfg_press_bias") || "1.0");
  });
  const [isFlushing, setIsFlushing] = useState(false);
  const [flushProgress, setFlushProgress] = useState(0);

  // Field Worker Operations Variables
  const [n2CoolingTarget, setN2CoolingTarget] = useState(() => {
    return Number(localStorage.getItem("cfg_n2_cooling") || "98");
  });
  const [lubricationInterval, setLubricationInterval] = useState(() => {
    return localStorage.getItem("cfg_lubrication") || "12-hours";
  });
  const [exhaustFanSpeed, setExhaustFanSpeed] = useState(() => {
    return Number(localStorage.getItem("cfg_exhaust_fan") || "80");
  });
  const [wearTearMultiplier, setWearTearMultiplier] = useState(() => {
    return Number(localStorage.getItem("cfg_wear_tear") || "1.0");
  });

  // Auto-detect newly swapped or mounted user profile & provide correct sub-tab view instantly
  React.useEffect(() => {
    if (user) {
      const role = user.role.toLowerCase();
      if (role === "admin") {
        setActiveSubTab("admin");
      } else if (role === "manager") {
        setActiveSubTab("manager");
      } else if (role === "worker") {
        setActiveSubTab("worker");
      } else {
        setActiveSubTab("global");
      }
    }
  }, [user]);

  // Handle Equipment Registration Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqName.trim() || !eqSerial.trim()) {
      alert("Please enter a valid machinery descriptor and serial code.");
      return;
    }

    setLoading(true);
    setSuccessMsg("");

    try {
      const payload: Partial<Equipment> = {
        name: eqName,
        serial_number: eqSerial,
        model_type: eqType,
        zone: eqZone,
        status: "nominal",
        install_date: new Date().toISOString()
      };

      // Create model entry
      const responseItem = await API_CLIENT.registerEquipment(payload, mode);

      // Save into our Zustand list
      addEquipment(responseItem);

      // Log administrative action
      addHistory(
        "WORKER_REGISTRATION",
        "MACHINERY ASSET REGISTERED",
        `Operator registered machinery asset '${responseItem.name}' (S/N: ${responseItem.serial_number}, Type: ${responseItem.model_type}) in ${responseItem.zone}.`
      );

      setSuccessMsg(`Asset '${responseItem.name}' joined the active factory ledger catalog.`);
      setEqName("");
      setEqSerial("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isAuthorizedSubTab = React.useMemo(() => {
    if (!user) return false;
    if (activeSubTab === "global") return true;
    if (activeSubTab === "worker") return ["worker", "manager", "admin"].includes(user.role.toLowerCase());
    if (activeSubTab === "manager") return ["manager", "admin"].includes(user.role.toLowerCase());
    if (activeSubTab === "admin") return user.role.toLowerCase() === "admin";
    return false;
  }, [user, activeSubTab]);

  return (
    <div id="settings-view-layout" className="space-y-6">
      
      {/* Banner / Current Operator Role telemetry Indicator */}
      <div className="bg-[#0b0c0e] border border-border-machina/60 p-4 rounded-[2px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent-machina/10 border border-accent-machina/30 flex items-center justify-center text-accent-machina rounded-[1px] shrink-0">
            <Shield size={16} />
          </div>
          <div>
            <span className="text-[11px] font-black text-text-primary uppercase tracking-widest block leading-none">
              SECURE WORKLOAD ACCESS PORTAL
            </span>
            <div className="text-[9px] text-text-secondary uppercase mt-1 flex items-center gap-1.5 flex-wrap">
              <span>OPERATOR: <strong className="text-white">{user?.full_name || "UNKNOWN USER"}</strong></span>
              <span>•</span>
              <span className="px-1.5 py-0.5 bg-accent-machina/10 text-accent-machina border border-accent-machina/20 font-black text-[8px] rounded-[1px]">
                {user?.role.toUpperCase() || "VIEWER"} LEVEL
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[9px] text-text-secondary bg-[#121316] px-3 py-2 border border-zinc-800 rounded-[2px]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="font-bold">STATUS: COMPLIANT</span>
          </div>
          <div className="hidden sm:block text-zinc-500">|</div>
          <div className="flex items-center gap-1.5 font-mono">
            <span>GRID: 60Hz NOMINAL</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs text-text-primary">
         
        {/* Left hand: Dynamic Settings Workloads Panel (60% equivalent) */}
        <div className="lg:col-span-7 space-y-6">
          <IndustrialWidget
            title="WORKLOAD PARAMETER CONTROL CENTER"
            subtitle="Switch active perspective logs to tune multi-role automation thresholds"
          >
            {/* Horizontal Sub-tabs selectors represent discrete panels */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-5 select-none font-mono">
              {[
                { id: "global", label: "👥 DISPLAY READINGS", color: "border-sky-500/20 hover:border-sky-500/50" },
                { id: "worker", label: "🔧 FIELD OPERATIONS", color: "border-sky-500/20 hover:border-sky-500/50", requiredRoles: ["worker", "manager", "admin"] },
                { id: "manager", label: "💼 RISK MANAGEMENT", color: "border-yellow-500/20 hover:border-yellow-500/50", requiredRoles: ["manager", "admin"] },
                { id: "admin", label: "👑 KERNEL COMMANDS", color: "border-rose-500/20 hover:border-rose-500/50", requiredRoles: ["admin"] }
              ].map((tab) => {
                const isActive = activeSubTab === tab.id;
                const isAuthorized = !tab.requiredRoles || (user && tab.requiredRoles.includes(user.role.toLowerCase()));
                
                let activeStyleState = "bg-[#0c0d0f] border-zinc-800 text-zinc-400";
                
                if (isActive) {
                  if (tab.id === "global") activeStyleState = "bg-sky-500/10 border-sky-400 text-sky-400 font-extrabold";
                  if (tab.id === "worker") activeStyleState = "bg-sky-500/10 border-sky-400 text-sky-400 font-extrabold";
                  if (tab.id === "manager") activeStyleState = "bg-yellow-500/10 border-yellow-400 text-yellow-400 font-extrabold";
                  if (tab.id === "admin") activeStyleState = "bg-rose-500/10 border-rose-400 text-rose-400 font-extrabold";
                }

                const lockedClass = !isAuthorized 
                  ? "border-dashed border-rose-950/40 text-zinc-600 bg-black/10 hover:border-rose-500/40 hover:text-rose-400/80" 
                  : "";

                return (
                  <button
                    id={`sub-settings-tab-${tab.id}`}
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`py-2 px-1 text-center text-[9px] uppercase tracking-wider font-bold transition-all cursor-pointer border rounded-[2px] flex items-center justify-center gap-1 ${activeStyleState} ${tab.color} ${lockedClass}`}
                  >
                    {!isAuthorized && <Lock size={9} className="text-rose-500/60 shrink-0 animate-pulse" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: EVERYONE / GLOBAL */}
            {activeSubTab === "global" && (
              <div id="content-subtab-global" className="space-y-4 animate-fade-in">
                <div className="bg-[#0c0d0f] p-4 border border-zinc-800 rounded-[2px] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                      🚀 DATABASE CONNECTION ADAPTER
                    </span>
                    <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 border border-sky-500/25 uppercase">ACTIVE</span>
                  </div>

                  <PermissionGuard errorMessage="AUTHORIZED CLOUD COMMAND (MANAGER/ADMIN) LEVEL SECURITY PERMIT REQUIRED TO TOGGLE API BIND">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMode("demo");
                          addHistory("SYSTEM_RESET", "OFFLINE SIMULATOR ACTIVATED", "Switched core simulation telemetry to local mathematical curves.");
                        }}
                        className={`p-4 border text-left rounded-[3px] transition-all cursor-pointer ${
                          mode === "demo"
                            ? "bg-sky-500/10 border-sky-500 text-sky-400 font-black"
                            : "bg-black/60 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider block">OFFLINE SIMULATOR</span>
                        <span className="text-[8px] text-zinc-500 block leading-normal mt-1.5 uppercase font-medium">
                          Runs high-fidelity standalone predictive simulation sandbox.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMode("connected");
                          addHistory("SYSTEM_RESET", "CONNECTED API DRIVER STAGED", "Established live ingress connections through proxy routers.");
                        }}
                        className={`p-4 border text-left rounded-[3px] transition-all cursor-pointer ${
                          mode === "connected"
                            ? "bg-sky-500/10 border-sky-500 text-sky-400 font-black"
                            : "bg-black/60 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider block">CONNECTED API DRIVER</span>
                        <span className="text-[8px] text-zinc-500 block leading-normal mt-1.5 uppercase font-medium">
                          Queries live FastAPI microservices directly with fail-safe database recovery.
                        </span>
                      </button>
                    </div>
                  </PermissionGuard>
                </div>

                <div className="bg-[#0b0c0e] p-4 border border-zinc-800 rounded-[2px] space-y-4 font-sans">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest block mb-2">🔊 AUDIOTEK SOUND & GRID TELEMETRY</span>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[9px] text-zinc-400 uppercase font-bold mb-1.5">
                        <span>🔊 Simulated Emergency Sirens volume level</span>
                        <span className="text-white font-black">{sirenVolume}% ENFORCEMENT</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={sirenVolume}
                        onChange={(e) => {
                          setSirenVolume(Number(e.target.value));
                          localStorage.setItem("cfg_siren_volume", e.target.value);
                        }}
                        className="w-full accent-sky-400 bg-zinc-800 h-1 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] text-zinc-400 uppercase font-bold mb-1.5">
                        <span>⏱️ Live Telemetry scan refresh interval</span>
                        <span className="text-white font-black">{refreshInterval} Seconds</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="10"
                        value={refreshInterval}
                        onChange={(e) => {
                          setRefreshInterval(Number(e.target.value));
                          localStorage.setItem("cfg_refresh_interval", e.target.value);
                        }}
                        className="w-full accent-sky-400 bg-zinc-800 h-1 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[8px] uppercase tracking-wider text-zinc-400 mb-1 font-bold">🗺️ GRID WIRE CONDUITS OVERLAY</label>
                        <select
                          value={gridOverlay ? "true" : "false"}
                          onChange={(e) => {
                            const val = e.target.value === "true";
                            setGridOverlay(val);
                            localStorage.setItem("cfg_grid_overlay", String(val));
                          }}
                          className="w-full bg-black border border-zinc-800 px-2.5 py-1.5 text-[10px] text-zinc-300 font-medium rounded-[2px] uppercase outline-none focus:border-accent-machina"
                        >
                          <option value="true">RENDER WIREFRAME OVERLAYS</option>
                          <option value="false">DEPOWER OVERLAYS (ECO MODE)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8px] uppercase tracking-wider text-zinc-400 mb-1 font-bold">📏 COUPLING METRIC SYSTEM</label>
                        <select
                          value={activeIsoStandard}
                          onChange={(e) => {
                            setActiveIsoStandard(e.target.value);
                            localStorage.setItem("cfg_id_standard", e.target.value);
                          }}
                          className="w-full bg-black border border-zinc-800 px-2.5 py-1.5 text-[10px] text-zinc-300 font-medium rounded-[2px] uppercase outline-none focus:border-accent-machina"
                        >
                          <option value="standard-imperial">IMPERIAL ANXI (US DEFAULT)</option>
                          <option value="standard-si">SI STANDARDS (ISO-14001)</option>
                          <option value="standard-military">MIL-SPEC TELEMETRY OVERRIDE</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    addHistory("SYSTEM_RESET", "UNIVERSAL CONDITIONS SECURED", `Saved universal parameters: Refresh=${refreshInterval}s, Volume=${sirenVolume}%, Metrics=${activeIsoStandard.toUpperCase()}.`);
                    alert("SYS CONFIRMATION: UNIVERSAL CORE PARAMETERS SECURED IN LOCAL MEMORY");
                  }}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-[9.5px] uppercase tracking-widest rounded-[3px] cursor-pointer"
                >
                  💾 SECURE UNIVERSAL RUNTIME PARAMS
                </button>
              </div>
            )}

            {/* TAB CONTENT: MANAGER (PREDICTIVE CORE WORKLOAD) */}
            {activeSubTab === "manager" && (
              <div id="content-subtab-manager" className="space-y-4 animate-fade-in font-mono">
                {!isAuthorizedSubTab ? (
                  <TabRestrictedLock 
                    requiredRoles={["Manager", "Admin"]} 
                    activeRole={user?.role || "Viewer"} 
                    tabLabel="Risk Management" 
                  />
                ) : (
                  <>
                    <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-[3px] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                          📊 XGBOOST AI RISK & THRESHOLD OPTIMIZER
                        </span>
                        <span className="text-[8px] font-mono font-bold bg-yellow-500/10 px-1.5 py-0.5 border border-yellow-500/25 text-yellow-400">ML-PROG</span>
                      </div>

                      <div className="space-y-4 font-sans">
                        <div>
                          <div className="flex justify-between text-[9px] text-zinc-400 uppercase font-bold mb-1.5">
                            <span>⚠️ XGBoost Anomaly Alarm Sensitivity limit</span>
                            <span className="text-yellow-400 font-black">{riskSensitivity}% Prob.</span>
                          </div>
                          <input 
                            type="range"
                            min="10"
                            max="95"
                            value={riskSensitivity}
                            onChange={(e) => {
                              setRiskSensitivity(Number(e.target.value));
                              localStorage.setItem("cfg_risk_sensitivity", e.target.value);
                            }}
                            className="w-full accent-yellow-400 bg-zinc-800 h-1 cursor-pointer"
                          />
                          <span className="text-[8px] text-zinc-500 mt-1 block uppercase">Configures failure likelihood threshold before automated safety incident reports are spawned.</span>
                        </div>

                        <div>
                          <div className="flex justify-between text-[9px] text-zinc-400 uppercase font-bold mb-1.5">
                            <span>⏱️ Min Estimated Remaining Useful Life (RUL) alert threshold</span>
                            <span className="text-white font-black">{rulThreshold} Hours</span>
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="number"
                              value={rulThreshold}
                              onChange={(e) => {
                                setRulThreshold(Number(e.target.value));
                                localStorage.setItem("cfg_rul_threshold", e.target.value);
                              }}
                              className="w-24 bg-black border border-zinc-800 px-2.5 py-1 text-xs text-white uppercase outline-none focus:border-yellow-400 font-bold font-mono"
                              min="12"
                              max="240"
                            />
                            <span className="text-[8px] text-zinc-500 flex items-center leading-normal uppercase">
                              Triggers urgent task alerts to response units when components fall beneath the hour baseline.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0b0c0e] p-4 border border-zinc-800 rounded-[2px] space-y-4 font-sans">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest block">📋 COMPLIANCE REGULATORS & SHIFT LAWS</span>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-zinc-400 mb-1 font-bold">⚖️ AUDITING ACCREDITATION FRAMEWORK</label>
                          <select
                            value={oshaComplianceClass}
                            onChange={(e) => {
                              setOshaComplianceClass(e.target.value);
                              localStorage.setItem("cfg_compliance_class", e.target.value);
                            }}
                            className="w-full bg-black border border-zinc-800 px-2.5 py-1.5 text-[10px] text-zinc-300 font-medium rounded-[2px] uppercase outline-none focus:border-yellow-400"
                          >
                            <option value="class-I-enforcement">OSHA Class I Standard (Hazmat Core Containment)</option>
                            <option value="class-II-enforcement">OSHA Class II Standard (Vented Ventilation Deck)</option>
                            <option value="class-III-enforcement">ISO 14001 Audit Directive (Low-Emission Benchmark)</option>
                          </select>
                        </div>

                        <div className="flex items-start gap-3 bg-black/60 p-3 border border-zinc-900 rounded-[2px] mt-2">
                          <input 
                            type="checkbox"
                            id="strict-ppe-mode"
                            checked={ppeStrictEnforcement}
                            onChange={(e) => {
                              setPpeStrictEnforcement(e.target.checked);
                              localStorage.setItem("cfg_ppe_strict_enforcement", String(e.target.checked));
                            }}
                            className="w-3.5 h-3.5 bg-black border border-zinc-800 accent-yellow-400 rounded-[2px] cursor-pointer mt-0.5"
                          />
                          <div>
                            <label htmlFor="strict-ppe-mode" className="block text-[9.5px] uppercase font-bold text-zinc-300 cursor-pointer">
                              Enforce Computer Vision PPE Scans
                            </label>
                            <span className="text-[8px] text-zinc-500 block leading-normal uppercase mt-0.5">
                              Strict requirement: Deny on-duty punches if helmet or glove sensors fail instant visual checks.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addHistory("SYSTEM_RESET", "MANAGER CONSTRAINTS APPLIED", `Saved manager workload preferences: Sensitivity=${riskSensitivity}%, RUL=${rulThreshold}h, PPE Scan=${ppeStrictEnforcement ? 'STRICT' : 'PERMISSIVE'}.`);
                        alert("MANAGER SECURE PARAMS: XGBOOST RISK BARRIERS AND COMPLIANCE RULES REGISTERED");
                      }}
                      className="w-full py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 font-black text-[9.5px] uppercase tracking-widest rounded-[3px] cursor-pointer transition-colors"
                    >
                      💾 WRITE MANAGER COMPLIANCE PARAMS
                    </button>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: ADMIN (ROOT SYSTEM COMMANDS) */}
            {activeSubTab === "admin" && (
              <div id="content-subtab-admin" className="space-y-4 animate-fade-in font-mono">
                {!isAuthorizedSubTab ? (
                  <TabRestrictedLock 
                    requiredRoles={["Admin"]} 
                    activeRole={user?.role || "Viewer"} 
                    tabLabel="Kernel Commands" 
                  />
                ) : (
                  <>
                    <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-[3px] space-y-4 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                          👑 CORE KERNEL SERVICE PORT INGRESS
                        </span>
                        <span className="text-[8.5px] font-mono font-bold bg-rose-500/10 px-1 py-0.5 border border-rose-500/25 text-rose-400">ROOT-ADMIN</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[8px] text-zinc-400 font-bold uppercase mb-1">SYSTEM PORT INGRESS BIND</label>
                          <input 
                            type="text"
                            value={ingressPort}
                            onChange={(e) => {
                              setIngressPort(e.target.value);
                              localStorage.setItem("cfg_ingress_port", e.target.value);
                            }}
                            className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs text-white font-mono font-bold uppercase rounded-[2px]"
                            placeholder="3000"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] text-zinc-400 font-bold uppercase mb-1">INGRESS HOST IP</label>
                          <input 
                            type="text"
                            value={ingressIp}
                            onChange={(e) => {
                              setIngressIp(e.target.value);
                              localStorage.setItem("cfg_ingress_ip", e.target.value);
                            }}
                            className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs text-white font-mono font-bold uppercase rounded-[2px]"
                            placeholder="0.0.0.0"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          addHistory("SYSTEM_RESET", "KERNEL PORT INGRESS MOUNTED", `Re-routed core kernel service port ingress to bind on Host ${ingressIp} via port ${ingressPort}.`);
                          alert("SYS CONFIRMATION: KERNEL BINDINGS COMMITTED TO SECURITY LEDGER");
                        }}
                        className="w-full py-2 bg-[#1c0e10] hover:bg-[#2c1518] border border-rose-500/20 text-rose-400 font-black text-[9px] uppercase tracking-widest rounded-[2px] cursor-pointer mt-2"
                      >
                        💾 SAVE KERNEL BINDINGS
                      </button>
                    </div>

                    <div className="bg-[#0b0c0e] p-4 border border-zinc-800 rounded-[2px] space-y-4 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">📦 INTEGRATION BUFFER PURGER</span>
                        <span className="text-[8.5px] text-zinc-500 font-mono">DUMP-SECTOR-RECOVERY</span>
                      </div>

                      <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-[2px] space-y-3.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-400 font-bold uppercase">📊 ACTIVE TELEMETRY PACKETS IN MEMORY:</span>
                          <span className="font-mono text-cyan-400 font-black tracking-widest">{isFlushing ? 0 : 512} PKTS</span>
                        </div>
                        
                        {isFlushing ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-zinc-400">
                              <span>🗑️ ERASING MEMORY BANK BUFFER SYSTEM...</span>
                              <span className="font-mono text-rose-400 text-[9px] font-black">{flushProgress}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                              <div className="bg-[#00f0ff] h-full transition-all duration-75" style={{ width: `${flushProgress}%` }}></div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setIsFlushing(true);
                              setFlushProgress(0);
                              const interval = setInterval(() => {
                                setFlushProgress((p) => {
                                  if (p >= 100) {
                                    clearInterval(interval);
                                    setIsFlushing(false);
                                    addHistory("SYSTEM_RESET", "CORE TELEMETRY BUFFER FLUSHED", `SecOps Admin initiated forceful buffer wipe clearing 512 packages from base ingress port ${ingressPort}.`);
                                    alert("ROOT HANDSHAKE OK: TELEMETRY CONTAINER BUFFER WAS CLEARED AND RESET");
                                    return 100;
                                  }
                                  return p + 5;
                                });
                              }, 80);
                            }}
                            className="w-full py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-black text-[9.5px] uppercase tracking-widest rounded-[3px] transition-all cursor-pointer"
                          >
                            🗑️ FORCE FLUSH CACHED TELEMETRY MEMORY
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#0b0c0e] p-4 border border-zinc-800 rounded-[2px] space-y-4 font-sans">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest block">🔮 SHAP PREDICTIVE MATHEMATICS COEFFICIENTS BIAS</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between text-[9px] text-zinc-400 uppercase font-bold mb-1.5">
                            <span>🔥 Temp bias</span>
                            <span className="text-white font-mono font-bold">{tempBias}x</span>
                          </div>
                          <input 
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={tempBias}
                            onChange={(e) => {
                              setTempBias(Number(e.target.value));
                              localStorage.setItem("cfg_temp_bias", e.target.value);
                            }}
                            className="w-full accent-rose-500 bg-zinc-800 h-1 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[9px] text-zinc-400 uppercase font-bold mb-1.5">
                            <span>📊 Vib bias</span>
                            <span className="text-white font-mono font-bold">{vibBias}x</span>
                          </div>
                          <input 
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={vibBias}
                            onChange={(e) => {
                              setVibBias(Number(e.target.value));
                              localStorage.setItem("cfg_vib_bias", e.target.value);
                            }}
                            className="w-full accent-rose-500 bg-zinc-800 h-1 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[9px] text-zinc-400 uppercase font-bold mb-1.5">
                            <span>💨 Vent bias</span>
                            <span className="text-white font-mono font-bold">{pressBias}x</span>
                          </div>
                          <input 
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={pressBias}
                            onChange={(e) => {
                              setPressBias(Number(e.target.value));
                              localStorage.setItem("cfg_press_bias", e.target.value);
                            }}
                            className="w-full accent-rose-500 bg-zinc-800 h-1 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addHistory("SYSTEM_RESET", "ROOT COEFFICIENTS REGISTERED", `Committed system bias configuration weights: Temp=${tempBias}x, Vib=${vibBias}x, Vent=${pressBias}x.`);
                        alert("ADMIN COMMAND: RE-CALIBRATED SHAP MODEL COMPILER SUCCESSFUL");
                      }}
                      className="w-full py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-black text-[9.5px] uppercase tracking-widest rounded-[3px] cursor-pointer transition-colors"
                    >
                      💾 COMMIT ROOT CALIBRATION OVERRIDES
                    </button>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT: WORKER (FIELD OPERATIONS WORKLOAD) */}
            {activeSubTab === "worker" && (
              <div id="content-subtab-worker" className="space-y-4 animate-fade-in font-mono">
                {!isAuthorizedSubTab ? (
                  <TabRestrictedLock 
                    requiredRoles={["Worker", "Manager", "Admin"]} 
                    activeRole={user?.role || "Viewer"} 
                    tabLabel="Field Operations" 
                  />
                ) : (
                  <>
                    <div className="bg-sky-500/5 border border-sky-500/20 p-4 rounded-[3px] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                          ❄️ COOLING CYCLES & CRYO LOOP TARGETS
                        </span>
                        <span className="text-[8.5px] font-mono font-bold bg-sky-500/10 px-1.5 py-0.5 border border-sky-500/25 text-sky-400">FLD-VALVES</span>
                      </div>

                      <div className="space-y-4 font-sans">
                        <div>
                          <div className="flex justify-between text-[9px] text-zinc-400 uppercase font-bold mb-1.5">
                            <span>🧪 Cryogenic Cooling Loop N2 Target level</span>
                            <span className="text-sky-400 font-black">{n2CoolingTarget}% Saturated Capacity</span>
                          </div>
                          <input 
                            type="range"
                            min="50"
                            max="100"
                            value={n2CoolingTarget}
                            onChange={(e) => {
                              setN2CoolingTarget(Number(e.target.value));
                              localStorage.setItem("cfg_n2_cooling", e.target.value);
                            }}
                            className="w-full accent-sky-400 bg-zinc-800 h-1 cursor-pointer"
                          />
                          <span className="text-[8px] text-zinc-500 mt-1 block uppercase">Optimizes the cryogenic refrigeration baseline parameters to avoid high-temperature core warnings.</span>
                        </div>

                        <div>
                          <div className="flex justify-between text-[9px] text-zinc-400 uppercase font-bold mb-1.5">
                            <span>💨 Vent Exhaust Fan air flow speed rate</span>
                            <span className="text-white font-black">{exhaustFanSpeed}% Capacity</span>
                          </div>
                          <input 
                            type="range"
                            min="20"
                            max="100"
                            value={exhaustFanSpeed}
                            onChange={(e) => {
                              setExhaustFanSpeed(Number(e.target.value));
                              localStorage.setItem("cfg_exhaust_fan", e.target.value);
                            }}
                            className="w-full accent-sky-400 bg-zinc-800 h-1 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0b0c0e] p-4 border border-zinc-800 rounded-[2px] space-y-4 font-sans">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest block">🔩 PREVENTIVE MECHANICAL INTERVAL SCHEDULES</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[8px] text-zinc-400 mb-1.5 font-bold uppercase">🔩 Gasket Lubrication checklists schedule</label>
                          <select
                            value={lubricationInterval}
                            onChange={(e) => {
                              setLubricationInterval(e.target.value);
                              localStorage.setItem("cfg_lubrication", e.target.value);
                            }}
                            className="w-full bg-black border border-zinc-800 px-2.5 py-1.5 text-[10px] text-zinc-300 font-medium rounded-[2px] uppercase outline-none focus:border-sky-400"
                          >
                            <option value="6-hours">EVERY 6 HOURS (CRITICAL OPERATION)</option>
                            <option value="12-hours">EVERY 12 HOURS (STANDARD SHIFT)</option>
                            <option value="24-hours">EVERY 24 HOURS (DAILY CHECKLOG)</option>
                            <option value="weekly">ONCE PER WEEK (AUDIT SCHEDULE)</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex justify-between text-[9px] text-zinc-400 uppercase font-bold mb-1">
                            <span>🛠️ Ambient Dust Friction coefficient</span>
                            <span className="text-white font-mono font-bold">{wearTearMultiplier}x factor</span>
                          </div>
                          <input 
                            type="range"
                            min="0.1"
                            max="3.0"
                            step="0.1"
                            value={wearTearMultiplier}
                            onChange={(e) => {
                              setWearTearMultiplier(Number(e.target.value));
                              localStorage.setItem("cfg_wear_tear", e.target.value);
                            }}
                            className="w-full accent-sky-400 bg-zinc-800 h-1 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addHistory("SYSTEM_RESET", "FIELD SCHEDULES COMMIT", `Saved field operations settings: N2 saturation=${n2CoolingTarget}%, Fan speed=${exhaustFanSpeed}%, lube_schedule=${lubricationInterval}, friction_ratio=${wearTearMultiplier}x.`);
                        alert("FIELD COMPRESSED SEC Ops: PREVENTIVE MAINTENANCE ROSTER CONFIRMED");
                      }}
                      className="w-full py-2.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 font-black text-[9.5px] uppercase tracking-widest rounded-[3px] cursor-pointer transition-colors"
                    >
                      💾 WRITE FIELD OPERATIVE INTERVALS
                    </button>
                  </>
                )}
              </div>
            )}
          </IndustrialWidget>
        </div>

        {/* Right hand: Connections indicators and register machinery form widget (40% equivalent) */}
        <div className="lg:col-span-5 space-y-6">
          <IndustrialWidget
            title="DATABASE INTEGRATION HANDLER"
            subtitle="Coordinate API routing limits & environment indicators"
          >
            {/* Connection Status Parameters */}
            <div className="space-y-4">
              <div className="bg-card-machina border border-border-machina/60 p-4 leading-relaxed text-[10px] text-text-secondary font-mono space-y-2 rounded-[3px]">
                <div className="flex justify-between font-bold uppercase">
                  <span>SYSTEM PORT INGRESS BOUND</span>
                  <span className="text-text-primary font-black">{ingressPort}</span>
                </div>
                <div className="flex justify-between font-bold uppercase">
                  <span>INGRESS ROUTING BIND</span>
                  <span className="text-text-primary font-black">{ingressIp}</span>
                </div>
                <div className="flex justify-between font-bold uppercase">
                  <span>BACKEND ACCESS BASE URL</span>
                  <span className="text-text-primary font-black">/api/v1/*</span>
                </div>
                <div className="flex justify-between font-bold uppercase">
                  <span>ACTIVE MACHINE INVENTORY</span>
                  <span className="text-text-primary font-black">{equipment.length} UNITS LOGGED</span>
                </div>
              </div>
            </div>
          </IndustrialWidget>

          <IndustrialWidget
            title="LEGAL & COMPLIANCE REGISTRY"
            subtitle="Review regulatory policies & consent preferences"
          >
            <div className="space-y-3 font-mono">
              <p className="text-[10px] text-text-secondary leading-normal mb-2 uppercase font-bold">
                Verification logs for GDPR Article 6 & OSHA standard 1910 rules. Click any ledger to inspect compliance bounds.
              </p>
              
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("factorygpt-open-privacy"))}
                className="w-full text-left bg-zinc-950 hover:bg-zinc-900 border border-border-machina p-3 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] text-text-primary font-black block uppercase">
                    🔒 PRIVACY POLICY DISCLOSURE
                  </span>
                  <span className="text-[8px] text-zinc-500 block uppercase">
                    STATUS: COMPLIANT (SOP-PP-9001)
                  </span>
                </div>
                <span className="text-[9px] text-accent-machina font-bold">VIEW LEDGER →</span>
              </button>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("factorygpt-open-terms"))}
                className="w-full text-left bg-zinc-950 hover:bg-zinc-900 border border-border-machina p-3 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] text-text-primary font-black block uppercase">
                    ⚖️ TERMS OF SERVICE (T&C)
                  </span>
                  <span className="text-[8px] text-zinc-500 block uppercase">
                    STATUS: ACTIVE (SOP-TOS-1910)
                  </span>
                </div>
                <span className="text-[9px] text-accent-machina font-bold">VIEW LEDGER →</span>
              </button>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("factorygpt-open-preferences"))}
                className="w-full text-left bg-zinc-950 hover:bg-zinc-900 border border-border-machina p-3 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] text-text-primary font-black block uppercase">
                    🍪 COOKIE & TELEMETRY PREFERENCES
                  </span>
                  <span className="text-[8px] text-zinc-500 block uppercase">
                    STATUS: CONFIGURED (GDPR-EU)
                  </span>
                </div>
                <span className="text-[9px] text-accent-machina font-bold">MANAGE →</span>
              </button>
            </div>
          </IndustrialWidget>

          <IndustrialWidget
            title="REGISTER NEW MACHINERY ASSET"
            subtitle="Inject a brand-new mechanical asset into the active operations grid"
          >
            {successMsg && (
              <div className="mb-4 bg-card-machina border border-accent-machina text-accent-machina p-3 text-[10.5px] font-bold uppercase flex gap-2 items-center rounded-[3px]">
                <ShieldCheck size={14} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <PermissionGuard inline={true} errorMessage="AUTHORIZED MASTER REGISTER (MANAGER/ADMIN) PRIVILEGE CARD REQUIRED TO COMMIT ASSETS">
              <form onSubmit={handleRegister} className="space-y-4 font-mono">
                <div>
                  <label className="block text-[10px] uppercase text-text-secondary mb-1.5 font-bold">
                    Machinery Name Descriptor
                  </label>
                  <input
                    id="input-new-eq-name"
                    type="text"
                    value={eqName}
                    onChange={(e) => setEqName(e.target.value)}
                    className="w-full bg-card-machina border border-border-machina px-3 py-2 text-xs text-text-primary placeholder-text-secondary/60 focus:border-accent-machina focus:outline-none uppercase font-bold"
                    placeholder="e.g. Centrifugal Fan 03"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-text-secondary mb-1.5 font-bold">
                      Serial Identifier
                    </label>
                    <input
                      id="input-new-eq-serial"
                      type="text"
                      value={eqSerial}
                      onChange={(e) => setEqSerial(e.target.value)}
                      className="w-full bg-card-machina border border-border-machina px-3 py-2 text-xs text-text-primary placeholder-text-secondary/60 focus:border-accent-machina focus:outline-none uppercase font-bold"
                      placeholder="e.g. FAN-404-TR"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-text-secondary mb-1.5 font-bold">
                      Model Classification
                    </label>
                    <select
                      id="select-new-eq-type"
                      value={eqType}
                      onChange={(e) => setEqType(e.target.value as any)}
                      className="w-full bg-card-machina border border-border-machina px-3 py-2 text-xs text-text-primary focus:border-accent-machina focus:outline-none uppercase font-bold cursor-pointer"
                    >
                      <option value="Turbine">Turbine Engine</option>
                      <option value="Pump">Hydraulic Pump</option>
                      <option value="Compressor">Gas Compressor</option>
                      <option value="Generator">Dynamo Generator</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-text-secondary mb-1.5 font-bold">
                    Facility Installation Zone
                  </label>
                  <select
                    id="select-new-eq-zone"
                    value={eqZone}
                    onChange={(e) => setEqZone(e.target.value)}
                    className="w-full bg-card-machina border border-border-machina px-3 py-2 text-xs text-text-primary focus:border-accent-machina focus:outline-none uppercase font-bold cursor-pointer"
                  >
                    <option value="Alpha Complex">Alpha Complex (Main Deck)</option>
                    <option value="Beta Assembly Hall">Beta Assembly Hall (Secondary Hub)</option>
                    <option value="Gamma Storage Area">Gamma Storage Area (Silos)</option>
                    <option value="Power Unit E">Power Unit E (Generators Cage)</option>
                  </select>
                </div>

                <button
                  id="btn-submit-asset-reg"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-accent-machina hover:bg-white text-bg-machina hover:text-bg-machina font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer mt-4 transition-none"
                >
                  <Plus size={14} />
                  {loading ? "REGISTERING ASSET..." : "COMMIT ASSET TO ACTIVE LEDGER"}
                </button>
              </form>
            </PermissionGuard>
          </IndustrialWidget>
        </div>

      </div>

      {/* --- AUDIT TRAIL TELEMETRY --- */}
      <div id="audit-trail-telemetry-panel" className="mt-6">
        {!(user?.role === "Admin" || user?.role === "Manager") ? (
          <TabRestrictedLock
            requiredRoles={["Manager", "Admin"]}
            activeRole={user?.role || "Viewer"}
            tabLabel="OPERATIONAL AUDIT TRAIL & SYSTEM COMPLIANCE REGISTER"
          />
        ) : (
          <IndustrialWidget
            title="OPERATIONAL AUDIT TRAIL & SYSTEM COMPLIANCE REGISTER"
            subtitle="Chronological sequence tracking operative logins, administrative parameter shifts, and asset registry adjustments."
          >
          {/* Controls: Filter and Search */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-4 font-mono select-none">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="SEARCH OPERATOR, ROLE, OR TRANSACTION KEY..."
                className="w-full bg-black border border-border-machina px-3 py-1.5 pl-8 text-[10px] text-text-primary placeholder-text-secondary/60 focus:border-accent-machina focus:outline-none uppercase font-bold"
              />
              <span className="absolute left-2.5 top-2.2 text-zinc-500 text-[10px] font-bold">//</span>
            </div>

            {/* Filter buttons */}
            <div className="flex bg-[#0d0d0b] border border-border-machina/60 p-0.5 rounded-[1.5px] text-[8px] font-black uppercase overflow-x-auto">
              {[
                { id: "ALL", label: "ALL AUDITS" },
                { id: "AUTHENTICATION", label: "LOGINS" },
                { id: "SYSTEM_RESET", label: "CONFIG SHIFTS" },
                { id: "WORKER_REGISTRATION", label: "ASSET SHIFTS" },
                { id: "ALARM_CLEARANCE", label: "ALARM CLEARS" }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setAuditFilter(btn.id as any)}
                  className={`px-2.5 py-1 cursor-pointer rounded-[1px] whitespace-nowrap ${
                    auditFilter === btn.id
                      ? "bg-accent-machina text-bg-machina font-black"
                      : "text-text-secondary hover:text-text-primary hover:bg-zinc-900/40"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table container */}
          <div className="border border-border-machina/50 bg-[#080807] rounded-[2px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="border-b border-border-machina bg-black/80 text-[8.5px] text-text-secondary uppercase select-none font-black tracking-wider">
                    <th className="p-3 pl-4 w-[150px]">TIMESTAMP</th>
                    <th className="p-3 w-[150px]">OPERATOR / EMAIL</th>
                    <th className="p-3 w-[100px]">CLEARANCE</th>
                    <th className="p-3 w-[150px]">CATEGORY / KEY</th>
                    <th className="p-3">TRANSACTION LOG</th>
                  </tr>
                </thead>
                <tbody className="text-[9.5px]">
                  {(() => {
                    const auditLogs = (history || []).filter((h) => {
                      const isRelevant = ["AUTHENTICATION", "SYSTEM_RESET", "WORKER_REGISTRATION", "ALARM_CLEARANCE"].includes(h.category);
                      if (!isRelevant) return false;

                      if (auditFilter !== "ALL" && h.category !== auditFilter) return false;

                      if (auditSearch.trim()) {
                        const query = auditSearch.toLowerCase();
                        return (
                          h.title.toLowerCase().includes(query) ||
                          h.description.toLowerCase().includes(query) ||
                          h.userEmail.toLowerCase().includes(query) ||
                          h.workerName.toLowerCase().includes(query) ||
                          h.role.toLowerCase().includes(query)
                        );
                      }
                      return true;
                    });

                    if (auditLogs.length > 0) {
                      return auditLogs.map((log, idx) => {
                        let badgeColor = "bg-zinc-900 text-zinc-400 border-zinc-800";
                        if (log.category === "AUTHENTICATION") {
                          badgeColor = "bg-emerald-950/50 text-emerald-400 border-emerald-900/60";
                        } else if (log.category === "SYSTEM_RESET") {
                          badgeColor = "bg-rose-950/50 text-rose-400 border-rose-900/60";
                        } else if (log.category === "WORKER_REGISTRATION") {
                          badgeColor = "bg-sky-950/50 text-sky-400 border-sky-900/60";
                        } else if (log.category === "ALARM_CLEARANCE") {
                          badgeColor = "bg-amber-950/50 text-amber-400 border-amber-900/60";
                        }

                        return (
                          <tr 
                            key={log.id} 
                            className={`border-b border-border-machina/20 hover:bg-zinc-900/25 transition-colors ${
                              idx % 2 === 0 ? "bg-[#0b0b0a]/70" : "bg-black/30"
                            }`}
                          >
                            <td className="p-3 pl-4 text-zinc-500 font-bold whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })}
                            </td>
                            <td className="p-3">
                              <span className="text-text-primary block font-black uppercase truncate max-w-[140px]">{log.workerName}</span>
                              <span className="text-zinc-500 block text-[8px] truncate max-w-[140px]">{log.userEmail}</span>
                            </td>
                            <td className="p-3">
                              <span className="px-1.5 py-0.5 border border-zinc-800/80 bg-zinc-900/40 text-zinc-300 font-black rounded-[1px] text-[7.5px] uppercase">
                                {log.role}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 border rounded-[1px] font-black text-[7.5px] uppercase ${badgeColor}`}>
                                {log.category.replace("_", " ")}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-text-primary font-bold block uppercase text-[10px] leading-snug">{log.title}</span>
                              <span className="text-text-secondary block text-[9px] leading-normal mt-0.5">{log.description}</span>
                            </td>
                          </tr>
                        );
                      });
                    } else {
                      return (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-zinc-600 uppercase text-[9px] leading-relaxed">
                            No operational transaction logs found matching criteria.<br/>
                            <span className="text-accent-machina block mt-1 font-black">[ Secure local register with nominal telemetry state ]</span>
                          </td>
                        </tr>
                      );
                    }
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </IndustrialWidget>
        )}
      </div>

    </div>
  );
}
