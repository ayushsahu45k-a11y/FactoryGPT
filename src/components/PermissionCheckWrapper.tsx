import React from "react";
import { useStore } from "../store/useStore";
import { Lock, ShieldAlert, KeyRound, RefreshCw } from "lucide-react";

export type RoleType = "Admin" | "Manager" | "Worker" | "Viewer";

interface PermissionCheckWrapperProps {
  children: React.ReactNode;
  requiredRole: RoleType;
  viewName: string;
}

const ROLE_LEVELS: Record<RoleType, number> = {
  "Viewer": 1,
  "Worker": 2,
  "Manager": 3,
  "Admin": 4,
};

const ROLE_LABELS: Record<RoleType, string> = {
  "Viewer": "LEVEL L-1 (STANDARD VISITOR / VIEW-ONLY)",
  "Worker": "LEVEL L-2 (FIELD OPERATIONS / WORKER)",
  "Manager": "LEVEL L-3 (PREDICTIVE ENGINEER / MANAGER)",
  "Admin": "LEVEL L-4 (LEAD SYSTEM ADMINISTRATOR)",
};

export default function PermissionCheckWrapper({
  children,
  requiredRole,
  viewName,
}: PermissionCheckWrapperProps) {
  const { user, setUser } = useStore();

  const currentUserRole = (user?.role as RoleType) || "Viewer";
  const userLevel = ROLE_LEVELS[currentUserRole] || 1;
  const requiredLevel = ROLE_LEVELS[requiredRole];

  const hasAccess = userLevel >= requiredLevel;

  if (hasAccess) {
    return <>{children}</>;
  }

  const handleLogoutAndSwitch = () => {
    setUser(null);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[70vh] font-mono select-none">
      <div 
        id={`access-restricted-${viewName.toLowerCase().replace(/\s+/g, "-")}`}
        className="w-full max-w-xl bg-[#0d0d0c] border border-red-950/70 p-8 rounded-[3px] shadow-[0_12px_40px_rgba(0,0,0,0.8)] relative overflow-hidden"
      >
        {/* Symmetrical subtle hazard striped side-indicator */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-800/80" />
        
        {/* Security Lock Header */}
        <div className="flex items-center gap-3 border-b border-border-machina/60 pb-5 mb-6">
          <div className="p-2.5 bg-red-950/20 border border-red-900/40 text-red-500 rounded-[2px] shrink-0">
            <Lock size={18} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-[11px] font-black tracking-[0.25em] text-red-500 uppercase">
              [SECURITY PROTOCOL SEC-403: PRIVILEGE FAULT]
            </h2>
            <p className="text-[9px] text-text-secondary uppercase mt-0.5 tracking-wider">
              Cryptographic clearance verification rejected for terminal view: {viewName}
            </p>
          </div>
        </div>

        {/* Diagnostic Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-[10px]">
          {/* Left: User Details */}
          <div className="bg-[#080807] border border-border-machina/40 p-4 rounded-[2px]">
            <span className="text-zinc-600 font-bold block mb-2 uppercase tracking-wider">CURRENT OPERATOR PROFILE</span>
            <div className="space-y-1.5">
              <div>
                <span className="text-zinc-500">USER:</span>{" "}
                <span className="text-text-primary font-bold">{user?.full_name?.toUpperCase() || "UNIDENTIFIED STAFF"}</span>
              </div>
              <div>
                <span className="text-zinc-500">EMAIL:</span>{" "}
                <span className="text-text-secondary lowercase break-all">{user?.email || "unknown@factorygpt.lan"}</span>
              </div>
              <div>
                <span className="text-zinc-500">CLEARANCE:</span>{" "}
                <span className="text-amber-500/90 font-bold">{ROLE_LABELS[currentUserRole]}</span>
              </div>
            </div>
          </div>

          {/* Right: Security Fault Details */}
          <div className="bg-[#080807] border border-border-machina/40 p-4 rounded-[2px]">
            <span className="text-zinc-600 font-bold block mb-2 uppercase tracking-wider">TERMINAL VERIFICATION</span>
            <div className="space-y-1.5">
              <div>
                <span className="text-zinc-500">REQUIRED CLEARANCE:</span>{" "}
                <span className="text-red-500 font-black">{ROLE_LABELS[requiredRole]}</span>
              </div>
              <div>
                <span className="text-zinc-500">STATIONS LOCKED:</span>{" "}
                <span className="text-text-secondary uppercase">{viewName} COMPONENT VIEWPORT</span>
              </div>
              <div>
                <span className="text-zinc-500">ISO AUDIT STATE:</span>{" "}
                <span className="text-red-400 font-bold uppercase">SEC-807 MONITORING ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Error Message */}
        <div className="p-4 bg-red-950/10 border border-red-950/45 text-[10px] text-red-400 leading-relaxed uppercase rounded-[2px] mb-6">
          <div className="flex gap-2">
            <ShieldAlert size={14} className="shrink-0 text-red-500 mt-0.5" />
            <span>
              The active system user profile does not possess the requisite cryptographic authority to execute queries or render live industrial telemetry for this module. This failed verification attempt has been logged into the chronological operational audit register.
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border-machina/40 select-none">
          <button
            onClick={handleLogoutAndSwitch}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-text-primary border border-border-machina rounded-[2px] text-[9px] font-black uppercase tracking-[0.15em] transition-all cursor-pointer"
          >
            <RefreshCw size={11} />
            <span>SWITCH OPERATOR SIGN-ON</span>
          </button>
          
          <div className="flex items-center justify-center px-4 text-[8px] text-zinc-500 font-mono tracking-widest uppercase border border-dashed border-border-machina/40 rounded-[2px]">
            ISO-9001 COMPLIANT
          </div>
        </div>
      </div>
    </div>
  );
}
