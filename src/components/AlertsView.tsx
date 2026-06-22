import React from "react";
import { useStore } from "../store/useStore";
import IndustrialWidget from "./IndustrialWidget";
import { AlertTriangle, Clock, ShieldAlert, Cpu, Check } from "lucide-react";
import IronNutButton from "./IronNutButton";

const RESOLUTION_PLAYBOOKS: Record<string, string[]> = {
  "PPE Breach": [
    "Verify worker PPE (Helmet, face-shield thermal insulation, suit, insulated gloves).",
    "Deploy immediate audio voice enforcer cascade to check on-site compliance.",
    "Reject entry gates and issue alert correction ticket to plant floor marshal."
  ],
  "Thermal Break": [
    "Activate automated coolant auxiliary pumps and grease packing couplers.",
    "Reroute live pressure pipelines to backup heat condensing corridors.",
    "Inspect thermographic optical sensors in mechanical coupling grids."
  ],
  "Gas Leak": [
    "Spin up ventilation extraction fans to extreme static boost (800 RPM).",
    "Inspect containment seal gaskets using portable ultrasonic probes.",
    "Evacuate Zone Alpha immediately if ambient hazardous leak is unacknowledged."
  ],
  "Voltage Sag": [
    "Synchronize backup diesel generators and match critical load limits.",
    "Verify main capacitor insulation status and register static backup power lines."
  ]
};

