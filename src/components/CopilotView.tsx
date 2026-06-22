import React, { useState, useRef, useEffect } from "react";
import { useStore } from "../store/useStore";
import { ChatMessage } from "../types";
import IndustrialWidget from "./IndustrialWidget";
import { Send, Terminal, ShieldAlert, Cpu } from "lucide-react";

export default function CopilotView() {
  const { 
    user, 
    registeredWorkers, 
    attendance, 
    messages, 
    addChatMessage, 
    clearChat, 
    incidents, 
    equipment, 
    mode 
  } = useStore();
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat terminal
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Command handlers
  const handleCommand = (cmd: string) => {
    setInputText(cmd);
    setTimeout(() => {
      // Auto submit
      const btn = document.getElementById("btn-submit-copilot-msg");
      btn?.click();
    }, 100);
  };

  const runLocalSimulation = (userText: string) => {
    setTimeout(() => {
      let responseText = "";
      const query = userText.toLowerCase();

      const activeThreats = incidents.filter(i => !i.acknowledged);
      const compromisedEquipment = equipment.filter(eq => eq.status !== "nominal");
      const activeRole = user?.role || "Viewer";

      if (query.includes("shap") || query.includes("/explain-shap")) {
        responseText = `SHAP (SHapley Additive exPlanations) uses game theory mechanics to distribute attribution units to individual machine parameters. 

Mathematically, a feature's SHAP value is the average marginal change in predicting failure when that feature is present compared to base cohorts:
- Heat factors (temperature) directly adjust predictions upward if temperatures surpass the 65°C operational threshold.
- Physical stress levels (vibrations mm/s) trigger large additive swings if they register above 2.5 mm/s.
You can view active attributions in real-time inside the [Predict/Predictive Maintenance] tab.`;
      } else if (query.includes("rul") || query.includes("useful life") || query.includes("/explain-rul")) {
        responseText = `Remaining Useful Life (RUL) represents the estimated hours of operation before mechanical bearing failure. 

Our dynamic simulator models this prediction exponentially against failure probability:
- Nominal system profiles (< 10% failure risk) default to ~720 operating hours.
- Linear decay accelerates when temperature or vibration metrics rise.
- Risk scales exponentially. At 50% probability, RUL is curtailed to roughly 180 hours under safe cycle bounds. Immediate repair is scheduled upon risk breaching 15% threshold limits.`;
      } else if (query.includes("ppe") || query.includes("helmet") || query.includes("/check-ppe-feeds") || query.includes("safety") || query.includes("checklist")) {
        responseText = `FACILITY SAFETY SHIELD INGEST:
- Current checkup system is fully active. Go to the [Safety Portal] tab to use the Real-Time Laser Optical Scanner.
- Real-time compliance verifies: Helmet, face-shield guard, thermal suit, protective insulated gloves, and ground boots.
- On success, it plays a confirmation chime and records a safe check-in, unlocking gateway entrances and logging clearance.
- On failure, a Red Alert is spawned, the industrial alarm siren is activated, and entry is prompt-denied.`;
      } else if (
        query.includes("worker") || 
        query.includes("attendance") || 
        query.includes("who is working") || 
        query.includes("who's working") ||
        query.includes("personnel") ||
        query.includes("staff") ||
        query.includes("today")
      ) {
        // Advanced dynamic roster processing based on active user role capabilities
        const activeAttCount = attendance.filter(a => a.status === "active").length;
        const completedAttCount = attendance.filter(a => a.status === "completed").length;

        if (activeRole === "Admin" || activeRole === "Manager") {
          const workerListMarkup = registeredWorkers
            .map((w, idx) => {
              const attRecord = attendance.find(a => a.userEmail === w.email);
              let statusLabel = "📡 STANDBY";
              if (attRecord) {
                statusLabel = attRecord.status === "active" ? "🟢 ACTIVE (ON-FLOOR)" : "⚫ STAND-DOWN (SHIFT COMPLETED)";
              } else if (w.role === "Admin" || w.role === "Manager") {
                statusLabel = "💼 HQ SUPERVISORY NODE ON-LINE";
              }
              return `  [${idx + 1}] NAME: ${w.full_name}\n      ROLE / POSITION: ${w.role} / ${w.position}\n      STATUS: ${statusLabel}\n      TASK PROFILE:\n      ↳ "${w.work_description}"`;
            })
            .join("\n\n");

          responseText = `📋 HIGH-FIDELITY ACTIVE PERSONNEL ROSTER [CLEARANCE: LEVEL 4 ${activeRole.toUpperCase()}]
System detected a total registration size of ${registeredWorkers.length} personnel profiles.
Active on-site floor terminals currently: ${activeAttCount} logged operators.
Completed shifts logged for today's roster cycle: ${completedAttCount} items.

--- REAL-TIME COVERED WORK ROSTER & TASKS: ---

${workerListMarkup}

--- OSHA MANPOWER SAFETY VERIFICATION PROTOCOLS ACTIVE ---`;
        } else if (activeRole === "Worker") {
          const workspacePeers = registeredWorkers.filter(w => w.role === "Worker" && w.email !== user?.email);
          const peersMarkup = workspacePeers
            .map((w, idx) => `  ${idx + 1}. ${w.full_name} [${w.position}] - Task: "${w.work_description}"`)
            .join("\n");

          responseText = `🔧 FIELD FORCE CO-ORDINATES [CLEARANCE: LEVEL 2 WORKER]
Logon Handle: ${user?.full_name || "Factory Operator"} [${user?.position || "Duty Specialist"}]
Your active duty mandate: "${user?.work_description || "Floor diagnostics and safety verification checks."}"

ACTIVE CO-WORKERS ON FLOORS TODAY:
${peersMarkup || "No other worker logged in on current floor quadrant."}

Need task re-assignments or parameter overrides? Connect to senior supervisor Evelyn Sinclair or Tech Specialist Connor Devlin via the main operations channel.`;
        } else {
          responseText = `👁️ AUDITING ATTENDANCE DIGEST [CLEARANCE: LEVEL 1 READ-ONLY]
Telemetry states: ${registeredWorkers.length} staff accounts loaded, with ${activeAttCount} actively working on site today.
Personal identifier attributes, emails, and exact assigned coordinate vectors are locked under supervisor encryption. To query specific names or shift logs, elevate permissions with an Administrator or Manager authentication key.`;
        }
      } else if (
        query.includes("ability") || 
        query.includes("clearance") || 
        query.includes("access") || 
        query.includes("role") || 
        query.includes("my work") || 
        query.includes("permissions")
      ) {
        if (activeRole === "Admin") {
          responseText = `🔑 FULL ADMINISTRATIVE CAPABILITIES MATRIX [ROLE: ADMIN]
As an Administrator, you handle high-level control loop calibrations. Your capabilities include:
- Viewing audit reports and modifying database simulator profiles.
- Clearing emergency physical sirens and resetting thermal thresholds inside Settings.
- Pulling total worker attendance logs, active tasks rosters, and raw telemetry streams.
- Creating or registration of new staff members on the site database.`;
        } else if (activeRole === "Manager") {
          responseText = `📋 PROCESS SUPERVISION CAPABILITIES MATRIX [ROLE: MANAGER]
As an Operations/Production Manager, you govern floor-wide efficiency. Your capabilities include:
- Managing rosters, inspecting safety scan histories, and reviewing equipment health indices.
- Filing and downloading final mechanical compliance reports.
- Dispatching immediate troubleshooting mandates to floor staff.
- Accessing live worker lists and task profiles for shift logs today.`;
        } else if (activeRole === "Worker") {
          responseText = `🔧 FLOOR SPECIALIST COMPLIANCE INTERFACE [ROLE: WORKER]
As a Specialist Technician, you handle direct hardware interactions:
- Conducting real-time smart helmet/PPE compliance scans for gate access.
- Deploying oil, cooling purges, or lubrication changes directly to warn/warning machinery.
- Tracking active task metrics, calibrating bearing physical loads, and monitoring thermal/vapor stats.`;
        } else {
          responseText = `👁️ SYSTEM AUDITOR ACCESS [ROLE: VIEWER]
As an Auditor/Public observer, your terminal is constrained under read-only parameters:
- General physical twin model tracking.
- Viewing real-time uptime metrics, incident tallies, and prediction probability indices.
- Restricted access regarding active staff names, door overrides, or system calibrations.`;
        }
      } else if (query.includes("clear") || query.includes("resolve") || query.includes("dismiss")) {
        if (activeThreats.length > 0) {
          responseText = `ACTIVE RESPONSE PLAN TO CLEAR ALARMS:
Currently, the system is tracking ${activeThreats.length} unacknowledged threat alarms:
${activeThreats.map((t, idx) => `  ${idx + 1}. [${t.category.toUpperCase()}] in Zone: ${t.zone.toUpperCase()} - Alert: ${t.message}`).join("\n")}

PROCEDURE TO CLEAR:
1. Review individual diagnostic playbooks under the [Alarms Center] tab.
2. Complete physical floor steps (greasing gears, purging gas valves, venting heat).
3. Tap the Hexagonal Iron Nut close button on each alert or use the bulk squelch panel on the main operations dashboard to close the loop!`;
        } else {
          responseText = `ALL SYSTEM ALARMS CURRENTLY CLEAR.
No active hazards are registered in the datalink pool. All systems are reporting nominal operating parameters.`;
        }
      } else if (query.includes("emergency") || query.includes("hazard") || query.includes("alarm") || query.includes("siren") || query.includes("warning")) {
        const threatSummary = activeThreats.length > 0 
          ? `There are ${activeThreats.length} live emergency threats active. Highly advise navigating to the [Alarms Center] immediately.` 
          : "No immediate threats registered.";

        const equipmentSummary = compromisedEquipment.length > 0 
          ? `WARNING: The following equipment is currently operating in off-nominal states:\n${compromisedEquipment.map(eq => `  - '${eq.name.toUpperCase()}' is currently in [${eq.status.toUpperCase()}] state.`).join("\n")}`
          : "All machinery operating under normal parameters.";

        responseText = `EMERGENCY HAZARDS & ALARM MANUAL:
- ${threatSummary}
- ${equipmentSummary}

EMERGENCY STEPS:
1. **LUBE CHECKS**: If bearings are overheating, trigger component lubrication on the worker console.
2. **SIREN DISMISS**: To silence active sirens, supervisors must press the physical hexagonal nut buttons to verify safe on-site checks.
3. **PEAK AMPLIFIED ALARM**: Multiple overlapping emergencies trigger a 400% amplified alarm volume to warn floor engineers regarding compound dangers.`;
      } else if (query.includes("security")) {
        responseText = `PHYSICAL FACILITY SECURITY REGISTER:
- All zone entry points are locked under digital RFID relays.
- Portal enforcer gates scan workers dynamically. Successful compliance checkups unlock portal gates.
- Atmospheric gas detection bounds protect workers from Argon leaks (Argon limits are currently locked below 10.0 PPM).
- Door latch overrides are accessible only by authenticated Administrator and Manager role keys.`;
      } else if (query.includes("status") || query.includes("how is the plant")) {
        responseText = `Compiling facility state:
- Asset logs: ${equipment.length} units online. ${compromisedEquipment.length} units working under warning stresses.
- Active unacknowledged alarms: ${activeThreats.length} items logged.
- Celery worker queues state: 0 items pending, broker response loop running optimally inside the Docker Redis pool.
- Gaseous Argon level is under the 10.0 PPM limit.`;
      } else {
        responseText = `Acknowledged expert engineering request. FactoryGPT has processed your query: '${userText}'. 

To assist you with factory operations, try these terminal commands based on your working access:
- Ask "Who is working today?" or "How many workers work today?" to extract active staff profiles and their assigned tasks.
- Ask "What is my role?" or "My permissions?" to view your specific working ability.
- Type 'emergency' or 'hazard' to get custom procedures for active off-nominal devices.
- Type 'clear' or 'resolve' to review step-by-step instructions on shutting down active alarms.
- Type 'safety' or 'security' to analyze entrance portal protocols and Gas/Argon limits.
- Type '/explain-shap' to extract mathematical attributions governing our XGBoost models.`;
      }

      const copMsg: ChatMessage = {
        id: `m-cop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: "assistant",
        text: responseText,
        timestamp: new Date().toISOString()
      };
      addChatMessage(copMsg);
      setLoading(false);
    }, 1000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setInputText("");

    const uMsg: ChatMessage = {
      id: `m-usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: "user",
      text: userText,
      timestamp: new Date().toISOString()
    };
    addChatMessage(uMsg);

    setLoading(true);

    if (mode === "connected") {
      try {
        const response = await fetch("/api/v1/copilot/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: userText,
            messages: messages
          })
        });
        
        if (!response.ok) {
          throw new Error(`Server returned code ${response.status}`);
        }
        
        const data = await response.json();
        const copMsg: ChatMessage = {
          id: `m-cop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          role: "assistant",
          text: data.text,
          timestamp: new Date().toISOString()
        };
        addChatMessage(copMsg);
        setLoading(false);
      } catch (err) {
        console.warn("Real-time connected copilot error, applying static logic.", err);
        runLocalSimulation(userText);
      }
    } else {
      runLocalSimulation(userText);
    }
  };;

  return (
    <div id="copilot-layout-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Left hand helper shortcuts */}
      <div className="lg:col-span-1">
        <IndustrialWidget
          title="COMMAND PRESETS"
          subtitle="Physical console shortcuts"
        >
          <div className="space-y-3 font-mono text-[11px]">
            <span className="text-[9px] text-[#A8463B] font-bold uppercase tracking-widest block mb-2">
              CORE COMMAND MACROS
            </span>

            <button
              id="btn-shortcut-shap"
              onClick={() => handleCommand("/explain-shap")}
              className="w-full text-left bg-card-machina hover:bg-hover-machina border border-border-machina p-2 text-text-primary hover:text-accent-machina cursor-pointer block truncate text-xs uppercase font-bold tracking-wider"
            >
              /EXPLAIN-SHAP
            </button>

            <button
              id="btn-shortcut-rul"
              onClick={() => handleCommand("/explain-rul")}
              className="w-full text-left bg-card-machina hover:bg-hover-machina border border-border-machina p-2 text-text-primary hover:text-accent-machina cursor-pointer block truncate text-xs uppercase font-bold tracking-wider"
            >
              /EXPLAIN-RUL
            </button>

            <button
              id="btn-shortcut-ppe"
              onClick={() => handleCommand("/check-ppe-feeds")}
              className="w-full text-left bg-card-machina hover:bg-hover-machina border border-border-machina p-2 text-text-primary hover:text-accent-machina cursor-pointer block truncate text-xs uppercase font-bold tracking-wider"
            >
              /CHECK-PPE-FEEDS
            </button>

            <div className="border-t border-border-machina pt-4 mt-2">
              <button
                id="btn-clear-chat"
                onClick={clearChat}
                className="w-full py-2 bg-card-machina border border-border-machina hover:border-danger-machina/60 hover:bg-danger-machina/5 text-text-secondary hover:text-danger-machina text-[10px] font-bold uppercase tracking-wider transition-none cursor-pointer text-center"
              >
                FLUSH TERMINAL LOG
              </button>
            </div>
          </div>
        </IndustrialWidget>
      </div>

      {/* Main Terminal Window Chat */}
      <div className="lg:col-span-3">
        <IndustrialWidget
          title="OPERATOR COMMAND TUNNEL"
          subtitle="Cognitive copilot teletype link"
          headerAction={
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-accent-machina bg-bg-machina border border-border-machina px-3 py-1 font-bold select-none">
                DATALINK: RS-232 ONLINE
              </span>
            </div>
          }
        >
          <div className="flex flex-col h-[420px]">
            {/* Scroll Area message messages */}
            <div className="flex-1 overflow-y-auto mb-4 border-2 border-border-machina bg-bg-machina p-5 space-y-4 select-text">
              
              {/* Default Welcome Frame */}
              <div className="border border-border-machina/40 p-4 bg-card-machina/40 font-mono text-xs text-text-secondary space-y-1.5 rounded-[2px]" id="copilot-welcome-frame">
                <div className="text-accent-machina font-black uppercase text-[10px] tracking-widest border-b border-border-machina/40 pb-1 flex justify-between">
                  <span>[FACTORY CORE COMPUTATION TERMINAL - {user?.role.toUpperCase() || "AUDITOR"}]</span>
                  <span>REV: 1997.8</span>
                </div>
                <div>ACTIVE NODE: CLOUD_RUN_CONTAINER_3000</div>
                <div>AUTHENTICATED SECURITY IDENTIFIER: {user?.email || "GUEST_ANONYMOUS@factorygpt.lan"}</div>
                <div>COGNITIVE DATALINK POWER COUPLING: {user?.role === "Admin" ? "ROOT_SUPERUSER" : user?.role === "Manager" ? "OPERATIONAL_CONTROL_L4" : user?.role === "Worker" ? "LEVEL_2_READ_WRITE" : "LEVEL_1_READ_ONLY"}</div>
                <div className="text-[10px] text-zinc-500 italic mt-1 pt-1 border-t border-border-machina/20">
                  READY FOR INSTRUCTIONS. TYPE '/EXPLAIN-SHAP', ASK "WHO IS WORKING TODAY?" OR QUERY YOUR ROLE ABILITY. _
                </div>
              </div>

              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"} font-mono`}
                  >
                    {isUser ? (
                      /* User message: Heavy Metal-bordered Panel */
                      <div className="max-w-[85%] p-4 bg-card-machina border-2 border-border-machina rounded-none text-text-primary shadow-none relative">
                        {/* Screws styled for user tele-plates */}
                        <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
                        <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
                        <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
                        <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>

                        <div className="flex justify-between items-center text-[9px] text-text-secondary mb-2 uppercase font-black tracking-[0.18rem] border-b border-border-machina/50 pb-1.5 gap-8">
                          <span>OPERATIVE TELETYPE HANDSHAKE</span>
                          <span>{msg.timestamp?.slice(11, 19) ?? "TIME"} Z</span>
                        </div>
                        <div className="text-[11px] leading-normal font-bold uppercase tracking-wide">{msg.text}</div>
                      </div>
                    ) : (
                      /* Assistant message: Clean line-by-line terminal output style */
                      <div className="max-w-[90%] p-2 bg-bg-machina border border-border-machina text-text-primary relative rounded-none flex flex-col space-y-2">
                        <div className="flex justify-between items-center text-[9px] text-accent-machina uppercase font-bold tracking-widest border-b border-border-machina/50 pb-1">
                          <span>COBALT MAINFRAME COGNITION</span>
                          <span>{msg.timestamp?.slice(11, 19) ?? "TIME"} Z</span>
                        </div>
                        <div className="text-[10px] text-text-secondary font-bold tracking-wide italic uppercase">
                          SYSTEM ONLINE &gt;&gt; COMPILING MODEL WEIGHTS... COMPLETE.
                        </div>
                        <div className="whitespace-pre-line text-xs font-mono leading-relaxed text-text-primary pt-1">
                          {msg.text}
                          <span className="inline-block w-2.5 h-3.5 bg-accent-machina ml-1 animate-pulse">_</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start font-mono">
                  <div className="max-w-[85%] p-4 bg-bg-machina border border-danger-machina/50 text-text-secondary text-xs flex flex-col space-y-2 rounded-none">
                    <div className="text-[9px] text-danger-machina uppercase font-bold tracking-widest border-b border-border-machina/50 pb-1">
                      DATALINK PENDING
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-danger-machina rounded-full animate-ping"></span>
                      <span>SYSTEM ONLINE</span>
                    </div>
                    <div>PROCESSING COGNITION BUFFERS...</div>
                    <div className="animate-pulse">ANALYZING WEIGHTS MODEL MATRIX_</div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input prompt footer form footer */}
            <form onSubmit={handleSendMessage} className="flex gap-2 font-mono">
              <input
                id="input-copilot-prompt"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="INPUT COMMAND OR INITIATE CONTEXT-SENSITIVE CONSOLE TELETYPE..."
                className="flex-1 bg-card-machina border border-border-machina px-4 py-2 text-xs text-text-primary placeholder-text-secondary focus:border-accent-machina focus:outline-none uppercase font-bold tracking-wider"
              />
              <button
                id="btn-submit-copilot-msg"
                type="submit"
                className="px-5 bg-accent-machina hover:bg-white text-bg-machina font-black uppercase text-xs flex items-center gap-1.5 cursor-pointer select-none transition-all active:scale-95 border border-border-machina"
              >
                <Send size={11} />
                <span>Transmit</span>
              </button>
            </form>
          </div>
        </IndustrialWidget>
      </div>
    </div>
  );
}

