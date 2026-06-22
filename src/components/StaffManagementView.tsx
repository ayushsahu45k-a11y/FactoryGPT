import React, { useState } from "react";
import { useStore } from "../store/useStore";
import { User, Shield, KeyRound, UserCheck, Trash2, Calendar, Clock, Lock, ShieldAlert, CheckCircle2 } from "lucide-react";
import IndustrialWidget from "./IndustrialWidget";
import PermissionGuard from "./PermissionGuard";

export default function StaffManagementView() {
  const { user, registeredWorkers, attendance, history, registerWorker, fireWorker } = useStore();
  
  // Registration form state
  const [workerName, setWorkerName] = useState("");
  const [workerEmail, setWorkerEmail] = useState("");
  const [workerRole, setWorkerRole] = useState<"Worker" | "Viewer" | "Manager">("Worker");
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Dismissal action state
  const [firingCandidateEmail, setFiringCandidateEmail] = useState<string | null>(null);

  const canFire = (targetWorker: any) => {
    if (!user) return false;
    // Cannot fire yourself
    if (targetWorker.email.toLowerCase() === user.email.toLowerCase()) return false;
    // Cannot fire an Admin
    if (targetWorker.role === "Admin") return false;
    // Manager can fire Worker and Viewer
    if (user.role === "Manager") {
      return targetWorker.role === "Worker" || targetWorker.role === "Viewer";
    }
    // Admin can fire anybody (except Admins, already cleared above)
    if (user.role === "Admin") {
      return true;
    }
    return false;
  };

  const executeFire = (email: string, name: string) => {
    fireWorker(email);
    setSuccessMsg(`PERMANENTLY DISCHARGED "${name.toUpperCase()}" FROM FACILITY OPERATIONS`);
    setFiringCandidateEmail(null);
  };

  if (!user || (user.role !== "Admin" && user.role !== "Manager")) {
    return (
      <PermissionGuard errorMessage="Only authorized Lead System Administrators and Predictive Maintenance Engineers hold cryptographic keys to access the Staff Register terminal." />
    );
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!workerName || !workerEmail) {
      setErrorMsg("ERROR: Candidate name or email key cannot be vacant.");
      return;
    }

    if (registeredWorkers.some(w => w.email.toLowerCase() === workerEmail.toLowerCase())) {
      setErrorMsg("ERROR: Provided email key already registered in facility database.");
      return;
    }

    registerWorker(workerName, workerEmail, workerRole);
    setSuccessMsg(`SUCCESSFULLY REGISTERED "${workerName.toUpperCase()}" AS [${workerRole.toUpperCase()}]`);
    setWorkerName("");
    setWorkerEmail("");
  };

  // Compile all shifts logs combining login, logout and safety scans
  const shiftLogEntries = history.filter(h => h.category === "AUTHENTICATION" || h.category === "ATTENDANCE" || h.category === "SAFETY_SCAN");

  return (
    <div className="space-y-6 select-none font-mono">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Registration form widget */}
        <div className="lg:col-span-4 space-y-6">
          <IndustrialWidget
            title="REGISTER NEW FACILITY STAFF"
            subtitle="Command authorization terminal to assign key-access portals"
          >
            <form onSubmit={handleRegister} className="space-y-4 p-4 bg-[#0F0F0D] border border-border-machina rounded-[2px]">
              
              {successMsg && (
                <div className="bg-emerald-950/30 border border-emerald-800 text-emerald-400 p-3 text-[9px] font-bold uppercase rounded-[2px]">
                  ✓ {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-950/30 border border-red-800 text-danger-machina p-3 text-[9px] font-bold uppercase rounded-[2px]">
                  ✖ {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-[9px] text-text-secondary uppercase font-bold mb-1.5">
                  FULL CANDIDATE NAME:
                </label>
                <input
                  type="text"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="e.g. Technician J. Doe"
                  className="w-full bg-bg-machina border border-border-machina px-3 py-2 text-xs text-text-primary focus:border-accent-machina focus:outline-none uppercase font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] text-text-secondary uppercase font-bold mb-1.5">
                  FACILITY EMAIL-PORTKEY ADDRESS:
                </label>
                <input
                  type="email"
                  value={workerEmail}
                  onChange={(e) => setWorkerEmail(e.target.value)}
                  placeholder="name@factorygpt.lan"
                  className="w-full bg-bg-machina border border-border-machina px-3 py-2 text-xs text-text-primary focus:border-accent-machina focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] text-text-secondary uppercase font-bold mb-1.5">
                  SYSTEM CLEARANCE LEVEL ROLE:
                </label>
                <select
                  value={workerRole}
                  onChange={(e) => setWorkerRole(e.target.value as any)}
                  className="w-full bg-bg-machina border border-border-machina px-3 py-2 text-xs text-text-primary focus:border-accent-machina focus:outline-none"
                >
                  <option value="Worker">FIELD OPERATIONS SPECIALIST (WORKER)</option>
                  <option value="Viewer">STANDARD FLOOR OBSERVER (VIEWER)</option>
                  <option value="Manager">PREDICTIVE MAINTENANCE ENGINEER (MANAGER)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-accent-machina hover:bg-white text-bg-machina text-[10px] font-black uppercase tracking-widest cursor-pointer hover:font-bold transition-all"
                >
                  STAMP SYSTEM REGISTRATION
                </button>
              </div>
            </form>
          </IndustrialWidget>

          {/* Enrolled personnel summary list */}
          <div>
            <IndustrialWidget
              title="REGISTERED FACILITY ACCOUNTS"
              subtitle="Enrolled operators database ledger records"
            >
              <div className="bg-[#0F0F0D] border border-border-machina rounded-[2px] divide-y divide-border-machina/60 max-h-72 overflow-y-auto">
                {registeredWorkers.map((w, idx) => {
                  const allowedToFire = canFire(w);
                  const isConfirming = firingCandidateEmail === w.email;

                  return (
                    <div key={idx} className="p-3 text-[10px] flex flex-col gap-2 bg-[#0F0F0D] hover:bg-[#121210] font-bold transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1 truncate flex-1 min-w-0 mr-2">
                          <span className="text-text-primary uppercase block font-bold truncate">{w.full_name}</span>
                          <span className="text-zinc-500 block text-[8px] truncate">{w.email.toUpperCase()}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[8px] bg-bg-machina border border-border-machina text-accent-machina px-1.5 py-0.5 tracking-wider uppercase font-bold">
                            {w.role}
                          </span>
                          
                          {allowedToFire && !isConfirming && (
                            <button
                              onClick={() => setFiringCandidateEmail(w.email)}
                              className="px-1.5 py-0.5 text-red-500 border border-red-900 bg-red-950/15 hover:bg-red-900 hover:text-white transition-all uppercase text-[8px] font-black tracking-wide rounded-[1px] cursor-pointer"
                              title="Discharge operative"
                            >
                              DISCHARGE
                            </button>
                          )}
                        </div>
                      </div>

                      {isConfirming && (
                        <div className="bg-red-950/20 border border-red-905 p-2 text-[8px] flex flex-col justify-between gap-2 rounded-[1.5px] animate-fade-in mt-1 font-mono">
                          <span className="text-red-400 font-black uppercase tracking-wider">// CONFIRM IRREVERSIBLE DISPOSAL DECREE?</span>
                          <div className="flex gap-1.5 self-end">
                            <button
                              onClick={() => executeFire(w.email, w.full_name)}
                              className="px-2 py-0.5 bg-red-800 hover:bg-red-700 text-white font-black uppercase border border-red-500 rounded-[1px] cursor-pointer text-[8px]"
                            >
                              YES, REMOVE
                            </button>
                            <button
                              onClick={() => setFiringCandidateEmail(null)}
                              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-border-machina rounded-[1px] cursor-pointer text-[8px]"
                            >
                              ABORT
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </IndustrialWidget>
          </div>
        </div>

        {/* Audit shift telemetry center (Task 12) */}
        <div className="lg:col-span-4">
          <IndustrialWidget
            title="STAFF SECURITY & SESSION AUDITING LEDGER"
            subtitle="Real-time timeline capturing on-site check-ins, authentications, and safety scans"
          >
            <div className="bg-[#0F0F0D] border border-border-machina rounded-[2px] overflow-hidden">
              <div className="h-[580px] overflow-y-auto p-4 space-y-3.5">
                {shiftLogEntries.map((log) => {
                  let alertStyle = "border-zinc-800 text-text-primary";
                  if (log.title.includes("SIGN-ON") || log.title.includes("PUNCH IN")) {
                    alertStyle = "border-emerald-950/60 text-emerald-400 bg-emerald-950/10";
                  } else if (log.title.includes("TERMINATED") || log.title.includes("PUNCH OUT")) {
                    alertStyle = "border-amber-950/50 text-amber-500 bg-amber-950/5";
                  } else if (log.title.includes("COMPLIANCE")) {
                    alertStyle = "border-sky-950/60 text-sky-400 bg-sky-950/10";
                  }

                  return (
                    <div key={log.id} className={`p-3 border rounded-[1px] space-y-1 hover:border-zinc-600 transition-colors ${alertStyle}`}>
                      <div className="flex justify-between items-center text-[8px] opacity-75 font-bold">
                        <span className="uppercase tracking-wider">{log.category} REGISTERED</span>
                        <span>{log.timestamp.slice(0, 10)} @ {log.timestamp.slice(11, 19)}</span>
                      </div>
                      
                      <div className="flex justify-between items-start gap-3">
                        <h4 className="text-[10px] font-black uppercase tracking-wide leading-tight">{log.title}</h4>
                        <span className="text-[8px] uppercase tracking-wider bg-zinc-950 px-1 py-0.2 border border-border-machina text-zinc-400 font-bold whitespace-nowrap">
                          {log.role} ACCESS
                        </span>
                      </div>

                      <p className="text-[9.5px] leading-relaxed text-text-secondary mt-1 font-semibold uppercase">
                        {log.description}
                      </p>

                      <div className="pt-1.5 border-t border-border-machina/10 mt-1.5 flex items-center justify-between text-[8px] text-zinc-500 font-bold uppercase">
                        <span>OPERATOR: {log.workerName}</span>
                        <span>PORT-KEY: {log.userEmail}</span>
                      </div>
                    </div>
                  );
                })}

                {shiftLogEntries.length === 0 && (
                  <div className="text-center py-12 text-text-secondary uppercase text-[10px]">
                    No security transaction logs cached in static application state memory.
                  </div>
                )}
              </div>
            </div>
          </IndustrialWidget>
        </div>

        {/* Column 3: STAFF ROLES & ASSIGNED DUTIES (The requesting section) */}
        <div className="lg:col-span-4">
          <IndustrialWidget
            title="STAFF ROLES & ASSIGNED DUTIES"
            subtitle="Detailed manifest of active work profiles, structural assignments, and duty targets"
          >
            <div className="bg-[#0F0F0D] border border-border-machina rounded-[2px] p-4 flex flex-col h-[580px] overflow-hidden">
              <div className="mb-3.5 bg-bg-machina border border-border-machina p-3 rounded-[2.5px] text-[9.5px] font-bold text-text-secondary select-none">
                <div className="flex justify-between items-center mb-1">
                  <span className="uppercase tracking-wider">CURRENT SECURITY POLICY:</span>
                  <span className="text-accent-machina uppercase tracking-widest font-black">
                    [{user.role.toUpperCase()}] HIERARCHY
                  </span>
                </div>
                <p className="text-[8.5px] text-zinc-500 uppercase leading-relaxed">
                  {user.role === "Admin"
                    ? "Full administrative system override: View all active Specialist, Engineer, Administrator, and Observer duty assignments."
                    : "Manager-level boundary active: Displaying Field Operations Specialist (Worker) and Floor Observer (Viewer) duty matrices exclusively."}
                </p>
              </div>

              {/* Personnel detail rosters */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
                {registeredWorkers
                  .filter((w) => {
                    if (user.role === "Admin") return true;
                    // Managers only get workers and viewers data
                    if (user.role === "Manager") {
                      return w.role === "Worker" || w.role === "Viewer";
                    }
                    return false;
                  })
                  .map((w, index) => {
                    // Match visual branding based on employee role
                    let badgeColor = "border-zinc-800 text-zinc-400";
                    let accentLine = "bg-zinc-800";
                    if (w.role === "Admin") {
                      badgeColor = "border-danger-machina/60 text-danger-machina bg-red-950/20";
                      accentLine = "bg-danger-machina/40";
                    } else if (w.role === "Manager") {
                      badgeColor = "border-accent-machina/65 text-accent-machina bg-amber-950/25";
                      accentLine = "bg-accent-machina/40";
                    } else if (w.role === "Worker") {
                      badgeColor = "border-sky-500/40 text-sky-400 bg-sky-950/20";
                      accentLine = "bg-sky-500/30";
                    } else if (w.role === "Viewer") {
                      badgeColor = "border-emerald-500/40 text-emerald-400 bg-emerald-950/20";
                      accentLine = "bg-emerald-500/30";
                    }

                    return (
                      <div 
                        key={w.id} 
                        className="bg-bg-machina border border-border-machina/90 p-3 rounded-[2.5px] transition-all hover:bg-hover-machina relative flex flex-col gap-2 overflow-hidden"
                      >
                        {/* Decorative side accent tag */}
                        <div className={`absolute top-0 left-0 bottom-0 w-[3px] ${accentLine}`}></div>

                        <div className="flex justify-between items-start gap-2 pl-1.5">
                          <div className="space-y-0.5 max-w-[70%]">
                            <span className="text-[10px] text-text-primary font-black uppercase leading-tight hover:text-accent-machina transition-colors">
                              {w.full_name}
                            </span>
                            <span className="text-[7.5px] text-zinc-500 uppercase font-black tracking-wider block">
                              {w.email.toLowerCase()}
                            </span>
                          </div>
                          
                          <span className={`text-[7.5px] font-black border px-2 py-0.5 rounded-[1px] tracking-wider uppercase whitespace-nowrap ${badgeColor}`}>
                            {w.role}
                          </span>
                        </div>

                        {/* Position Description */}
                        <div className="bg-[#0F0F0D] border border-border-machina/50 p-2 text-[8px] pl-2.5 font-bold uppercase rounded-[1.5px] flex flex-col gap-1 select-none">
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500 font-black">ROLE INDEX:</span>
                            <span className="text-text-primary font-black tracking-wide bg-zinc-900 px-1 py-0.1 border border-border-machina">
                              {w.position || "FIELD OPERATIONS INDUCTEE"}
                            </span>
                          </div>
                          <div className="text-[8.5px] text-zinc-400 leading-relaxed font-bold tracking-normal pt-1 lowercase first-letter:uppercase">
                            {w.work_description || "Assigned standard factory operations and monitoring of system-defined PLC channels."}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </IndustrialWidget>
        </div>

      </div>
    </div>
  );
}