export default function AlertsView() {
  const { incidents, acknowledgeIncident } = useStore();
  const [completedSteps, setCompletedSteps] = React.useState<Record<string, boolean>>({});

  const toggleStep = (incidentId: string, stepIdx: number) => {
    const key = `${incidentId}-${stepIdx}`;
    setCompletedSteps(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const pending = incidents.filter(x => !x.acknowledged);
  const resolved = incidents.filter(x => x.acknowledged);

  return (
    <div id="alerts-view-layout" className="space-y-6">
      
      {/* Celery worker monitor header strip */}
      <div className="bg-card-machina border border-border-machina p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-mono text-xs rounded-[3px] select-none relative">
        <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
        <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
        <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>

        <div className="flex gap-3 items-center pl-2">
          <Cpu className="text-accent-machina animate-pulse-slow" size={16} />
          <div>
            <span className="text-text-primary block font-black uppercase tracking-wider">CELERY DATA BROKER STATUS: MAIN_ACTIVE</span>
            <span className="text-[10px] text-text-secondary font-bold uppercase mt-0.5 block">AUTO-ACK: ENFORCED | PREFETCH MULTIPLIER: 01 | REDIS CONTAINER BOUND</span>
          </div>
        </div>

        <div className="flex gap-4 text-[10px] text-text-secondary border-l border-border-machina pl-4 font-bold uppercase">
          <div>
            <span className="text-text-secondary block uppercase">RESPONSE CASCADE QUEUE</span>
            <span className="text-text-primary font-bold">predictive_alert_cascade</span>
          </div>
          <div>
            <span className="text-text-secondary block uppercase">WORKER THREAD CONCURRENCY</span>
            <span className="text-text-primary font-bold">04 THREADS SYNCED</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Active Alarms list */}
        <IndustrialWidget
          title={`ACTIVE INDUSTRIAL ALARMS (${pending.length})`}
          subtitle="Real-time mechanical stress & security breaches requiring human dispatcher code"
        >
          {pending.length > 0 ? (
            <div className="space-y-3 font-mono">
              {pending.map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 bg-bg-machina border border-danger-machina text-xs font-mono relative rounded-[3px]"
                >
                  <div className="flex justify-between items-center mb-1.5 font-bold">
                    <span className="text-danger-machina font-black uppercase tracking-wider flex items-center gap-1.5 text-xs">
                      <ShieldAlert size={12} />
                      {inc.category} — {inc.level.toUpperCase()}
                    </span>
                    <span className="text-text-secondary">{inc.timestamp.slice(11, 19)} Z</span>
                  </div>
                  <p className="text-text-primary leading-relaxed mb-3 text-[11px] font-bold uppercase">{inc.message}</p>

                   {/* Dynamic Playbook Resolution Options */}
                  {(() => {
                    const steps = RESOLUTION_PLAYBOOKS[inc.category] || [
                      "Examine local PLC controller units and check current voltages.",
                      "Recalibrate pressure/vibration baseline thresholds.",
                      "Dispatch area floor marshal to visually inspect electrical grids."
                    ];
                    const completedCount = steps.filter((_, idx) => completedSteps[`${inc.id}-${idx}`] || false).length;
                    const isFullyResolved = completedCount === steps.length;

                    return (
                      <>
                        <div className="bg-[#161614] border border-border-machina p-3 my-3 font-mono text-[10px] space-y-3 rounded-[2px]">
                          <div className="flex justify-between items-center border-b border-border-machina/65 pb-1.5">
                            <span className="text-accent-machina font-black uppercase tracking-wider block">// FIELD DIAGNOSTIC RESOLUTION PLAYBOOK</span>
                            <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-[1.5px] uppercase ${isFullyResolved ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-amber-950 text-amber-500 border border-amber-800"}`}>
                              {completedCount}/{steps.length} STEPS CLEAR
                            </span>
                          </div>
                          
                          <ul className="space-y-2 text-text-primary font-bold">
                            {steps.map((step, idx) => {
                              const isCompleted = completedSteps[`${inc.id}-${idx}`] || false;
                              return (
                                <li 
                                  key={idx} 
                                  onClick={() => toggleStep(inc.id, idx)}
                                  className={`flex items-start gap-2.5 p-1.5 border transition-all duration-100 cursor-pointer select-none rounded-[1px] ${
                                    isCompleted 
                                      ? "bg-emerald-950/15 border-emerald-800/80 text-text-primary" 
                                      : "bg-bg-machina border-border-machina text-text-secondary hover:border-accent-machina"
                                  }`}
                                >
                                  <input 
                                    type="checkbox"
                                    checked={isCompleted}
                                    onChange={() => {}} // toggled on parent block click
                                    className="mt-0.5 accent-accent-machina w-3 h-3 cursor-pointer"
                                  />
                                  <span className={`uppercase text-[9px] leading-tight flex-1 ${isCompleted ? "line-through opacity-70" : ""}`}>{step}</span>
                                </li>
                              );
                            })}
                          </ul>

                          {/* Minimalist interactive Progress bar */}
                          <div className="w-full h-1 bg-zinc-950 rounded-[1px] overflow-hidden relative border border-border-machina/40">
                            <div 
                              className={`h-full transition-all duration-300 ${isFullyResolved ? "bg-emerald-500" : "bg-accent-machina animate-pulse"}`}
                              style={{ width: `${(completedCount / steps.length) * 100}%` }}
                            ></div>
                          </div>

                          <div className="pt-1.5 flex items-center justify-between text-[8px] text-text-secondary">
                            <span>CHOSEN ACTION ROUTING: DISMISS GRANTED ONLY ON TOTAL PLAYBOOK COMPLIANCE</span>
                            <span className={`px-1.5 py-0.2 select-none text-[8px] font-black uppercase ${isFullyResolved ? "bg-emerald-900/40 text-emerald-400 border border-emerald-700" : "bg-red-950 text-danger-machina border border-red-900 animate-pulse"}`}>
                              {isFullyResolved ? "LOCKOUT RELEASED" : "LOCKOUT RESTRICTED"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-border-machina pt-2.5 text-[10px] text-text-secondary font-bold uppercase">
                          <span>ZONE LOCATION: {inc.zone.toUpperCase()}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[8.5px] text-text-secondary tracking-wider uppercase">
                              {isFullyResolved ? "DISMISS WITH NUT →" : "COMPLETE ALL CHECKS FIRST [LOCK]"}
                            </span>
                            <div className={`${isFullyResolved ? "" : "opacity-30 cursor-not-allowed pointer-events-none"}`}>
                              <IronNutButton
                                onClick={() => {
                                  if (isFullyResolved) {
                                    acknowledgeIncident(inc.id);
                                  }
                                }}
                                title={isFullyResolved ? "Press iron nut to ACK & DISMISS" : "Playbook steps must be completed first"}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-dashed border-2 border-border-machina font-mono text-text-secondary text-xs rounded-[3px] uppercase font-bold">
              All factory systems reporting nominal. No pending alerts in broker pools.
            </div>
          )}
        </IndustrialWidget>

        {/* Right Column: Resolved Alarms log */}
        <IndustrialWidget
          title={`RESOLVED / CLEARED SYSTEM LOGS (${resolved.length})`}
          subtitle="Audit pathways cleared during this workspace connection period"
        >
          {resolved.length > 0 ? (
            <div className="space-y-3 font-mono">
              {resolved.map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 bg-card-machina border border-border-machina text-xs font-mono text-text-secondary relative rounded-[3px]"
                >
                  <div className="flex justify-between items-center mb-1 font-bold select-none text-[11px]">
                    <span className="text-text-secondary font-black uppercase flex items-center gap-1.5">
                      <Check size={12} className="text-accent-machina" />
                      {inc.category} — RESOLVED
                    </span>
                    <span className="text-text-secondary font-bold">{inc.timestamp.slice(11, 19)} Z</span>
                  </div>
                  <p className="leading-relaxed mb-2 text-[10px] uppercase font-semibold">{inc.message}</p>
                  <span className="text-[9px] uppercase tracking-wider block font-bold text-accent-machina">Zone: {inc.zone.toUpperCase()} • Sync cleared & validated</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-dashed border-2 border-border-machina font-mono text-text-secondary text-xs rounded-[3px] uppercase font-bold">
              Resolved alert history is empty. Clean dispatcher records.
            </div>
          )}
        </IndustrialWidget>
      </div>
    </div>
  );
}
