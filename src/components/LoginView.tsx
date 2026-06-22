import React, { useState } from "react";
import { useStore } from "../store/useStore";
import { API_CLIENT } from "../lib/api";
import { Lock, Cpu, Eye, ShieldAlert, Wrench, Shield, KeyRound, CheckCircle2 } from "lucide-react";

export default function LoginView() {
  const { setUser, mode, registeredWorkers } = useStore();
  const [selectedRole, setSelectedRole] = useState<"Admin" | "Manager" | "Worker" | "Viewer">("Admin");
  
  const [email, setEmail] = useState("connor.admin@factorygpt.lan");
  const [password, setPassword] = useState("factory");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Clearance categories with customized attributes
  const clearanceLevels = {
    Admin: {
      email: "connor.admin@factorygpt.lan",
      title: "LEAD SYSTEM ADMINISTRATOR (ROOT)",
      badge: "SYS_ADMIN_CMD",
      colorClass: "text-danger-machina border-danger-machina/30 bg-danger-machina/10",
      accentColor: "var(--color-danger-machina)",
      desc: "HIGHEST OPERATIONAL CLEARANCE. ROOT OVERRIDE ACCESS, TELEMETRY CACHE INJECTION FLUSH, SIREN TRIGGER MODULATION, AND ADVANCED CLOCK DRIFT SHAPING CHECKS.",
      abilities: [
        "FORCE SIMULATED FAILURE ANOMALIES ON COUPLERS",
        "RETROACTIVELY PURGE MACHINE REPAIR INTERVAL TICKETS",
        "RE-CONFIGURE INSTANT SENSOR WEIGHT OVERRIDES",
        "ACCESS FULL DIAGNOSTIC ALARMS CONSOLE TELEMETRY"
      ]
    },
    Manager: {
      email: "patel.manager@factorygpt.lan",
      title: "PREDICTIVE MAINTENANCE ENGINEER",
      badge: "ML_MAIN_ENG",
      colorClass: "text-warning-machina border-warning-machina/30 bg-warning-machina/10",
      accentColor: "var(--color-warning-machina)",
      desc: "ML PARAMETER TUNING CLEARANCE. AUTHORIZED TO EVALUATE XGBOOST GRADIENTS, RUL PROGNOSIS INDICES, SHAP ATTRIBUTION EXPLAINERS, AND TRANSCRIBE COMPLIANCE WRITES.",
      abilities: [
        "CALIBRATE XGBOOST F1 LOSS HYPERPARAMETERS",
        "DEPLOY MULTI-EQUIPMENT BATCH SWEEPS",
        "EXPORT FORMAL LEDGER AUDITING COMPLIANCE CERTIFICATES",
        "TRAIN LOCAL CORRELATION BIASES VIA AI COPILOT"
      ]
    },
    Worker: {
      email: "miller.worker@factorygpt.lan",
      title: "MECHANICAL FIELD SPECIALIST (LVL-2)",
      badge: "FLD_OPS_SPEC",
      colorClass: "text-accent-machina border-accent-machina/30 bg-accent-machina/10",
      accentColor: "var(--color-accent-machina)",
      desc: "FLOOR ENGINEERING & FLUID CONTROL. POWERS MANUAL RESET CHANNELS, LUBRICATION SCHEDULING, REALTIME GASKET VALVES RE-ALIGNMENT, AND BROADWAY SIRENS SQUELCHING.",
      abilities: [
        "COMMIT PHYSICAL LUBRICITY MAINTENANCE ACTIONS",
        "BULK REPORT ACKNOWLEDGE & COUPLING FAULTS SIREN SQUELCH",
        "DISPATCH LEVEL-2 REPAIR FIELD RESPONSE TEAM UNIT",
        "ACCESS COMPACT OPERATIONAL FLOW BLUEPRINT MANUALS"
      ]
    },
    Viewer: {
      email: "operator.viewer@factorygpt.lan",
      title: "STANDARD FLOOR OBSERVER (READ-ONLY)",
      badge: "OBS_PORT_LIVE",
      colorClass: "text-text-secondary border-border-machina bg-card-machina",
      accentColor: "var(--color-text-secondary)",
      desc: "GATEWAY ACCESS GRANTED. NON-INTERACTIVE OBSERVER ACCESS TO SCROLLING OSCILLOSCOPE READINGS, DIGITAL TWIN SVG SCHEMATICS, AND AI COMPENSATOR CORRESPONDENCE.",
      abilities: [
        "MONITOR STEADY-STATE WAVE VIBRATION SPECS",
        "INTERROGATE STRUCTURAL DIGITAL CAD TWIN CODES",
        "QUERY REALTIME TELEMETRY STREAM PACKETS",
        "COMMU WITH LOCAL INDUSTRIAL COPILOT INTERFACE"
      ]
    }
  };

  const handleRoleTabChange = (role: "Admin" | "Manager" | "Worker" | "Viewer") => {
    setSelectedRole(role);
    setEmail(clearanceLevels[role].email);
    setPassword("factory");
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("SECURITY SYSTEM: Credentials cannot be vacant.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Connects to simulated auth backend fallback
      const authenticatedUser = await API_CLIENT.login(email, password, mode);
      
      // Map user configuration profile
      const level = clearanceLevels[selectedRole];
      
      const existingWorker = registeredWorkers?.find(w => w.email.toLowerCase() === email.toLowerCase());
      
      setUser({
        id: existingWorker?.id || authenticatedUser.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: email,
        full_name: existingWorker?.full_name || level.title,
        role: selectedRole,
        permissions: selectedRole === "Admin" 
          ? ["Admin", "Manager", "Worker", "Viewer"] 
          : selectedRole === "Manager" 
            ? ["Manager", "Worker", "Viewer"] 
            : selectedRole === "Worker" 
              ? ["Worker", "Viewer"] 
              : ["Viewer"],
        is_active: true,
        created_at: existingWorker?.created_at || authenticatedUser.created_at || new Date().toISOString(),
        position: existingWorker?.position || level.badge,
        avatar_url: existingWorker?.avatar_url || undefined,
        work_description: existingWorker?.work_description || undefined
      });
    } catch (err: any) {
      setError(err?.message || "AUTHENTICATION FAILURE: Handshake signature mismatch.");
    } finally {
      setLoading(false);
    }
  };

  const activeLevel = clearanceLevels[selectedRole];

  return (
    <div id="login-layout-wrapper" className="min-h-screen bg-bg-machina flex flex-col justify-center items-center px-4 py-8 relative select-none">
      {/* Dynamic structural framing background lines */}
      <div className="absolute inset-0 grid grid-cols-6 opacity-[0.03] pointer-events-none">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="border-r border-text-primary h-full"></div>
        ))}
      </div>

      <div className="w-full max-w-xl bg-card-machina border-2 border-border-machina p-8 relative z-10 rounded-[4px]">
        {/* Machine Screw Decors representing a heavy metallic plate enclosure */}
        <div className="screw screw-tl"></div>
        <div className="screw screw-tr"></div>
        <div className="screw screw-bl"></div>
        <div className="screw screw-br"></div>

        {/* Header Title with Oswald & Bebas Neue Font Pairings */}
        <div className="flex flex-col text-center items-center mb-6 border-b-2 border-border-machina pb-6 relative">
          <div className="absolute top-0 right-0 text-[8px] font-mono text-text-secondary font-bold">NODE_INGRESS: PORT_3000</div>
          
          <div className="flex items-center gap-2 text-accent-machina mb-2">
            <Lock size={15} className="stroke-[2.5]" />
            <span className="font-sans font-black text-xs tracking-[0.3em] uppercase">
              SECURITY GATEWAY INGRESS
            </span>
          </div>
          
          <h1 className="font-bebas text-5xl tracking-[0.08em] uppercase text-text-primary leading-none mt-1">
            FACTORY<span className="text-accent-machina">GPT</span> CORE
          </h1>
          <p className="text-[10px] text-text-secondary font-mono tracking-widest mt-2 uppercase font-bold">
            PROVISION SECURITY CREDENTIALS TO LOG IN
          </p>
        </div>

        {/* Clearances Selection Tabs representing separate login systems */}
        <div className="mb-6">
          <label className="block text-[9px] font-mono tracking-[0.2em] text-text-secondary uppercase mb-2.5 font-black text-center">
            [ SELECT CLEARANCE ACCESS GATEWAY PORTAL ]
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono">
            {(["Admin", "Manager", "Worker", "Viewer"] as const).map((role) => {
              const isActive = selectedRole === role;
              return (
                <button
                  id={`tab-role-select-${role.toLowerCase()}`}
                  key={role}
                  type="button"
                  onClick={() => handleRoleTabChange(role)}
                  className={`py-2 px-1 text-center text-[10px] uppercase font-black transition-none cursor-pointer border tracking-wider rounded-[2px] ${
                    isActive
                      ? "bg-hover-machina border-accent-machina text-accent-machina"
                      : "bg-bg-machina border-border-machina text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {role} GATE
                </button>
              );
            })}
          </div>
        </div>

        {/* Active clearance specs module card */}
        <div className={`p-4 border mb-6 rounded-[2px] font-mono text-left transition-all duration-150 ${activeLevel.colorClass}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-black tracking-widest text-text-primary uppercase flex items-center gap-2">
              <Shield size={12} style={{ color: activeLevel.accentColor }} />
              {activeLevel.title}
            </span>
            <span className="font-bold text-[9px] tracking-wider border border-border-machina px-1.5 py-0.5 bg-bg-machina">
              {activeLevel.badge}
            </span>
          </div>
          <p className="text-[9.5px] leading-relaxed text-text-secondary font-bold uppercase mb-3">
            {activeLevel.desc}
          </p>

          <div className="border-t border-border-machina/25 pt-2.5">
            <span className="block text-[8px] tracking-wider text-text-secondary font-black mb-1.5 uppercase">
              // SECURE ABILITIES GRANTED UNDER THIS DOOR:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[9px] text-text-primary font-bold">
              {activeLevel.abilities.map((ability, idx) => (
                <div key={idx} className="flex items-center gap-1.5 uppercase tracking-wide">
                  <CheckCircle2 size={10} className="text-accent-machina shrink-0" />
                  <span className="truncate">{ability}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-bg-machina border border-danger-machina text-danger-machina p-4 font-mono text-[11px] leading-relaxed flex gap-2.5 items-start rounded-[3px]">
            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
            <span className="font-bold uppercase">{error}</span>
          </div>
        )}

        {/* Input Handshake Fields */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-[0.2em] text-text-secondary mb-1.5 font-black">
              SECURE DOOR LOGIN ADDRESS (E-MAIL)
            </label>
            <input
              id="input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-machina border border-border-machina px-4 py-2.5 text-xs font-mono text-text-primary focus:border-accent-machina focus:outline-none uppercase font-bold rounded-[3px]"
              placeholder={activeLevel.email}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-[0.2em] text-text-secondary mb-1.5 font-black">
              SECURE DOOR HANDSHAKE CODE (KEY)
            </label>
            <input
              id="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-machina border border-border-machina px-4 py-2.5 text-xs font-mono text-text-primary focus:border-accent-machina focus:outline-none uppercase font-bold rounded-[3px]"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-accent-machina hover:bg-white text-bg-machina font-mono text-xs tracking-[0.25em] uppercase font-black transition-none cursor-pointer text-center flex items-center justify-center gap-2 rounded-[3px] mt-6"
            style={{ backgroundColor: activeLevel.accentColor, color: selectedRole === "Viewer" ? "var(--color-bg-machina)" : "inherit" }}
          >
            <KeyRound size={14} strokeWidth={2.5} />
            {loading ? "ESTABLISHING INTEGRITY GATEWAY..." : "STRIKE SECURE PORT AUTHENTICATION"}
          </button>
        </form>

        {/* Technical ledger metadata footing */}
        <div className="mt-6 pt-4 border-t border-border-machina/50 text-[9px] font-mono text-text-secondary flex justify-between uppercase font-bold items-center select-none">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-machina animate-pulse-slow"></span>
            PORT ACCESS LINK: 3000
          </span>
          <span>ENVIRONMENT DESCRIPTOR: {mode.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
